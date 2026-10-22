# Rogans · Check-in de pacientes (prototipo navegable)

> **Datos de ejemplo — sin conexión a Odoo.** Esto es una maqueta funcional para validar el flujo.
> Ningún dato sale del navegador: todo se guarda en `localStorage`.

## Cómo abrirlo

Es HTML/CSS/JS sin dependencias ni compilación.

1. Descomprime `rogans-checkin-prototipo.zip` (o usa la carpeta `dist/`).
2. Sirve la carpeta con cualquier servidor estático, por ejemplo:
   ```bash
   cd dist && python3 -m http.server 8080
   ```
3. Abre:
   - **Kiosco (iPad horizontal):** http://localhost:8080/index.html
   - **Panel de recepción (escritorio):** http://localhost:8080/recepcion.html

Abrir `index.html` con doble clic también funciona en la mayoría de navegadores. Para compartir
kiosco y recepción en el mismo equipo, ábrelos en dos pestañas: se sincronizan solos.
En el iPad: Safari → Compartir → "Agregar a inicio" y usar Acceso Guiado para dejarlo fijo.

**Reiniciar la demo:** botón "Reiniciar demo" en recepción (los datos se reinician también cada día).

## Documentos de ejemplo

| Documento | Paciente (ficticio) | Qué muestra |
|---|---|---|
| CC 1010101010 | Carlos Andrés Prueba Gómez | Saldo pendiente vencido ($650.000) + plan Starter activo |
| CC 52000111 | Laura Ejemplo Martínez | Al día + plan Advanced activo (no ve catálogo) |
| CC 79000222 | Andrés Demo Rojas | Al día, sin paquete → ve el catálogo |
| CE 600123 | María Ficticia López | Consulta pendiente ($50.000) + sin paquete + sin autorización Ley 1581 |
| CC 1020304050 | Jorge Ficticio Peña | Sesión Única pendiente de pago ($350.000) → probar "Pagar con link Bold" |
| CC 1000000005 | Sofía Muestra Ruiz | Implante capilar financiado con Addi, al día |
| Cualquier otro (ej. CC 1234567890) | — | Paciente nuevo → formulario de registro |

## Flujo

**Kiosco (paciente)**
1. Bienvenida → "Iniciar check-in".
2. Tipo de documento (CC, CE, TI, PA, PPT) + número en teclado numérico.
3. "Consultando en Odoo…" (simulado).
4. Confirmar/actualizar datos: nombre, celular, correo, fecha de nacimiento, EPS (opcional),
   dirección, contacto de emergencia, motivo de la visita y autorización de datos (Ley 1581 de 2012).
   Si no existe en Odoo, el mismo formulario sirve de registro de paciente nuevo.
5. Estado de cuenta: "Al día" o "Saldo pendiente" con el detalle de facturas.
   El paciente elige pagar en recepción o con link Bold (QR simulado + "Simular pago aprobado").
6. Si **no tiene paquete activo**, ve el catálogo por línea: Capilar (alopecia), Facial, Corporal y
   Otras líneas. Puede marcar un plan de interés o decir "lo hablo con mi médico".
7. Resumen y **"Check-in completado"** con número de turno (R-001, R-002…). Vuelve al inicio en 30 s.

**Panel de recepción**
- Lista de check-ins de hoy: turno, hora, origen (kiosco/recepción), motivo, plan, estado de pago y
  estado (en espera / en consulta / atendido). Indicadores y filtros; búsqueda por cédula o nombre.
- Si se busca una cédula que no está en la lista: hacer check-in manual del paciente existente o
  registrar un paciente nuevo.
- Ficha del paciente (panel lateral):
  - **Resumen:** saldo, plan activo, interés marcado en el kiosco, contacto, Ley 1581.
  - **Datos:** editar y guardar.
  - **Pagos:** facturas y pagos; registrar pago con efectivo, tarjeta (datáfono), transferencia,
    link Bold, Mercado Pago, Addi o Sistecrédito (permite abonos parciales).
  - **Paquetes:** asignar/vender paquete (opción "asignar y cobrar"), registrar sesión de hoy.
  - **Historial** de visitas.
  - Cambiar estado del turno y marcar asistencia.

## Qué está simulado

- **Todo el acceso a Odoo**: búsqueda, creación y actualización de pacientes, facturas, pagos,
  paquetes y sesiones. Se hace en `js/odooService.js` con latencia artificial y `localStorage`
  (clave `rogans-checkin-demo-v1`).
- Link de pago Bold / QR, envío por WhatsApp, Mercado Pago, Addi y Sistecrédito: no hay cobro real.
- Pacientes, facturas y números de documento: **ficticios**.

