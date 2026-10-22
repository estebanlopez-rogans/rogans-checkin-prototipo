/* Panel de recepción — prototipo, sin Odoo */
(function () {
  const S = window.odooService, D = window.RogansData, $ = s => document.querySelector(s);
  const ESTADOS = { espera: 'En espera', consulta: 'En consulta', atendido: 'Atendido' };
  let filtro = 'todos', q = '', lista = [], abierto = null, tab = 'resumen';

  async function cargar(auto) { lista = await S.listarCheckinsHoy(); pintarLista(); if (abierto && !(auto === true && tab === 'datos')) pintarDrawer(); }

  function pagoBadge(c) {
    if (c.saldo > 0) return `<span class="tag bad">Pendiente ${U.cop(c.saldo)}</span>`;
    if (c.pagoIntencion === 'pagado' || (c.compra && c.compra.pagado)) return `<span class="tag ok">Pagado · Bold</span>`;
    return `<span class="tag ok">Al día</span>`;
  }
  function flags(c) {
    let h = '';
    if (c.paqueteNoListado) h += `<span class="tag bad flag">Pide paquete no listado</span>`;
    if (c.compra) h += `<span class="tag ${c.compra.pagado ? 'ok' : 'info'} flag">Compró en kiosco: ${U.esc(S.producto(c.compra.productId).nombre)}${c.compra.pagado ? ' · pagado Bold' : ' · cobrar'}</span>`;
    return h;
  }
  function planCell(c) {
    const f = flags(c);
    // Plan principal: el más antiguo activo que no sea la compra de hoy
    const otros = c.paquetes.filter(p => !(c.compra && p.id === c.compra.paqueteId));
    if (otros.length) { const p = otros[0]; return `<b>${U.esc(p.nombre)}</b><br><small style="color:var(--muted)">${p.sesionesUsadas}/${p.sesionesTotal} sesiones</small>${f ? '<br>' + f : ''}`; }
    if (f) return f;
    if (c.interes) return `<span class="tag info">Interés: ${U.esc(S.producto(c.interes).nombre)}</span>`;
    return `<span class="tag warn">Sin paquete</span>`;
  }

  function pintarLista() {
    const k = { total: lista.length, espera: 0, consulta: 0, atendido: 0, saldo: 0 };
    lista.forEach(c => { k[c.estado]++; k.saldo += c.saldo; });
    $('#kpis').innerHTML = `<div class="kpi"><small>Check-ins hoy</small><b>${k.total}</b></div><div class="kpi"><small>En espera</small><b>${k.espera}</b></div>
      <div class="kpi"><small>En consulta</small><b>${k.consulta}</b></div><div class="kpi"><small>Atendidos</small><b>${k.atendido}</b></div>
      <div class="kpi red"><small>Por cobrar (pacientes de hoy)</small><b>${U.cop(k.saldo)}</b></div>`;
    const fs = [['todos', 'Todos'], ['espera', 'En espera'], ['consulta', 'En consulta'], ['atendido', 'Atendidos'], ['saldo', 'Con saldo'], ['nolistado', 'Paquete no listado']];
    $('#filters').innerHTML = fs.map(([id, n]) => `<button data-f="${id}" class="${filtro === id ? 'on' : ''}">${n}</button>`).join('');
    const qq = q.toLowerCase().replace(/\./g, '');
    const vis = lista.filter(c => (filtro === 'todos' || (filtro === 'saldo' ? c.saldo > 0 : filtro === 'nolistado' ? c.paqueteNoListado : c.estado === filtro)) &&
      (!qq || c.paciente.documento.includes(qq) || c.paciente.nombre.toLowerCase().includes(qq)));
    $('#rows').innerHTML = vis.length ? vis.map(c => `<tr data-id="${c.id}">
      <td class="turn">${c.turno}</td><td>${c.hora}<br><small style="color:var(--muted)">${c.origen === 'kiosco' ? 'Kiosco' : 'Recepción'}</small></td>
      <td class="pname"><b>${U.esc(c.paciente.nombre)}</b><small>${c.paciente.tipoDoc} ${U.docFmt(c.paciente.documento)}</small></td>
      <td>${U.esc(c.motivo)}</td><td>${planCell(c)}</td><td>${pagoBadge(c)}</td>
      <td><select data-estado="${c.id}">${Object.entries(ESTADOS).map(([v, n]) => `<option value="${v}" ${v === c.estado ? 'selected' : ''}>${n}</option>`).join('')}</select></td>
      <td><button class="btn sm ghost" data-ver="${c.id}">Ver</button></td></tr>`).join('')
      : `<tr class="empty-row"><td colspan="8">Sin check-ins que coincidan.</td></tr>`;
    lookup();
  }

  // Búsqueda de pacientes que no están en la lista de hoy (check-in manual)
  let lookupSeq = 0;
  async function lookup() {
    const el = $('#lookup'), num = q.replace(/\D/g, '');
    if (num.length < 5 || lista.some(c => c.paciente.documento === num)) { el.innerHTML = ''; return; }
    const my = ++lookupSeq; el.innerHTML = `<div class="lookup-result">Consultando en Odoo (simulado)…</div>`;
    const p = await S.buscarPacientePorCedula(null, num); if (my !== lookupSeq) return;
    el.innerHTML = p
      ? `<div class="lookup-result"><div class="avatar" style="width:40px;height:40px;font-size:.9rem">${U.iniciales(p.nombre)}</div><div class="sp"><b>${U.esc(p.nombre)}</b> · ${p.tipoDoc} ${U.docFmt(p.documento)}<br><small>Existe en Odoo, aún no ha hecho check-in hoy.</small></div><button class="btn sm dark" id="lk-go">Hacer check-in</button></div>`
      : `<div class="lookup-result"><div class="sp"><b>Documento ${U.docFmt(num)} no encontrado.</b><br><small>Paciente nuevo: regístralo y crea su check-in.</small></div><button class="btn sm dark" id="lk-new">Registrar paciente nuevo</button></div>`;
    if (p) $('#lk-go').onclick = async () => { const c = await S.registrarCheckin({ partnerId: p.id, origen: 'recepcion' }); q = ''; $('#q').value = ''; await cargar(); abrir(c.id); U.toast('Check-in ' + c.turno + ' creado'); };
    else $('#lk-new').onclick = () => modalNuevo(num);
  }

  // ---------------- Drawer de paciente ----------------
  function abrir(id) { abierto = id; tab = 'resumen'; pintarDrawer(); }
  function cerrar() { abierto = null; renderSeq++; $('#drawer-root').innerHTML = ''; }

  let renderSeq = 0;
  async function pintarDrawer() {
    const c = lista.find(x => x.id === abierto); if (!c) return cerrar();
    const p = c.paciente, mio = ++renderSeq, idTab = tab;
    const [facturas, pagos, paquetes, historial] = await Promise.all([S.obtenerFacturas(p.id), S.obtenerPagos(p.id), S.obtenerPaquetesPaciente(p.id), S.obtenerHistorial(p.id)]);
    // Evita que un render tardío reabra el panel tras cerrarlo o pise uno más reciente.
    if (mio !== renderSeq || abierto !== c.id || tab !== idTab) return;
    const pend = facturas.filter(f => f.residual > 0), saldo = pend.reduce((a, f) => a + f.residual, 0);
    const activos = paquetes.filter(x => x.estado === 'activo');
    const tabs = [['resumen', 'Resumen'], ['datos', 'Datos'], ['pagos', 'Pagos'], ['paquetes', 'Paquetes'], ['historial', 'Historial']];
    const saldoBox = `<div class="saldo ${saldo > 0 ? 'bad' : 'ok'}"><div class="grow"><small>${saldo > 0 ? 'Saldo pendiente' : 'Estado de cuenta'}</small><br><b>${saldo > 0 ? U.cop(saldo) : 'Al día'}</b></div>${saldo > 0 ? `<button class="btn sm dark" data-pagar="${pend[0].id}">Registrar pago</button>` : ''}</div>`;
    const factRow = f => `<div class="row"><div class="grow"><b>${U.esc(f.concepto)}</b><small>${f.name} · ${U.fecha(f.fecha)} · total ${U.cop(f.total)}</small></div>
      ${f.residual > 0 ? `<span class="amt" style="color:var(--red)">${U.cop(f.residual)}</span>${U.vencida(f.vence) ? '<span class="tag bad">Vencida</span>' : '<span class="tag warn">Pendiente</span>'}<button class="btn sm" data-pagar="${f.id}">Pagar</button>` : '<span class="tag ok">Pagada</span>'}</div>`;
    const paqRow = x => `<div class="row"><div class="grow"><b>${U.esc(x.nombre)}</b><small>${x.orderName} · desde ${U.fecha(x.fecha)}</small>
        <div class="progress" style="max-width:260px"><i style="width:${Math.round(x.sesionesUsadas / x.sesionesTotal * 100)}%"></i></div><small>${x.sesionesUsadas}/${x.sesionesTotal} sesiones</small></div>
        ${x.estado === 'activo' ? `<span class="tag ok">Activo</span><button class="btn sm ghost" data-sesion="${x.id}">+ Sesión hoy</button>` : '<span class="tag mute">Finalizado</span>'}</div>`;
    let contenido = '';
    if (tab === 'resumen') {
      const int = c.interes && !activos.some(a => a.productId === c.interes) ? S.producto(c.interes) : null;
      const alerta = c.paqueteNoListado ? `<div class="alert-nl"><b>🔎 Pide un paquete que no está en el catálogo del kiosco</b><small>Pregúntale qué busca y véndelo desde “Asignar / vender paquete”, o déjalo anotado para el médico.</small><button class="btn sm dark" data-vender="">Asignar / vender paquete</button></div>` : '';
      const compraBox = c.compra ? `<div class="box"><h4>Compra hecha en el kiosco</h4><div class="row"><div class="grow"><b>${U.esc(S.producto(c.compra.productId).nombre)} · ${U.cop(c.compra.total)}</b><small>${U.esc(c.compra.factura || '')} · ${c.compra.pagado ? 'pagado con link Bold' : 'eligió pagar en recepción'}</small></div>${c.compra.pagado ? '<span class="tag ok">Pagado · Bold</span>' : (pend.some(f => f.id === c.compra.facturaId) ? `<button class="btn sm dark" data-pagar="${c.compra.facturaId}">Cobrar</button>` : '<span class="tag ok">Pagado</span>')}</div></div>` : '';
      contenido = `${alerta}${saldoBox}${compraBox}
        <div class="box"><h4>Plan / paquete <span class="sp"></span><button class="btn sm ghost" data-vender="">Asignar / vender paquete</button></h4>
          ${activos.length ? activos.map(paqRow).join('') : `<div class="row"><div class="grow"><b>Sin paquete activo</b><small>Ofrecer: capilar (alopecia), facial, corporal u otras líneas.</small></div><span class="tag warn">Sin paquete</span></div>`}
          ${int ? `<div class="row"><div class="grow"><b>Interés marcado en el kiosco: ${U.esc(int.nombre)}</b><small>${U.cop(int.precio)}${int.precioEjemplo ? ' · precio de ejemplo' : ''}</small></div><button class="btn sm dark" data-vender="${int.id}">Vender este paquete</button></div>` : ''}</div>
        <div class="box"><h4>Check-in</h4><div class="row"><div class="grow"><b>Turno ${c.turno} · ${c.hora}</b><small>${U.esc(c.motivo)} · origen ${c.origen === 'kiosco' ? 'kiosco' : 'recepción'}</small></div>${c.pagoIntencion === 'bold' ? '<span class="tag info">Quiere pagar con Bold</span>' : c.pagoIntencion === 'recepcion' ? '<span class="tag info">Paga en recepción</span>' : ''}</div>
          <div class="row"><div class="grow"><b>Contacto</b><small>${U.esc(p.celular || '—')} · ${U.esc(p.correo || '—')}</small></div>${p.autorizaDatos ? '<span class="tag ok">Ley 1581 ✓</span>' : '<span class="tag bad">Sin autorización de datos</span>'}</div></div>`;
    } else if (tab === 'datos') {
      const f = (id, label, val, attrs = '', cls = '') => `<div class="field ${cls}"><label>${label}</label><input data-k="${id}" value="${U.esc(val || '')}" ${attrs}></div>`;
      contenido = `<div class="form" id="dform">
        ${f('nombre', 'Nombre completo', p.nombre, '', 's3')}
        <div class="field"><label>Tipo de documento</label><select data-k="tipoDoc">${D.TIPOS_DOC.map(t => `<option ${t.id === p.tipoDoc ? 'selected' : ''} value="${t.id}">${t.id} · ${t.nombre}</option>`).join('')}</select></div>
        ${f('documento', 'Número', p.documento, 'inputmode="numeric"')}
        ${f('celular', 'Celular', p.celular)}${f('correo', 'Correo', p.correo, 'type="email"')}
        ${f('fechaNacimiento', 'Fecha de nacimiento', p.fechaNacimiento, 'type="date"')}
        <div class="field"><label>EPS / aseguradora</label><select data-k="eps">${D.EPS.map(e => `<option ${e === (p.eps || '') ? 'selected' : ''} value="${U.esc(e)}">${e || '—'}</option>`).join('')}</select></div>
        ${f('direccion', 'Dirección', p.direccion)}${f('ciudad', 'Ciudad', p.ciudad)}
        ${f('contactoEmergencia', 'Contacto de emergencia', p.contactoEmergencia, '', 's3')}
        <div class="field s3"><label>Motivo de la visita (hoy)</label><select data-c="motivo">${D.MOTIVOS.map(m => `<option ${m === c.motivo ? 'selected' : ''}>${m}</option>`).join('')}</select></div>
        <label class="consent"><input type="checkbox" data-k="autorizaDatos" ${p.autorizaDatos ? 'checked' : ''}><span>Autoriza tratamiento de datos (Ley 1581 de 2012)${p.autorizaFecha ? ' · ' + U.fecha(p.autorizaFecha) : ''}</span></label>
      </div><div style="display:flex;justify-content:flex-end"><button class="btn sm dark" id="guardar">Guardar datos</button></div>`;
    } else if (tab === 'pagos') {
      contenido = `${saldoBox}<div class="box"><h4>Facturas (account.move)</h4>${facturas.length ? facturas.map(factRow).join('') : '<div class="row">Sin facturas.</div>'}</div>
        <div class="box"><h4>Pagos registrados (account.payment)</h4>${pagos.length ? pagos.slice().reverse().map(x => `<div class="row"><div class="grow"><b>${U.cop(x.monto)}</b><small>${x.name} · ${U.fecha(x.fecha)} · ${U.esc(x.referencia || 'sin referencia')}</small></div><span class="tag info">${(D.METODOS_PAGO.find(m => m.id === x.metodo) || {}).nombre || x.metodo}</span></div>`).join('') : '<div class="row">Sin pagos.</div>'}</div>`;
    } else if (tab === 'paquetes') {
      contenido = `<div class="box"><h4>Paquetes del paciente <span class="sp"></span><button class="btn sm dark" data-vender="">Asignar / vender paquete</button></h4>${paquetes.length ? paquetes.map(paqRow).join('') : '<div class="row"><div class="grow"><b>Nunca ha comprado un paquete</b><small>El kiosco le mostró el catálogo.</small></div></div>'}</div>`;
    } else {
      contenido = `<div class="box"><h4>Historial de visitas</h4>${historial.length ? historial.map(v => `<div class="row"><div class="grow"><b>${U.esc(v.motivo)}</b><small>${U.esc(v.nota || '')}</small></div><span>${U.fecha(v.fecha)}</span></div>`).join('') : '<div class="row">Primera visita.</div>'}</div>`;
    }
    $('#drawer-root').innerHTML = `<div class="scrim" id="scrim"></div><aside class="drawer" role="dialog" aria-label="Paciente">
      <div class="d-head"><div class="avatar">${U.iniciales(p.nombre)}</div><div><h2>${U.esc(p.nombre)}</h2><small>${p.tipoDoc} ${U.docFmt(p.documento)} · Turno ${c.turno}</small></div><button class="x" id="x">✕</button></div>
      <div class="d-quick"><span class="lbl">Estado</span><div class="seg" id="seg">${Object.entries(ESTADOS).map(([v, n]) => `<button data-e="${v}" class="${v === c.estado ? 'on' : ''}">${n}</button>`).join('')}</div>
        <span class="sp" style="flex:1"></span><button class="btn sm ${c.asistencia ? '' : 'ghost'}" id="asis">${c.asistencia ? '✓ Asistió' : 'Marcar asistencia'}</button></div>
      <nav class="d-tabs">${tabs.map(([id, n]) => `<button data-tab="${id}" class="${id === tab ? 'on' : ''}">${n}</button>`).join('')}</nav>
      <div class="d-body">${contenido}</div></aside>`;
    $('#x').onclick = cerrar; $('#scrim').onclick = cerrar;
    document.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { tab = b.dataset.tab; pintarDrawer(); });
    $('#seg').onclick = async e => { const b = e.target.closest('button'); if (!b) return; await S.actualizarCheckin(c.id, { estado: b.dataset.e }); U.toast('Estado: ' + ESTADOS[b.dataset.e]); cargar(); };
    $('#asis').onclick = async () => { await S.actualizarCheckin(c.id, { asistencia: !c.asistencia }); cargar(); };
    document.querySelectorAll('[data-pagar]').forEach(b => b.onclick = () => modalPago(p, facturas, Number(b.dataset.pagar)));
    document.querySelectorAll('[data-vender]').forEach(b => b.onclick = () => modalVender(p, b.dataset.vender || c.interes));
    document.querySelectorAll('[data-sesion]').forEach(b => b.onclick = async () => { const x = await S.registrarSesion(Number(b.dataset.sesion)); U.toast(`Sesión ${x.sesionesUsadas}/${x.sesionesTotal} registrada`); cargar(); });
    const g = $('#guardar');
    if (g) g.onclick = async () => {
      const datos = {}; document.querySelectorAll('#dform [data-k]').forEach(el => datos[el.dataset.k] = el.type === 'checkbox' ? el.checked : el.value);
      await S.actualizarPaciente(p.id, datos);
      const m = document.querySelector('#dform [data-c="motivo"]'); if (m) await S.actualizarCheckin(c.id, { motivo: m.value });
      U.toast('Datos guardados (simulado: res.partner.write)'); cargar();
    };
  }

  // ---------------- Modales ----------------
  function modal(html) { $('#modal-root').innerHTML = `<div class="modal" id="mbg"><div class="m">${html}</div></div>`; $('#mbg').onclick = e => { if (e.target.id === 'mbg') cerrarModal(); }; }
  function cerrarModal() { $('#modal-root').innerHTML = ''; }

  function modalPago(p, facturas, facturaId) {
    const pend = facturas.filter(f => f.residual > 0); let metodo = 'efectivo';
    const notas = { efectivo: 'Se registra en el diario Caja. Entregar recibo.', tarjeta: 'Cobrar en el datáfono y anotar el número de aprobación.', transferencia: 'Verificar el comprobante antes de confirmar.',
      bold: 'Se genera un link de pago Bold y se envía por WhatsApp/correo al paciente (simulado). En producción se confirma con el webhook de Bold.', mercadopago: 'Link o QR de Mercado Pago (simulado). En producción se confirma con el webhook.',
      addi: 'Financiación: el paciente solicita el crédito con su cédula; se registra cuando Addi aprueba y desembolsa.', sistecredito: 'Financiación: aprobación con cédula en Sistecrédito; registrar con el número de crédito.' };
    const draw = () => {
      const f = pend.find(x => x.id === facturaId) || pend[0];
      modal(`<h3>Registrar pago</h3><p class="sub">${U.esc(p.nombre)} · ${p.tipoDoc} ${U.docFmt(p.documento)} <span class="demo-badge">simulado</span></p>
        <div class="form">
          <div class="field s3"><label>Factura</label><select id="mf">${pend.map(x => `<option value="${x.id}" ${x.id === f.id ? 'selected' : ''}>${x.name} · ${U.esc(x.concepto)} · saldo ${U.cop(x.residual)}</option>`).join('')}</select></div>
          <div class="field"><label>Monto (COP)</label><input id="mm" inputmode="numeric" value="${f.residual}"></div>
          <div class="field"><label>Referencia / aprobación</label><input id="mr" placeholder="Ej. 123456"></div>
        </div>
        <label style="font-size:.8rem;font-weight:600;color:var(--muted);display:block;margin-top:1rem">Método de pago</label>
        <div class="methods" id="mmet">${D.METODOS_PAGO.map(m => `<button data-m="${m.id}" class="${m.id === metodo ? 'on' : ''}"><span>${m.icono}</span>${m.nombre}</button>`).join('')}</div>
        <div class="method-note" id="mnote">${notas[metodo]}</div>
        <div class="m-actions"><button class="btn sm ghost" id="mc">Cancelar</button><button class="btn sm dark" id="mok">${metodo === 'bold' ? 'Generar link y marcar pagado (demo)' : 'Confirmar pago de ' + U.cop(f.residual)}</button></div>`);
      $('#mf').onchange = e => { facturaId = Number(e.target.value); draw(); };
      $('#mm').oninput = e => { $('#mok').textContent = metodo === 'bold' ? 'Generar link y marcar pagado (demo)' : 'Confirmar pago de ' + U.cop(e.target.value.replace(/\D/g, '')); };
      $('#mmet').onclick = e => { const b = e.target.closest('button'); if (!b) return; metodo = b.dataset.m; const monto = $('#mm').value, ref = $('#mr').value; draw(); $('#mm').value = monto; $('#mr').value = ref; $('#mm').oninput({ target: $('#mm') }); };
      $('#mc').onclick = cerrarModal;
      $('#mok').onclick = async () => {
        const monto = Number($('#mm').value.replace(/\D/g, '')); if (!monto) return U.toast('Ingresa un monto');
        $('#mok').disabled = true; $('#mok').textContent = 'Registrando…';
        const r = await S.registrarPago({ facturaId: Number($('#mf').value), monto, metodo, referencia: $('#mr').value });
        cerrarModal(); U.toast(`Pago ${r.pago.name} por ${U.cop(r.pago.monto)} registrado`); cargar();
      };
    };
    draw();
  }

  async function modalVender(p, preId) {
    const cat = await S.obtenerPaquetes();
    let sel = preId || null, linea = sel ? S.producto(sel).linea : 'capilar';
    const lineas = D.LINEAS.concat([{ id: 'valoracion', nombre: 'Valoraciones' }]);
    const draw = () => {
      modal(`<h3>Asignar / vender paquete</h3><p class="sub">${U.esc(p.nombre)} · crea pedido (sale.order) y factura con saldo pendiente <span class="demo-badge">simulado</span></p>
        <div class="filters" id="vl" style="flex-wrap:wrap">${lineas.map(l => `<button data-l="${l.id}" class="${l.id === linea ? 'on' : ''}">${l.nombre}</button>`).join('')}</div>
        <div class="pkpick" id="vp">${cat.filter(x => x.linea === linea).map(x => `<button data-id="${x.id}" class="${x.id === sel ? 'on' : ''}"><div class="grow"><b>${U.esc(x.nombre)}</b><br><small>${U.esc(x.incluye.slice(0, 3).join(' · '))}</small></div>
          <div style="text-align:right"><b>${U.cop(x.precio)}</b>${x.precioEjemplo ? '<br><span class="tag ex">precio de ejemplo</span>' : ''}${x.gratisPromo ? '<br><span class="tag ok">gratis por promo</span>' : ''}</div></button>`).join('')}</div>
        <div class="m-actions"><button class="btn sm ghost" id="mc">Cancelar</button><button class="btn sm ghost" id="mv" ${sel ? '' : 'disabled'}>Asignar (pago después)</button><button class="btn sm dark" id="mvp" ${sel ? '' : 'disabled'}>Asignar y cobrar ahora</button></div>`);
      $('#vl').onclick = e => { const b = e.target.closest('button'); if (b) { linea = b.dataset.l; draw(); } };
      $('#vp').onclick = e => { const b = e.target.closest('button'); if (b) { sel = b.dataset.id; draw(); } };
      $('#mc').onclick = cerrarModal;
      const vender = async cobrar => {
        const r = await S.venderPaquete(p.id, sel); U.toast(`${r.paquete.nombre} asignado · ${r.factura.name}`);
        await cargar();
        if (cobrar) { const fs = await S.obtenerFacturas(p.id); modalPago(p, fs, r.factura.id); } else cerrarModal();
      };
      $('#mv').onclick = () => vender(false); $('#mvp').onclick = () => vender(true);
    };
    draw();
  }

  function modalNuevo(num) {
    modal(`<h3>Registrar paciente nuevo</h3><p class="sub">Se crea en Odoo (res.partner) y se genera el check-in <span class="demo-badge">simulado</span></p>
      <div class="form">
        <div class="field"><label>Tipo</label><select id="nt">${D.TIPOS_DOC.map(t => `<option value="${t.id}">${t.id} · ${t.nombre}</option>`).join('')}</select></div>
        <div class="field"><label>Número</label><input id="nd" value="${U.esc(num)}"></div>
        <div class="field s3"><label>Nombre completo</label><input id="nn"></div>
        <div class="field"><label>Celular</label><input id="nc" inputmode="tel"></div>
        <div class="field"><label>Correo</label><input id="ne" type="email"></div>
        <div class="field s3"><label>Motivo</label><select id="nm">${D.MOTIVOS.map(m => `<option>${m}</option>`).join('')}</select></div>
        <label class="consent"><input type="checkbox" id="na"><span>El paciente autoriza el tratamiento de datos (Ley 1581 de 2012)</span></label>
      </div>
      <div class="m-actions"><button class="btn sm ghost" id="mc">Cancelar</button><button class="btn sm dark" id="mok">Crear y hacer check-in</button></div>`);
    $('#mc').onclick = cerrarModal;
    $('#mok').onclick = async () => {
      if (!$('#nn').value.trim() || !$('#nc').value.trim()) return U.toast('Nombre y celular son obligatorios');
      if (!$('#na').checked) return U.toast('Falta la autorización de datos (Ley 1581)');
      const p = await S.crearPaciente({ tipoDoc: $('#nt').value, documento: $('#nd').value.replace(/\D/g, ''), nombre: $('#nn').value.trim(), celular: $('#nc').value, correo: $('#ne').value, autorizaDatos: true });
      const c = await S.registrarCheckin({ partnerId: p.id, motivo: $('#nm').value, origen: 'recepcion' });
      cerrarModal(); q = ''; $('#q').value = ''; await cargar(); abrir(c.id); U.toast('Paciente creado · turno ' + c.turno);
    };
  }

  // ---------------- Eventos ----------------
  $('#q').oninput = e => { q = e.target.value.trim(); pintarLista(); };
  $('#filters').onclick = e => { const b = e.target.closest('button'); if (b) { filtro = b.dataset.f; pintarLista(); } };
  $('#rows').onclick = e => {
    if (e.target.closest('select')) return;
    const tr = e.target.closest('tr[data-id]'); if (tr) abrir(Number(tr.dataset.id));
  };
  $('#rows').onchange = async e => { const s = e.target.closest('select[data-estado]'); if (!s) return; await S.actualizarCheckin(Number(s.dataset.estado), { estado: s.value }); U.toast('Estado: ' + ESTADOS[s.value]); cargar(); };
  $('#nuevo').onclick = () => { $('#q').focus(); U.toast('Escribe la cédula del paciente en el buscador'); };
  $('#reset').onclick = e => { e.preventDefault(); if (confirm('¿Volver a los datos de ejemplo? Se borran los cambios del demo.')) { S.reiniciarDemo(); cerrar(); cargar(); } };
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { if ($('#modal-root').innerHTML) cerrarModal(); else cerrar(); } });
  window.addEventListener('storage', () => cargar(true)); // cambios hechos desde el kiosco en otra pestaña
  setInterval(() => cargar(true), 10000);
  cargar();
})();
