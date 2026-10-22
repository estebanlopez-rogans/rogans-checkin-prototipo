/* Check-in tipo kiosco (iPad horizontal) — prototipo, sin Odoo */
(function () {
  const S = window.odooService, D = window.RogansData, $ = s => document.querySelector(s);
  const body = $('#kbody'), stepsEl = $('#ksteps');
  let st, timer;

  function reset() {
    clearInterval(timer);
    st = { tipoDoc: 'CC', numero: '', paciente: null, nuevo: false, pendientes: [], paquetes: [], linea: 'capilar', interes: null, pagoIntencion: 'recepcion', motivo: D.MOTIVOS[0], motivoId: null, modo: 'cita', compraSel: null, compraPago: 'bold', compra: null, checkin: null, pagadoAhora: false };
  }
  function setSteps(n) { stepsEl.innerHTML = [1, 2, 3, 4, 5, 6].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join(''); stepsEl.style.visibility = n ? 'visible' : 'hidden'; }
  function render(html, step) { body.innerHTML = html; body.scrollTop = 0; setSteps(step); }

  // ---------------- 1. Bienvenida ----------------
  function bienvenida() {
    reset();
    render(`<section class="screen welcome" data-screen="bienvenida">
      <img class="logo" src="assets/img/logo-blanco.svg" alt="Rogans">
      <h1>Bienvenido a <em>Rogans</em>. Haz tu check-in aquí.</h1>
      <p>Solo necesitas tu documento de identidad. Toma menos de un minuto.</p>
      <button class="btn" id="go">Iniciar check-in →</button>
      <div class="tiles">
        <div class="tile"><span class="n">1</span><div><b>Tu documento</b><small>Te buscamos en el sistema</small></div></div>
        <div class="tile"><span class="n">2</span><div><b>Confirma tus datos</b><small>Celular, correo y autorización</small></div></div>
        <div class="tile"><span class="n">3</span><div><b>Revisa tu cuenta</b><small>Pagos y tu plan de tratamiento</small></div></div>
        <div class="tile"><span class="n">4</span><div><b>Recibe tu turno</b><small>Y dirígete a recepción</small></div></div>
      </div>
      <div class="meta"><span>Autopista Norte # 106-71 · Bogotá</span></div>
    </section>`, 0);
    $('#go').onclick = documento;
  }

  // ---------------- 2. Documento ----------------
  function documento() {
    render(`<section class="screen" data-screen="documento">
      <h1>Ingresa tu <em>documento</em></h1>
      <p class="lead">Selecciona el tipo y escribe el número sin puntos.</p>
      <div class="docgrid">
        <div>
          <div class="tipos" id="tipos">${D.TIPOS_DOC.map(t => `<button data-t="${t.id}" class="${t.id === st.tipoDoc ? 'on' : ''}">${t.id}<small>${t.nombre}</small></button>`).join('')}</div>
          <div class="docdisplay" id="disp"></div>
          <div class="err" id="err"></div>
          <div class="demo-hint">Demo · documentos de ejemplo:
            <div class="chips">
              <button data-demo="CC:1010101010">CC 1010101010 · saldo pendiente</button>
              <button data-demo="CC:52000111">CC 52000111 · al día, plan activo</button>
              <button data-demo="CC:79000222">CC 79000222 · sin paquete</button>
              <button data-demo="CE:600123">CE 600123 · pendiente + sin paquete</button>
              <button data-demo="CC:1234567890">CC 1234567890 · paciente nuevo</button>
            </div></div>
        </div>
        <div class="keypad" id="keypad">${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button data-k="${n}">${n}</button>`).join('')}
          <button class="fn" data-k="clear">Borrar todo</button><button data-k="0">0</button><button class="fn" data-k="back">⌫</button></div>
      </div>
      <div class="k-actions"><button class="btn ghost left" id="back">← Volver</button><button class="btn dark" id="next">Buscar mis datos</button></div>
    </section>`, 1);
    const disp = $('#disp'), next = $('#next');
    const upd = () => {
      disp.className = 'docdisplay' + (st.numero ? '' : ' empty');
      disp.innerHTML = st.numero ? `${U.docFmt(st.numero)}<span class="caret"></span>` : 'Número de documento';
      next.disabled = st.numero.length < 5; $('#err').textContent = '';
    };
    $('#tipos').onclick = e => { const b = e.target.closest('button'); if (!b) return; st.tipoDoc = b.dataset.t; documento(); };
    $('#keypad').onclick = e => {
      const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k;
      if (k === 'clear') st.numero = ''; else if (k === 'back') st.numero = st.numero.slice(0, -1); else if (st.numero.length < 12) st.numero += k;
      upd();
    };
    document.querySelector('.demo-hint').onclick = e => { const b = e.target.closest('button'); if (!b) return; const [t, n] = b.dataset.demo.split(':'); st.tipoDoc = t; st.numero = n; documento(); };
    $('#back').onclick = bienvenida; next.onclick = consultar; upd();
  }

  // ---------------- 3. Consultando ----------------
  async function consultar() {
    render(`<section class="screen loading" data-screen="consultando">
      <div class="spinner"></div><h1>Consultando en Odoo…</h1>
      <p class="lead">${st.tipoDoc} ${U.docFmt(st.numero)}</p>
      <div class="steps"><div id="s1">Buscando paciente</div><div id="s2">Revisando estado de cuenta</div><div id="s3">Revisando paquetes</div></div>
      <span class="demo-badge" style="margin-top:1.4rem">Simulado — sin conexión a Odoo</span>
    </section>`, 1);
    const on = id => { const el = document.getElementById(id); if (el) el.classList.add('on'); };
    const p = await S.buscarPacientePorCedula(st.tipoDoc, st.numero); on('s1');
    if (p) {
      st.paciente = p; st.nuevo = false;
      st.pendientes = await S.obtenerPagosPendientes(p.id); on('s2');
      st.paquetes = (await S.obtenerPaquetesPaciente(p.id)).filter(x => x.estado === 'activo'); on('s3');
    } else { st.paciente = null; st.nuevo = true; st.pendientes = []; st.paquetes = []; on('s2'); on('s3'); }
    setTimeout(datos, 350);
  }

  // ---------------- 4. Datos ----------------
  function datos() {
    const p = st.paciente || { tipoDoc: st.tipoDoc, documento: st.numero };
    const f = (id, label, val, attrs = '', cls = '') => `<div class="field ${cls}" data-f="${id}"><label for="f_${id}">${label}</label><input id="f_${id}" value="${U.esc(val || '')}" ${attrs}></div>`;
    render(`<section class="screen" data-screen="datos">
      ${st.nuevo
        ? `<h1>Bienvenido, <em>eres nuevo en Rogans</em></h1><p class="lead">No encontramos el documento ${st.tipoDoc} ${U.docFmt(st.numero)}. Regístrate en un minuto.</p>`
        : `<div class="who"><div class="avatar">${U.iniciales(p.nombre)}</div><div><h1>Hola, <em>${U.esc(U.primerNombre(p.nombre))}</em></h1><p class="lead" style="margin:0">Confirma o actualiza tus datos.</p></div></div>
           <div class="found-banner">✓ Datos traídos de Odoo · ${p.tipoDoc} ${U.docFmt(p.documento)} <span class="demo-badge">ejemplo</span></div>`}
      <div class="form" id="form">
        ${f('nombre', 'Nombre completo *', p.nombre, st.nuevo ? 'autocomplete="name"' : 'readonly', 's2')}
        ${f('documento', 'Documento', p.tipoDoc + ' ' + U.docFmt(p.documento), 'readonly')}
        ${f('celular', 'Celular *', p.celular, 'inputmode="tel"')}
        ${f('correo', 'Correo electrónico', p.correo, 'type="email" inputmode="email"')}
        ${f('fechaNacimiento', 'Fecha de nacimiento *', p.fechaNacimiento, 'type="date"')}
        <div class="field" data-f="eps"><label for="f_eps">EPS / aseguradora <span class="opt">(opcional)</span></label><select id="f_eps">${D.EPS.map(e => `<option ${e === (p.eps || '') ? 'selected' : ''} value="${U.esc(e)}">${e || 'Seleccionar…'}</option>`).join('')}</select></div>
        ${f('direccion', 'Dirección', p.direccion, 'autocomplete="street-address"', 's2')}
        ${f('contactoEmergencia', 'Contacto de emergencia (nombre y celular)', p.contactoEmergencia, '', 's3')}
        <label class="consent" id="consent"><input type="checkbox" id="f_autoriza" ${p.autorizaDatos ? 'checked' : ''}>
          <span><b>Autorizo el tratamiento de mis datos personales *</b><br>Conforme a la Ley 1581 de 2012 y la política de privacidad de Rogans, para la prestación del servicio de salud, facturación y contacto. ${p.autorizaFecha ? `<i>Autorizado el ${U.fecha(p.autorizaFecha)}.</i>` : ''}</span></label>
      </div>
      <div class="err" id="err"></div>
      <div class="k-actions"><button class="btn ghost left" id="back">← Cambiar documento</button><button class="btn dark" id="next">${st.nuevo ? 'Registrarme y continuar' : 'Confirmar datos'}</button></div>
    </section>`, 2);
    $('#back').onclick = documento;
    $('#next').onclick = async () => {
      const v = id => ($('#f_' + id) || {}).value || '';
      const req = ['celular', 'fechaNacimiento'].concat(st.nuevo ? ['nombre'] : []);
      let ok = true;
      document.querySelectorAll('.field').forEach(el => el.classList.remove('invalid'));
      req.forEach(id => { if (!v(id).trim()) { ok = false; document.querySelector(`[data-f="${id}"]`).classList.add('invalid'); } });
      const aut = $('#f_autoriza').checked; $('#consent').classList.toggle('invalid', !aut);
      if (!ok || !aut) { $('#err').textContent = !aut ? 'Para continuar necesitamos tu autorización de tratamiento de datos.' : 'Completa los campos marcados.'; return; }
      const datosNuevos = { celular: v('celular'), correo: v('correo'), fechaNacimiento: v('fechaNacimiento'), eps: v('eps'), direccion: v('direccion'), contactoEmergencia: v('contactoEmergencia'), autorizaDatos: true };
      $('#next').disabled = true; $('#next').textContent = 'Guardando…';
      if (st.nuevo) st.paciente = await S.crearPaciente(Object.assign({ tipoDoc: st.tipoDoc, documento: st.numero, nombre: v('nombre') }, datosNuevos));
      else st.paciente = await S.actualizarPaciente(st.paciente.id, datosNuevos);
      motivo();
    };
  }

  // ---------------- 4b. ¿A qué vienes hoy? (define el paso de paquetes) ----------------
  function motivo() {
    const paq = st.paquetes[0];
    render(`<section class="screen" data-screen="motivo">
      <h1>¿A qué <em>vienes hoy</em>?</h1>
      <p class="lead">${paq ? `Tienes activo tu plan ${U.esc(paq.nombre)}. Si hoy quieres otro tratamiento, también puedes comprarlo aquí.` : 'Elige una opción. Si vienes por un tratamiento, puedes comprar tu paquete aquí mismo.'}</p>
      <div class="motivos" id="motivos">${D.MOTIVOS_KIOSCO.map(m => `<button class="motivo ${m.noListado ? 'otro' : ''} ${st.motivoId === m.id ? 'on' : ''}" data-m="${m.id}">
        <span class="mi">${m.icono}</span><span><b>${m.titulo}</b><small>${m.desc}</small></span>${m.linea ? '<span class="tag info">Comprar paquete</span>' : m.noListado ? '<span class="tag warn">Te atiende recepción</span>' : ''}</button>`).join('')}</div>
      <div class="k-actions"><button class="btn ghost left" id="back">← Mis datos</button><button class="btn dark" id="next" ${st.motivoId ? '' : 'disabled'}>Continuar</button></div>
    </section>`, 3);
    $('#motivos').onclick = e => {
      const b = e.target.closest('.motivo'); if (!b) return;
      const m = D.MOTIVOS_KIOSCO.find(x => x.id === b.dataset.m);
      st.motivoId = m.id; st.motivo = m.motivo;
      st.modo = m.noListado ? 'noListado' : m.linea ? 'compra' : 'cita';
      if (m.linea) st.linea = m.linea;
      motivo();
    };
    $('#back').onclick = datos;
    $('#next').onclick = pago;
  }

  // ---------------- 5. Estado de cuenta ----------------
  function pago() {
    const total = st.pendientes.reduce((a, f) => a + f.residual, 0);
    const alDia = total <= 0;
    const paq = st.paquetes[0];
    render(`<section class="screen" data-screen="pago">
      <h1>Tu <em>estado de cuenta</em></h1><p class="lead">${U.esc(st.paciente.nombre)} · ${st.paciente.tipoDoc} ${U.docFmt(st.paciente.documento)}</p>
      <div class="paygrid">
        <div>
          ${alDia
            ? `<div class="status-hero ok"><div class="ic">✓</div><div><h2>${st.pagadoAhora ? '¡Pago recibido! Estás al día' : 'Estás al día'}</h2><p>${st.nuevo ? 'Aún no tienes cobros pendientes.' : 'No tienes saldos pendientes con Rogans.'}</p></div></div>`
            : `<div class="status-hero bad"><div class="ic">!</div><div><h2>Tienes un saldo pendiente</h2><p>${st.pendientes.length} ${st.pendientes.length === 1 ? 'cobro' : 'cobros'} por pagar</p></div><div class="amt"><small>Total</small><b>${U.cop(total)}</b></div></div>
               <div class="debts">${st.pendientes.map(f => `<div class="debt"><b>${U.esc(f.concepto)}</b><span class="m">${U.cop(f.residual)}</span>
                 <small>${f.name} · emitida ${U.fecha(f.fecha)}${f.residual < f.total ? ` · abonado ${U.cop(f.total - f.residual)} de ${U.cop(f.total)}` : ''}</small>
                 <span>${U.vencida(f.vence) ? `<span class="tag bad">Vencida ${U.fecha(f.vence)}</span>` : `<span class="tag warn">Vence ${U.fecha(f.vence)}</span>`}</span></div>`).join('')}</div>`}
          ${paq ? `<div class="card" style="margin-top:1rem"><div class="pkg-active"><div class="avatar" style="width:52px;height:52px;font-size:1rem">✦</div><div style="flex:1"><small style="color:var(--muted)">Tu plan activo</small><h3>${U.esc(paq.nombre)}</h3>
                  <div class="progress"><i style="width:${Math.round(paq.sesionesUsadas / paq.sesionesTotal * 100)}%"></i></div><small style="color:var(--muted)">${paq.sesionesUsadas} de ${paq.sesionesTotal} sesiones realizadas · hoy sería la ${Math.min(paq.sesionesUsadas + 1, paq.sesionesTotal)}</small></div></div></div>` : ''}
        </div>
        <div class="paybox">
          ${alDia ? `<div class="card"><h3>Siguiente paso</h3><p style="color:var(--muted)">${st.modo === 'compra' ? `En el siguiente paso eliges tu paquete de ${U.esc(lineaNombre(st.linea).toLowerCase())} y lo pagas aquí o en recepción.` : st.modo === 'noListado' ? 'Te asignamos un turno y en recepción te ayudan con el paquete que buscas.' : paq ? 'Confirma tu check-in y te asignamos un turno.' : 'Aún no tienes un plan de tratamiento. En el siguiente paso puedes ver los paquetes disponibles.'}</p></div>`
            : `<h3>¿Cómo quieres pagar?</h3>
              <button class="payopt ${st.pagoIntencion === 'recepcion' ? 'on' : ''}" data-p="recepcion"><span class="pi">🧾</span><span><b>Pagar en recepción</b><small>Efectivo, tarjeta, transferencia o financiación</small></span></button>
              <button class="payopt ${st.pagoIntencion === 'bold' ? 'on' : ''}" data-p="bold"><span class="pi">🔗</span><span><b>Pagar ahora con link Bold</b><small>Escanea el QR con tu celular</small></span></button>
              ${st.pagoIntencion === 'bold' ? `<div class="qrbox"><div class="qr"></div><div><b>${U.cop(total)}</b><p style="font-size:.85rem;color:var(--muted)">Link de pago Bold (simulado). También lo enviamos por WhatsApp al ${U.esc(st.paciente.celular)}.</p><button class="btn sm" id="simpago" style="margin-top:.6rem">Simular pago aprobado</button></div></div>` : ''}`}
        </div>
      </div>
      <div class="k-actions"><button class="btn ghost left" id="back">← Mis datos</button><button class="btn dark" id="next">Continuar</button></div>
    </section>`, 4);
    $('#back').onclick = motivo;
    document.querySelectorAll('.payopt').forEach(b => b.onclick = () => { st.pagoIntencion = b.dataset.p; pago(); });
    const sim = $('#simpago');
    if (sim) sim.onclick = async () => {
      sim.disabled = true; sim.textContent = 'Procesando…';
      for (const f of st.pendientes) await S.registrarPago({ facturaId: f.id, monto: f.residual, metodo: 'bold', referencia: 'BOLD-DEMO-' + Math.floor(Math.random() * 9000 + 1000) });
      st.pendientes = []; st.pagadoAhora = true; st.pagoIntencion = 'pagado'; pago();
    };
    $('#next').onclick = () => (st.modo === 'compra' ? comprar() : st.modo === 'noListado' ? irARecepcion() : st.paquetes.length ? finalizar() : paquetes());
  }

  // ---------------- 6. Paquetes ----------------
  async function paquetes() {
    const cat = await S.obtenerPaquetes();
    const lista = cat.filter(p => p.linea === st.linea);
    render(`<section class="screen" data-screen="paquetes">
      <h1>Elige tu <em>plan de tratamiento</em></h1>
      <p class="lead">No tienes un paquete activo. Puedes elegir uno ahora o decidirlo con tu médico. Recepción lo confirma y te cobra allí.</p>
      <div class="linetabs" id="tabs">${D.LINEAS.map(l => `<button data-l="${l.id}" class="${l.id === st.linea ? 'on' : ''}">${l.nombre}</button>`).join('')}</div>
      <div class="pkgs" id="pkgs">${lista.map(p => `<button class="pkg ${st.interes === p.id ? 'on' : ''}" data-id="${p.id}">
          ${p.popular ? '<span class="pop">Más popular</span>' : ''}<span class="check">✓</span>
          <h3>${U.esc(p.nombre)}</h3><ul>${p.incluye.slice(0, 5).map(i => `<li>${U.esc(i)}</li>`).join('')}</ul>
          <div class="price">${U.precioHtml(p)}</div></button>`).join('')}</div>
      <p class="pkg-note">Precios capilares: promoción online publicada en rogansya.com (oct. 2026), confirmar en sede. Los marcados “precio de ejemplo” son ilustrativos.</p>
      <button class="otro-link" id="otro">🔎 Busco otro paquete · no aparece lo que busco →</button>
      <div class="k-actions"><button class="btn ghost left" id="back">← Estado de cuenta</button><button class="btn ghost" id="skip">Ahora no, lo hablo con mi médico</button><button class="btn dark" id="next" ${st.interes ? '' : 'disabled'}>${st.interes ? 'Continuar con ' + U.esc(S.producto(st.interes).nombre) : 'Selecciona un plan'}</button></div>
    </section>`, 5);
    $('#otro').onclick = () => { st.interes = null; irARecepcion(); };
    $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { st.linea = b.dataset.l; paquetes(); } };
    $('#pkgs').onclick = e => { const b = e.target.closest('.pkg'); if (b) { st.interes = st.interes === b.dataset.id ? null : b.dataset.id; paquetes(); } };
    $('#back').onclick = pago;
    $('#skip').onclick = () => { st.interes = null; finalizar(); };
    $('#next').onclick = finalizar;
  }

  const lineaNombre = id => (D.LINEAS.find(l => l.id === id) || { nombre: id }).nombre.split(' ·')[0];

  // ---------------- 6b. Comprar paquete (motivo con línea: capilar, facial, corporal, otras) ----------------
  async function comprar() {
    const cat = await S.obtenerPaquetes();
    const lista = cat.filter(p => p.linea === st.linea);
    const paq = st.paquetes[0];
    render(`<section class="screen" data-screen="comprar">
      <h1>Compra tu <em>paquete ${U.esc(lineaNombre(st.linea).toLowerCase())}</em></h1>
      <p class="lead">${paq ? `Tu plan ${U.esc(paq.nombre)} sigue activo; este paquete se suma a tu cuenta.` : 'Elige el paquete y págalo aquí con link Bold o en recepción.'}</p>
      <div class="linetabs" id="tabs">${D.LINEAS.map(l => `<button data-l="${l.id}" class="${l.id === st.linea ? 'on' : ''}">${l.nombre}</button>`).join('')}</div>
      <div class="pkgs" id="pkgs">${lista.map(p => `<button class="pkg ${st.compraSel === p.id ? 'on' : ''}" data-id="${p.id}">
          ${p.popular ? '<span class="pop">Más popular</span>' : ''}<span class="check">✓</span>
          <h3>${U.esc(p.nombre)}</h3><ul>${p.incluye.slice(0, 5).map(i => `<li>${U.esc(i)}</li>`).join('')}</ul>
          <div class="price">${U.precioHtml(p)}</div></button>`).join('')}</div>
      <button class="otro-link" id="otro">🔎 Busco otro paquete · no aparece lo que busco →</button>
      <div class="k-actions"><button class="btn ghost left" id="back">← Estado de cuenta</button><button class="btn ghost" id="skip">Ahora no, solo mi cita</button><button class="btn dark" id="next" ${st.compraSel ? '' : 'disabled'}>${st.compraSel ? 'Comprar ' + U.esc(S.producto(st.compraSel).nombre) : 'Selecciona un paquete'}</button></div>
    </section>`, 5);
    $('#tabs').onclick = e => { const b = e.target.closest('button'); if (b) { st.linea = b.dataset.l; st.compraSel = null; comprar(); } };
    $('#pkgs').onclick = e => { const b = e.target.closest('.pkg'); if (b) { st.compraSel = st.compraSel === b.dataset.id ? null : b.dataset.id; comprar(); } };
    $('#otro').onclick = irARecepcion;
    $('#back').onclick = pago;
    $('#skip').onclick = () => { st.compraSel = null; finalizar(); };
    $('#next').onclick = checkout;
  }

  // ---------------- 6c. Pago del paquete (Bold desde el kiosco o en recepción) ----------------
  function checkout() {
    const p = S.producto(st.compraSel);
    if (p.desde) st.compraPago = 'recepcion'; // precio final se define en la valoración: no se cobra en el kiosco
    render(`<section class="screen" data-screen="checkout">
      <h1>Paga tu <em>${U.esc(p.nombre)}</em></h1>
      <p class="lead">${U.esc(st.paciente.nombre)} · ${st.paciente.tipoDoc} ${U.docFmt(st.paciente.documento)}</p>
      <div class="paygrid">
        <div class="card buy">
          <small style="color:var(--muted)">Paquete ${U.esc(lineaNombre(p.linea).toLowerCase())}</small><h2>${U.esc(p.nombre)}</h2>
          <ul class="buy-list">${p.incluye.map(i => `<li>${U.esc(i)}</li>`).join('')}</ul>
          <div class="buy-total"><span>Total</span><div class="price">${U.precioHtml(p)}</div></div>
          ${p.precioEjemplo ? '<p class="pkg-note">Precio de ejemplo: el valor real lo confirma Rogans.</p>' : ''}
        </div>
        <div class="paybox">
          <h3>¿Cómo quieres pagar?</h3>
          ${p.desde ? `<div class="card" style="margin-bottom:.7rem"><p style="color:var(--muted)">El valor final depende de tu valoración (${U.esc(p.notaPrecio || 'precio desde')}). Recepción te confirma el precio y las opciones de financiación.</p></div>`
            : `<button class="payopt ${st.compraPago === 'bold' ? 'on' : ''}" data-p="bold"><span class="pi">🔗</span><span><b>Pagar ahora con link Bold</b><small>Escanea el QR con tu celular</small></span></button>`}
          <button class="payopt ${st.compraPago === 'recepcion' ? 'on' : ''}" data-p="recepcion"><span class="pi">🧾</span><span><b>Pagar en recepción</b><small>Efectivo, tarjeta, transferencia o financiación (Addi, Sistecrédito)</small></span></button>
          ${st.compraPago === 'bold' ? `<div class="qrbox"><div class="qr"></div><div><b>${U.cop(p.precio)}</b><p style="font-size:.85rem;color:var(--muted)">Link de pago Bold (simulado). También lo enviamos por WhatsApp al ${U.esc(st.paciente.celular)}.</p><button class="btn sm" id="simcompra" style="margin-top:.6rem">Simular pago aprobado</button></div></div>` : ''}
        </div>
      </div>
      <div class="err" id="err"></div>
      <div class="k-actions"><button class="btn ghost left" id="back">← Paquetes</button>${st.compraPago === 'recepcion' ? '<button class="btn dark" id="next">Confirmar y pagar en recepción</button>' : ''}</div>
    </section>`, 5);
    $('#back').onclick = comprar;
    document.querySelectorAll('.payopt').forEach(b => b.onclick = () => { st.compraPago = b.dataset.p; checkout(); });
    const vender = async pagar => {
      // Odoo: sale.order (confirmada) + factura account.move; si paga con Bold, account.payment conciliado.
      const r = await S.venderPaquete(st.paciente.id, p.id);
      if (pagar) await S.registrarPago({ facturaId: r.factura.id, monto: r.factura.total, metodo: 'bold', referencia: 'BOLD-DEMO-' + Math.floor(Math.random() * 9000 + 1000) });
      st.compra = { productId: p.id, facturaId: r.factura.id, factura: r.factura.name, paqueteId: r.paquete.id, total: r.factura.total, pagado: !!pagar, metodo: pagar ? 'bold' : 'recepcion' };
      finalizar();
    };
    const sim = $('#simcompra'); if (sim) sim.onclick = () => { sim.disabled = true; sim.textContent = 'Procesando…'; vender(true); };
    const nx = $('#next'); if (nx) nx.onclick = () => { nx.disabled = true; nx.textContent = 'Registrando…'; vender(false); };
  }

  // ---------------- 7b. Paquete no listado → recepción ----------------
  async function irARecepcion() {
    render(`<section class="screen loading"><div class="spinner"></div><h1>Registrando tu llegada…</h1></section>`, 6);
    st.motivo = 'Paquete no listado';
    st.checkin = await S.registrarCheckin({ partnerId: st.paciente.id, motivo: st.motivo, paqueteNoListado: true, pagoIntencion: st.pendientes.length ? st.pagoIntencion : (st.pagadoAhora ? 'pagado' : null), origen: 'kiosco' });
    const total = st.pendientes.reduce((a, f) => a + f.residual, 0);
    render(`<section class="screen done" data-screen="recepcion">
      <div class="big warn">→</div><h1>Por favor <em>acércate a recepción</em></h1>
      <p class="lead">${U.esc(U.primerNombre(st.paciente.nombre))}, te ayudamos allí con el paquete o tratamiento que buscas.</p>
      <div class="turno"><small>Tu turno</small><b>${st.checkin.turno}</b></div>
      <div class="summary">
        <div><small>Motivo</small><b>Paquete no listado</b></div>
        <div><small>Pagos</small><b>${total > 0 ? `<span style="color:var(--red)">Saldo ${U.cop(total)}</span> · pagar en recepción` : (st.pagadoAhora ? 'Pagado con Bold ✓' : 'Al día ✓')}</b></div>
        <div><small>Recepción</small><b>Ya sabe que buscas otro paquete</b></div>
      </div>
      <p class="countdown" id="cd"></p>
      <div style="margin-top:1rem"><button class="btn dark" id="fin">Terminar</button></div>
    </section>`, 6);
    cuentaAtras();
  }
  function cuentaAtras() {
    let n = 30; const cd = $('#cd');
    const tick = () => { if (cd) cd.textContent = `Esta pantalla volverá al inicio en ${n} s`; if (n-- <= 0) bienvenida(); };
    tick(); timer = setInterval(tick, 1000);
    $('#fin').onclick = bienvenida;
  }

  // ---------------- 7. Listo ----------------
  async function finalizar() {
    render(`<section class="screen loading"><div class="spinner"></div><h1>Registrando tu llegada…</h1></section>`, 6);
    st.checkin = await S.registrarCheckin({ partnerId: st.paciente.id, motivo: st.motivo, interes: st.interes, compra: st.compra, pagoIntencion: st.pendientes.length ? st.pagoIntencion : (st.pagadoAhora ? 'pagado' : null), origen: 'kiosco' });
    const total = st.pendientes.reduce((a, f) => a + f.residual, 0);
    const paq = st.paquetes[0];
    const interes = st.interes ? S.producto(st.interes) : null;
    const compra = st.compra ? Object.assign({ prod: S.producto(st.compra.productId) }, st.compra) : null;
    const saldoTotal = total + (compra && !compra.pagado ? compra.total : 0);
    render(`<section class="screen done" data-screen="listo">
      <div class="big">✓</div><h1>¡Check-in <em>completado</em>!</h1>
      <p class="lead">${U.esc(U.primerNombre(st.paciente.nombre))}, ${compra ? (compra.pagado ? `tu compra de ${U.esc(compra.prod.nombre)} quedó pagada. Dirígete a recepción con tu turno.` : `recepción ya tiene tu compra de ${U.esc(compra.prod.nombre)} para cobrarla.`) : 'dirígete a recepción con tu turno.'}</p>
      <div class="turno"><small>Tu turno</small><b>${st.checkin.turno}</b></div>
      <div class="summary">
        <div><small>Motivo</small><b>${U.esc(st.motivo)}</b></div>
        <div><small>Pagos</small><b>${saldoTotal > 0 ? `<span style="color:var(--red)">${compra && !compra.pagado ? 'Por pagar' : 'Saldo'} ${U.cop(saldoTotal)}</span> · pagar en recepción` : (st.pagadoAhora || (compra && compra.pagado) ? 'Pagado con Bold ✓' : 'Al día ✓')}</b></div>
        <div><small>${compra ? 'Compra' : 'Plan'}</small><b>${compra ? `${U.esc(compra.prod.nombre)} · ${U.cop(compra.total)}${compra.pagado ? ' ✓' : ''}` : paq ? `${U.esc(paq.nombre)} · sesión ${Math.min(paq.sesionesUsadas + 1, paq.sesionesTotal)}/${paq.sesionesTotal}` : interes ? `Interés: ${U.esc(interes.nombre)} (${U.cop(interes.precio)})` : 'Lo defines con tu médico'}</b></div>
      </div>
      <p class="countdown" id="cd"></p>
      <div style="margin-top:1rem"><button class="btn dark" id="fin">Terminar</button></div>
    </section>`, 6);
    cuentaAtras();
  }

  // reloj
  const clock = $('#kclock'); const tickClock = () => clock.textContent = U.hora(); tickClock(); setInterval(tickClock, 15000);
  $('#klogo').onclick = bienvenida;
  window.kiosk = { bienvenida };
  bienvenida();
})();
