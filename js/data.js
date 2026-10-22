/* =====================================================================
 * Datos de ejemplo — SIN conexión a Odoo.
 * Nombres y cédulas son FICTICIOS. Catálogo: nombres reales de rogansya.com;
 * precios reales solo donde se publican (ver campo `fuente`); el resto lleva
 * `precioEjemplo: true` y se muestra como "precio de ejemplo".
 * ===================================================================== */
(function () {
  const S = 'https://rogansya.com';

  // product.product (Odoo) ↔ catálogo de paquetes/tratamientos
  const CATALOGO = [
    // ---------- Capilar / alopecia (precios REALES, promoción online oct. 2026) ----------
    { id: 'cap-sesion-unica', linea: 'capilar', nombre: 'Sesión Única', precio: 350000, precioAntes: 520000,
      sesiones: 1, incluye: ['Consulta inicial gratis', '1 mesoterapia', '1 Plasma Rico en Plaquetas (PRP)', '1 fototerapia (si lo requiere)', 'Seguimiento médico'],
      fuente: S + '/tratamiento-capilar/' },
    { id: 'cap-starter', linea: 'capilar', nombre: 'Starter', precio: 1650000, precioAntes: 2290000,
      sesiones: 5, incluye: ['5 mesoterapias', '5 Plasma Rico en Plaquetas', 'Sesión luz LED infrarroja (si lo requiere)', 'Seguimiento médico', 'Kit full casa 3 meses', '50% de descuento en Vitapel', '30% de descuento en exámenes de sangre'],
      fuente: S + '/cuidado-capilar/' },
    { id: 'cap-advanced', linea: 'capilar', nombre: 'Advanced', precio: 2800000, precioAntes: 4240000, popular: true,
      sesiones: 10, incluye: ['10 mesoterapias', '10 Plasma Rico en Plaquetas', 'Sesión luz LED infrarroja (si lo requiere)', 'Seguimiento médico', 'Kit full casa 6 meses', '50% de descuento en sesiones de exosomas', 'Membresía Advanced'],
      fuente: S + '/cuidado-capilar/' },
    { id: 'cap-implante', linea: 'capilar', nombre: 'Implante Capilar', precio: 10000000, desde: true, notaPrecio: 'según número de unidades foliculares',
      sesiones: 2, incluye: ['Resultados permanentes', 'Precio final según el número de unidades foliculares', 'Seguimiento médico'],
      fuente: S + '/cuidado-capilar/' },
    // ---------- Facial (nombres reales de /rejuvenecimiento-facial; precios de EJEMPLO) ----------
    { id: 'fac-toxina', linea: 'facial', nombre: 'Toxina botulínica', precio: 900000, precioEjemplo: true, sesiones: 1,
      incluye: ['Líneas de expresión', 'Valoración previa', 'Control a los 15 días'], fuente: S + '/rejuvenecimiento-facial/' },
    { id: 'fac-hialuronico', linea: 'facial', nombre: 'Ácido hialurónico', precio: 1200000, precioEjemplo: true, sesiones: 1,
      incluye: ['Ojeras, labios, pómulos o mentón', 'Valoración previa', 'Control posterior'], fuente: S + '/rejuvenecimiento-facial/' },
    { id: 'fac-bioestimuladores', linea: 'facial', nombre: 'Bioestimuladores y limpieza', precio: 850000, precioEjemplo: true, sesiones: 3,
      incluye: ['Limpieza facial profunda', 'Bioestimulación de colágeno', 'Seguimiento'], fuente: S + '/rejuvenecimiento-facial/' },
    { id: 'fac-harmonyca', linea: 'facial', nombre: 'Harmonyca', precio: 3500000, precioEjemplo: true, sesiones: 1,
      incluye: ['Ácido hialurónico + hidroxiapatita de calcio', 'Rostro completo', 'Valoración previa'], fuente: S + '/producto/harmonyca/' },
    // ---------- Corporal (nombres reales de /tratamientos-corporales; precios de EJEMPLO) ----------
    { id: 'cor-sueroterapia', linea: 'corporal', nombre: 'Sueroterapia', precio: 280000, precioEjemplo: true, sesiones: 1,
      incluye: ['Vitaminas, minerales y antioxidantes IV', 'Cóctel según valoración'], fuente: S + '/tratamientos-corporales/' },
    { id: 'cor-hidrolipo', linea: 'corporal', nombre: 'Hidrolipoclasia (6 sesiones)', precio: 1200000, precioEjemplo: true, sesiones: 6,
      incluye: ['Reducción de grasa localizada', 'Soluciones acuosas + ultrasonido', 'Plan según área'], fuente: S + '/tratamientos-corporales/' },
    // ---------- Otras líneas (nombres reales del menú de rogansya.com; precios de EJEMPLO) ----------
    { id: 'otr-sexual', linea: 'otras', nombre: 'Rendimiento sexual masculino', precio: 250000, precioEjemplo: true, sesiones: 1,
      incluye: ['Consulta médica', 'Plan de tratamiento'], fuente: S + '/rendimiento-sexual-masculino/' },
    { id: 'otr-nutricion', linea: 'otras', nombre: 'Consulta de nutrición', precio: 120000, precioEjemplo: true, sesiones: 1,
      incluye: ['Valoración nutricional', 'Plan alimentario'], fuente: S + '/nutricion/' },
    { id: 'otr-psicologia', linea: 'otras', nombre: 'Consulta de psicología', precio: 120000, precioEjemplo: true, sesiones: 1,
      incluye: ['Sesión individual'], fuente: S + '/psicologia/' },
    // ---------- Valoraciones (precios publicados) ----------
    { id: 'val-capilar', linea: 'valoracion', nombre: 'Consulta capilar', precio: 50000, sesiones: 1,
      incluye: ['Redimible en productos y tratamientos'], fuente: S + '/diagnostico-capilar/' },
    { id: 'val-facial', linea: 'valoracion', nombre: 'Valoración rejuvenecimiento facial', precio: 75000, gratisPromo: true, sesiones: 1,
      incluye: ['Gratis por tiempo limitado (presencial en Bogotá)'], fuente: S + '/rejuvenecimiento-facial/' },
    { id: 'val-piel', linea: 'valoracion', nombre: 'Valoración cuidado de la piel', precio: 100000, gratisPromo: true, sesiones: 1,
      incluye: ['Gratis por tiempo limitado (presencial en Bogotá)'], fuente: S + '/cuidado-de-la-piel/' },
  ];

  const LINEAS = [
    { id: 'capilar', nombre: 'Capilar · Alopecia' },
    { id: 'facial', nombre: 'Facial' },
    { id: 'corporal', nombre: 'Corporal' },
    { id: 'otras', nombre: 'Otras líneas' },
  ];

  const METODOS_PAGO = [
    { id: 'efectivo', nombre: 'Efectivo', icono: '💵', journal: 'Caja' },
    { id: 'tarjeta', nombre: 'Tarjeta (datáfono)', icono: '💳', journal: 'Banco · Datáfono' },
    { id: 'transferencia', nombre: 'Transferencia', icono: '🏦', journal: 'Banco' },
    { id: 'bold', nombre: 'Link Bold', icono: '🔗', journal: 'Bold' },
    { id: 'mercadopago', nombre: 'Mercado Pago', icono: '🟦', journal: 'Mercado Pago' },
    { id: 'addi', nombre: 'Addi', icono: '🅰️', journal: 'Financiación · Addi' },
    { id: 'sistecredito', nombre: 'Sistecrédito', icono: '🧾', journal: 'Financiación · Sistecrédito' },
  ];

  const TIPOS_DOC = [
    { id: 'CC', nombre: 'Cédula de ciudadanía' },
    { id: 'CE', nombre: 'Cédula de extranjería' },
    { id: 'TI', nombre: 'Tarjeta de identidad' },
    { id: 'PA', nombre: 'Pasaporte' },
    { id: 'PPT', nombre: 'Permiso por protección temporal' },
  ];

  const MOTIVOS = ['Consulta / valoración', 'Control / seguimiento', 'Procedimiento', 'Compra de productos'];

  const EPS = ['', 'Particular (sin EPS)', 'Sura', 'Sanitas', 'Compensar', 'Nueva EPS', 'Salud Total', 'Famisanar', 'Medicina prepagada', 'Otra'];

  // ---------- Pacientes ficticios (res.partner) ----------
  function d(offsetDays) { const x = new Date(); x.setDate(x.getDate() + offsetDays); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }
  function semilla() {
    const partners = [
      { id: 101, tipoDoc: 'CC', documento: '1010101010', nombre: 'Carlos Andrés Prueba Gómez', celular: '300 000 0101', correo: 'carlos.prueba@ejemplo.com', fechaNacimiento: '1988-03-14', eps: 'Sura', direccion: 'Calle 100 # 00-00', ciudad: 'Bogotá', contactoEmergencia: 'Ana Gómez (madre) · 300 000 0102', autorizaDatos: true, autorizaFecha: d(-40) },
      { id: 102, tipoDoc: 'CC', documento: '52000111', nombre: 'Laura Ejemplo Martínez', celular: '310 000 0111', correo: 'laura.ejemplo@ejemplo.com', fechaNacimiento: '1979-11-02', eps: 'Sanitas', direccion: 'Carrera 15 # 00-00', ciudad: 'Bogotá', contactoEmergencia: 'Pedro Martínez · 310 000 0112', autorizaDatos: true, autorizaFecha: d(-60) },
      { id: 103, tipoDoc: 'CC', documento: '79000222', nombre: 'Andrés Demo Rojas', celular: '320 000 0222', correo: 'andres.demo@ejemplo.com', fechaNacimiento: '1992-07-21', eps: 'Compensar', direccion: 'Autopista Norte # 00-00', ciudad: 'Bogotá', contactoEmergencia: '', autorizaDatos: true, autorizaFecha: d(-10) },
      { id: 104, tipoDoc: 'CE', documento: '600123', nombre: 'María Ficticia López', celular: '315 000 0123', correo: 'maria.ficticia@ejemplo.com', fechaNacimiento: '1985-05-30', eps: 'Particular (sin EPS)', direccion: 'Calle 85 # 00-00', ciudad: 'Bogotá', contactoEmergencia: 'Luis López · 315 000 0124', autorizaDatos: false, autorizaFecha: null },
      { id: 105, tipoDoc: 'CC', documento: '1000000005', nombre: 'Sofía Muestra Ruiz', celular: '301 000 0005', correo: 'sofia.muestra@ejemplo.com', fechaNacimiento: '1990-01-09', eps: 'Medicina prepagada', direccion: 'Calle 116 # 00-00', ciudad: 'Bogotá', contactoEmergencia: 'Juan Ruiz · 301 000 0006', autorizaDatos: true, autorizaFecha: d(-95) },
      { id: 106, tipoDoc: 'CC', documento: '1020304050', nombre: 'Jorge Ficticio Peña', celular: '312 000 4050', correo: 'jorge.ficticio@ejemplo.com', fechaNacimiento: '1983-09-17', eps: 'Nueva EPS', direccion: 'Calle 127 # 00-00', ciudad: 'Bogotá', contactoEmergencia: '', autorizaDatos: true, autorizaFecha: d(0) },
    ];
    // account.move (facturas de cliente)
    const facturas = [
      { id: 501, name: 'FV/2026/0341', partnerId: 101, productId: 'cap-starter', concepto: 'Plan Starter (capilar) — saldo', fecha: d(-40), vence: d(-5), total: 1650000, residual: 650000 },
      { id: 502, name: 'FV/2026/0298', partnerId: 102, productId: 'cap-advanced', concepto: 'Plan Advanced (capilar)', fecha: d(-60), vence: d(-30), total: 2800000, residual: 0 },
      { id: 503, name: 'FV/2026/0402', partnerId: 103, productId: 'val-capilar', concepto: 'Consulta capilar', fecha: d(-10), vence: d(-10), total: 50000, residual: 0 },
      { id: 504, name: 'FV/2026/0415', partnerId: 104, productId: 'val-capilar', concepto: 'Consulta capilar', fecha: d(-3), vence: d(0), total: 50000, residual: 50000 },
      { id: 505, name: 'FV/2026/0187', partnerId: 105, productId: 'cap-implante', concepto: 'Implante Capilar', fecha: d(-95), vence: d(-95), total: 10000000, residual: 0 },
      { id: 506, name: 'FV/2026/0431', partnerId: 106, productId: 'cap-sesion-unica', concepto: 'Sesión Única (capilar)', fecha: d(0), vence: d(0), total: 350000, residual: 350000 },
    ];
    // account.payment
    const pagos = [
      { id: 701, name: 'PAG/2026/0611', facturaId: 501, partnerId: 101, monto: 1000000, metodo: 'bold', referencia: 'BOLD-DEMO-8841', fecha: d(-40) },
      { id: 702, name: 'PAG/2026/0533', facturaId: 502, partnerId: 102, monto: 2800000, metodo: 'tarjeta', referencia: 'DATAFONO-DEMO-1182', fecha: d(-60) },
      { id: 703, name: 'PAG/2026/0688', facturaId: 503, partnerId: 103, monto: 50000, metodo: 'mercadopago', referencia: 'MP-DEMO-5520', fecha: d(-10) },
      { id: 704, name: 'PAG/2026/0301', facturaId: 505, partnerId: 105, monto: 10000000, metodo: 'addi', referencia: 'ADDI-DEMO-0042', fecha: d(-95) },
    ];
    // sale.order (paquete vendido) + control de sesiones
    const paquetes = [
      { id: 801, orderName: 'S00341', partnerId: 101, productId: 'cap-starter', fecha: d(-40), sesionesTotal: 5, sesionesUsadas: 2, estado: 'activo' },
      { id: 802, orderName: 'S00298', partnerId: 102, productId: 'cap-advanced', fecha: d(-60), sesionesTotal: 10, sesionesUsadas: 4, estado: 'activo' },
      { id: 803, orderName: 'S00187', partnerId: 105, productId: 'cap-implante', fecha: d(-95), sesionesTotal: 2, sesionesUsadas: 1, estado: 'activo' },
      { id: 804, orderName: 'S00431', partnerId: 106, productId: 'cap-sesion-unica', fecha: d(0), sesionesTotal: 1, sesionesUsadas: 0, estado: 'activo' },
    ];
    // calendar.event / historial de visitas
    const visitas = [
      { id: 901, partnerId: 101, fecha: d(-40), motivo: 'Consulta / valoración', nota: 'Compra plan Starter' },
      { id: 902, partnerId: 101, fecha: d(-26), motivo: 'Sesión de tratamiento', nota: 'Sesión 1/5 (mesoterapia + PRP)' },
      { id: 903, partnerId: 101, fecha: d(-12), motivo: 'Sesión de tratamiento', nota: 'Sesión 2/5' },
      { id: 904, partnerId: 102, fecha: d(-60), motivo: 'Consulta / valoración', nota: 'Compra plan Advanced' },
      { id: 905, partnerId: 102, fecha: d(-14), motivo: 'Sesión de tratamiento', nota: 'Sesión 4/10' },
      { id: 906, partnerId: 103, fecha: d(-10), motivo: 'Consulta / valoración', nota: 'Valoración capilar, no eligió plan' },
      { id: 907, partnerId: 104, fecha: d(-3), motivo: 'Consulta / valoración', nota: 'Consulta capilar pendiente de pago' },
      { id: 908, partnerId: 105, fecha: d(-95), motivo: 'Procedimiento', nota: 'Implante capilar (financiado con Addi)' },
      { id: 909, partnerId: 105, fecha: d(-30), motivo: 'Control / seguimiento', nota: 'Control + PRP 1/2' },
    ];
    // Check-ins de hoy ya registrados (para que el panel no arranque vacío)
    const checkins = [
      { id: 1, turno: 'R-001', partnerId: 105, hora: '07:42', motivo: 'Control / seguimiento', estado: 'atendido', asistencia: true, origen: 'kiosco', interes: null, pagoIntencion: null },
      { id: 2, turno: 'R-002', partnerId: 102, hora: '08:10', motivo: 'Control / seguimiento', estado: 'consulta', asistencia: true, origen: 'kiosco', interes: null, pagoIntencion: null },
      { id: 3, turno: 'R-003', partnerId: 106, hora: '08:31', motivo: 'Control / seguimiento', estado: 'espera', asistencia: false, origen: 'recepcion', interes: null, pagoIntencion: 'recepcion' },
    ];
    return { fechaSemilla: d(0), seq: { partner: 200, factura: 600, pago: 800, paquete: 900, visita: 1000, checkin: 3, doc: 500 }, partners, facturas, pagos, paquetes, visitas, checkins };
  }

  window.RogansData = { CATALOGO, LINEAS, METODOS_PAGO, TIPOS_DOC, MOTIVOS, EPS, semilla };
})();