## Precios

Los precios **capilares y de valoraciones son reales**, tomados de rogansya.com (promoción online,
octubre 2026). El resto aparece marcado como **"precio de ejemplo"** en la interfaz porque el sitio
no publica valor en COP.

| Ítem | Precio | Fuente |
|---|---|---|
| Sesión Única (capilar) | $350.000 (antes $520.000) | https://rogansya.com/cuidado-capilar/ · /tratamiento-capilar/ |
| Plan Starter | $1.650.000 (antes $2.290.000) | ídem |
| Plan Advanced ("Más popular") | $2.800.000 (antes $4.240.000) | ídem |
| Implante Capilar | Desde $10.000.000 según número de unidades foliculares (confirmado por Esteban) | ídem |
| Consulta / diagnóstico capilar | $50.000 redimibles | https://rogansya.com/diagnostico-capilar/ |
| Valoración rejuvenecimiento facial | $75.000 — gratis por tiempo limitado | https://rogansya.com/rejuvenecimiento-facial/ |
| Valoración cuidado de la piel | $100.000 — gratis | https://rogansya.com/cuidado-de-la-piel/ |
| Toxina botulínica, Ácido hialurónico, Bioestimuladores, Harmonyca | **precio de ejemplo** | nombres de /rejuvenecimiento-facial/ y /producto/harmonyca/ |
| Sueroterapia, Hidrolipoclasia | **precio de ejemplo** | /tratamientos-corporales/ ("precio en la valoración") |
| Rendimiento sexual masculino, Nutrición, Psicología | **precio de ejemplo** | menú de rogansya.com |

Nota: la API de WooCommerce del sitio devuelve valores en "USD" que no corresponden a los precios
publicados, por eso no se usaron.

## Plan de integración con Odoo

Toda la interfaz habla **solo** con `odooService.js`. Para integrar, se reemplaza el cuerpo de cada
función por una llamada a un **backend propio** (proxy) que habla con Odoo por JSON-RPC/XML-RPC.
**Nunca** poner la API key de Odoo en el navegador del kiosco.

| Función | Modelo Odoo | Operación |
|---|---|---|
| `buscarPacientePorCedula` | `res.partner` | `search_read` por `vat` (+ `l10n_latam_identification_type_id`) |
| `crearPaciente` / `actualizarPaciente` | `res.partner` | `create` / `write` (campos x_ para fecha nac., EPS, contacto emergencia, autorización Ley 1581) |
| `obtenerPagosPendientes` / `obtenerFacturas` | `account.move` | `search_read` `move_type=out_invoice`, `state=posted`, `amount_residual>0` |
| `registrarPago` | `account.payment` (o `account.payment.register`) | crear y conciliar con la factura; diario según método |
| `obtenerPaquetes` | `product.product` / `product.template` | catálogo por categoría (capilar, facial, corporal…) |
| `venderPaquete` | `sale.order` + `sale.order.line` → factura | `create`, `action_confirm`, facturar |
| `obtenerPaquetesPaciente` / `registrarSesion` | `sale.order` (o módulo de sesiones / `project.task` / citas) | por definir |
| `registrarCheckin` / `listarCheckinsHoy` / `actualizarCheckin` | modelo nuevo `x_checkin` o `calendar.event`/citas | por definir |
| `obtenerHistorial` | `calendar.event` / visitas | por definir |

Pasos sugeridos:
1. Definir campos personalizados en `res.partner` y el modelo de check-in/turnos.
2. Backend pequeño (p. ej. Node o Python) con usuario técnico de Odoo de permisos mínimos,
   HTTPS y un token por dispositivo para el kiosco.
3. Bold: crear el link de pago desde el backend y confirmar con el webhook → `account.payment`.
4. Recepción con inicio de sesión (usuarios de Odoo o SSO).
5. Pruebas en una base de Odoo de staging antes de producción.

## Estructura

```
src/                  fuente (igual a dist/)
  index.html          kiosco
  recepcion.html      panel de recepción
  css/styles.css      estilos (marca Rogans: Poppins, #00d0c0, #003334)
  js/data.js          catálogo, métodos de pago y datos semilla ficticios
  js/odooService.js   capa simulada de Odoo (único punto a reemplazar)
  js/util.js          formato COP es-CO, fechas, etc.
  js/kiosk.js         pantallas del kiosco
  js/recepcion.js     panel de recepción
  assets/             logos, iconos y fuente Poppins
dist/                 versión lista para publicar
screenshots/          capturas 1180×820
build.sh              regenera dist/ y el zip
```
