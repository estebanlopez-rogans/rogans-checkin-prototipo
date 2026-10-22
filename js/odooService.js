/* =====================================================================
 * odooService.js — ÚNICO punto de acceso a datos del prototipo.
 *
 * HOY: simulado. Lee/escribe en localStorage con datos de ejemplo
 *      (RogansData.semilla). No hay conexión a Odoo.
 * MAÑANA: reemplazar el cuerpo de cada función por una llamada a un
 *      backend propio (proxy) que hable con Odoo por JSON-RPC / XML-RPC
 *      (`/web/dataset/call_kw` o `/jsonrpc` con execute_kw).
 *      ⚠️ Nunca poner la API key de Odoo en el navegador/kiosco: el kiosco
 *      llama al proxy, el proxy llama a Odoo con un usuario técnico.
 *
 * Todas las funciones son async y devuelven objetos planos, así la UI no
 * cambia cuando se conecte Odoo de verdad.
 * ===================================================================== */
(function () {
  const KEY = 'rogans-checkin-demo-v2';
  const LATENCIA = 650; // ms, para simular la red
  const D = window.RogansData;

  function hoy() { const x = new Date(); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function load() {
    try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && s.fechaSemilla === hoy()) return s; } catch (e) {}
    const s = D.semilla(); save(s); return s;
  }
  function save(s) { localStorage.setItem(KEY, JSON.stringify(s)); window.dispatchEvent(new CustomEvent('rogans:store')); }
  const espera = (ms = LATENCIA) => new Promise(r => setTimeout(r, ms));
  const clone = o => JSON.parse(JSON.stringify(o));
  const producto = id => D.CATALOGO.find(p => p.id === id) || null;
  const pad = (n, l) => String(n).padStart(l, '0');
  const horaActual = () => { const x = new Date(); return pad(x.getHours(), 2) + ':' + pad(x.getMinutes(), 2); };

  function enriquecerPaquete(p) { const prod = producto(p.productId); return Object.assign({}, p, { nombre: prod ? prod.nombre : p.productId, linea: prod ? prod.linea : null }); }
  function estadoFactura(f) { return f.residual <= 0 ? 'paid' : (f.residual < f.total ? 'partial' : 'not_paid'); }

  const odooService = {
    /**
     * Buscar paciente por documento.
     * Odoo: res.partner.search_read([['l10n_latam_identification_type_id.name','=',tipo], ['vat','=',numero]])
     *   (con l10n_co: campo `vat` = número de documento; tipo en `l10n_latam_identification_type_id`).
     *   Campos sugeridos: name, mobile, email, street, city, + campos personalizados x_fecha_nacimiento,
     *   x_eps, x_contacto_emergencia, x_autoriza_datos (Ley 1581), x_autoriza_fecha.
     * @returns {Promise<object|null>} paciente o null si no existe (=> paciente nuevo)
     */
    async buscarPacientePorCedula(tipoDoc, numero) {
      await espera(1100);
      const s = load();
      const p = s.partners.find(x => x.documento === String(numero).trim() && (!tipoDoc || x.tipoDoc === tipoDoc));
      return p ? clone(p) : null;
    },

    /** Odoo: res.partner.create({...}) → id */
    async crearPaciente(datos) {
      await espera();
      const s = load();
      const p = Object.assign({ id: ++s.seq.partner, ciudad: 'Bogotá' }, datos);
      if (p.autorizaDatos && !p.autorizaFecha) p.autorizaFecha = hoy();
      s.partners.push(p); save(s); return clone(p);
    },

    /** Odoo: res.partner.write([id], {...}) */
    async actualizarPaciente(id, datos) {
      await espera(300);
      const s = load();
      const p = s.partners.find(x => x.id === id); if (!p) throw new Error('Paciente no encontrado');
      Object.assign(p, datos);
      if (p.autorizaDatos && !p.autorizaFecha) p.autorizaFecha = hoy();
      save(s); return clone(p);
    },

    /**
     * Facturas con saldo pendiente.
     * Odoo: account.move.search_read([['partner_id','=',id],['move_type','=','out_invoice'],
     *        ['state','=','posted'],['payment_state','in',['not_paid','partial']]],
     *        ['name','invoice_date','invoice_date_due','amount_total','amount_residual','invoice_line_ids'])
     */
    async obtenerPagosPendientes(partnerId) {
      await espera(300);
      return clone(load().facturas.filter(f => f.partnerId === partnerId && f.residual > 0).map(f => Object.assign({}, f, { estado: estadoFactura(f) })));
    },

    /** Todas las facturas del paciente (pagadas y pendientes). Odoo: account.move (out_invoice) */
    async obtenerFacturas(partnerId) {
      await espera(150);
      return clone(load().facturas.filter(f => f.partnerId === partnerId).map(f => Object.assign({}, f, { estado: estadoFactura(f) })));
    },

    /** Pagos registrados. Odoo: account.payment.search_read([['partner_id','=',id]]) */
    async obtenerPagos(partnerId) {
      await espera(150);
      return clone(load().pagos.filter(p => p.partnerId === partnerId));
    },

    /**
     * Catálogo de paquetes/tratamientos.
     * Odoo: product.product.search_read([['sale_ok','=',True],['categ_id','child_of', <Paquetes Rogans>]],
     *        ['name','list_price','categ_id','description_sale']) — la línea (capilar/facial/…) = categoría.
     */
    async obtenerPaquetes() { await espera(200); return clone(D.CATALOGO); },

    /**
     * Paquetes que el paciente ya compró y su avance de sesiones.
     * Odoo: sale.order.line (state in sale/done) del partner, con producto de categoría "Paquetes";
     *   sesiones usadas = qty_delivered (servicio entregado por sesión) o un modelo propio x_sesion.
     */
    async obtenerPaquetesPaciente(partnerId) {
      await espera(200);
      return clone(load().paquetes.filter(p => p.partnerId === partnerId).map(enriquecerPaquete));
    },

    /** Historial de visitas. Odoo: calendar.event (citas) o modelo propio de atenciones. */
    async obtenerHistorial(partnerId) {
      await espera(150);
      return clone(load().visitas.filter(v => v.partnerId === partnerId).sort((a, b) => b.fecha.localeCompare(a.fecha)));
    },

    /**
     * Registrar pago de una factura.
     * Odoo: account.payment.register (wizard) con context {active_model:'account.move', active_ids:[facturaId]}
     *   → {amount, journal_id (según método: Caja, Banco, Bold, Mercado Pago, Addi, Sistecrédito), payment_date, communication: referencia}
     *   → action_create_payments(). Para Bold/Mercado Pago, idealmente confirmar por webhook del proveedor.
     */
    async registrarPago({ facturaId, monto, metodo, referencia }) {
      await espera(700);
      const s = load();
      const f = s.facturas.find(x => x.id === facturaId); if (!f) throw new Error('Factura no encontrada');
      const m = Math.min(Number(monto) || 0, f.residual); if (m <= 0) throw new Error('Monto inválido');
      f.residual -= m;
      const pago = { id: ++s.seq.pago, name: 'PAG/2026/' + pad(s.seq.pago, 4), facturaId, partnerId: f.partnerId, monto: m, metodo, referencia: referencia || '', fecha: hoy() };
      s.pagos.push(pago); save(s);
      return { pago: clone(pago), factura: Object.assign(clone(f), { estado: estadoFactura(f) }) };
    },

    /**
     * Vender/asignar paquete: crea pedido + factura con saldo pendiente.
     * Odoo: sale.order.create({partner_id, order_line:[(0,0,{product_id, product_uom_qty:1})]}) → action_confirm()
     *       → _create_invoices() → account.move.action_post()
     */
    async venderPaquete(partnerId, productId) {
      await espera(600);
      const s = load(); const prod = producto(productId); if (!prod) throw new Error('Producto no encontrado');
      const paq = { id: ++s.seq.paquete, orderName: 'S00' + s.seq.paquete, partnerId, productId, fecha: hoy(), sesionesTotal: prod.sesiones || 1, sesionesUsadas: 0, estado: 'activo' };
      const fac = { id: ++s.seq.factura, name: 'FV/2026/0' + s.seq.factura, partnerId, productId, concepto: prod.nombre + (prod.linea === 'capilar' ? ' (capilar)' : ''), fecha: hoy(), vence: hoy(), total: prod.precio, residual: prod.precio };
      s.paquetes.push(paq); s.facturas.push(fac); save(s);
      return { paquete: enriquecerPaquete(paq), factura: fac };
    },

    /** Descontar una sesión del paquete. Odoo: sale.order.line.qty_delivered += 1 (o x_sesion.create) */
    async registrarSesion(paqueteId) {
      await espera(300);
      const s = load(); const p = s.paquetes.find(x => x.id === paqueteId); if (!p) throw new Error('Paquete no encontrado');
      if (p.sesionesUsadas < p.sesionesTotal) p.sesionesUsadas++;
      if (p.sesionesUsadas >= p.sesionesTotal) p.estado = 'finalizado';
      s.visitas.push({ id: ++s.seq.visita, partnerId: p.partnerId, fecha: hoy(), motivo: 'Sesión de tratamiento', nota: 'Sesión ' + p.sesionesUsadas + '/' + p.sesionesTotal + ' · ' + (producto(p.productId) || {}).nombre });
      save(s); return enriquecerPaquete(p);
    },

    /**
     * Registrar check-in (turno). No existe modelo estándar: sugerido modelo propio `x_rogans.checkin`
     * (partner_id, turno, motivo, estado, origen, interes_product_id) o usar calendar.event.attendee_ids.
     */
    async registrarCheckin({ partnerId, motivo, interes, pagoIntencion, origen }) {
      await espera(500);
      const s = load();
      const ya = s.checkins.find(c => c.partnerId === partnerId && c.estado !== 'atendido');
      if (ya) { Object.assign(ya, { motivo: motivo || ya.motivo, interes: interes || ya.interes, pagoIntencion: pagoIntencion || ya.pagoIntencion }); save(s); return clone(ya); }
      const c = { id: ++s.seq.checkin, turno: 'R-' + pad(s.seq.checkin, 3), partnerId, hora: horaActual(), motivo: motivo || 'Consulta / valoración', estado: 'espera', asistencia: false, origen: origen || 'kiosco', interes: interes || null, pagoIntencion: pagoIntencion || null };
      s.checkins.push(c); save(s); return clone(c);
    },

    /** Check-ins de hoy con datos del paciente y saldo (para el panel de recepción). */
    async listarCheckinsHoy() {
      await espera(120);
      const s = load();
      return clone(s.checkins.map(c => {
        const p = s.partners.find(x => x.id === c.partnerId) || {};
        const saldo = s.facturas.filter(f => f.partnerId === c.partnerId).reduce((a, f) => a + f.residual, 0);
        const paq = s.paquetes.filter(x => x.partnerId === c.partnerId && x.estado === 'activo').map(enriquecerPaquete);
        return Object.assign({}, c, { paciente: p, saldo, paquetes: paq });
      }).sort((a, b) => b.turno.localeCompare(a.turno)));
    },

    /** Cambiar estado del turno: espera | consulta | atendido; asistencia true/false. */
    async actualizarCheckin(id, cambios) {
      await espera(120);
      const s = load(); const c = s.checkins.find(x => x.id === id); if (!c) throw new Error('Check-in no encontrado');
      Object.assign(c, cambios);
      if (cambios.estado === 'atendido' || cambios.estado === 'consulta') c.asistencia = true;
      if (cambios.estado === 'atendido' && !s.visitas.some(v => v.partnerId === c.partnerId && v.fecha === hoy() && v.checkinId === c.id))
        s.visitas.push({ id: ++s.seq.visita, partnerId: c.partnerId, fecha: hoy(), motivo: c.motivo, nota: 'Atendido · turno ' + c.turno, checkinId: c.id });
      save(s); return clone(c);
    },

    /** Solo para el demo: volver a los datos de ejemplo. */
    reiniciarDemo() { localStorage.removeItem(KEY); load(); },
    producto, hoy,
  };

  window.odooService = odooService;
})();
