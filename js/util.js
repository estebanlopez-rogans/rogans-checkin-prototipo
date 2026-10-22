(function () {
  const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0, minimumFractionDigits: 0 });
  const U = {
    cop: n => fmt.format(Number(n) || 0).replace(/\u00a0/g, ' '),
    esc: s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])),
    fecha: iso => { if (!iso) return '—'; const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' }); },
    fechaLarga: () => new Date().toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' }),
    hora: () => new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true }),
    iniciales: n => String(n || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase(),
    primerNombre: n => String(n || '').split(/\s+/)[0],
    docFmt: n => String(n || '').replace(/\B(?=(\d{3})+(?!\d))/g, '.'),
    vencida: iso => iso && iso < window.odooService.hoy(),
    toast(msg) { const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg; document.body.appendChild(t); setTimeout(() => t.remove(), 2600); },
    precioHtml(p) {
      if (p.desde) return `<b>Desde ${U.cop(p.precio)}</b>${p.notaPrecio ? `<small class="precio-nota">${p.notaPrecio}</small>` : ''}`;
      if (p.gratisPromo) return `<b>Gratis</b><s>${U.cop(p.precio)}</s>`;
      return `<b>${U.cop(p.precio)}</b>${p.precioAntes ? `<s>${U.cop(p.precioAntes)}</s>` : ''}${p.precioEjemplo ? '<span class="tag ex">precio de ejemplo</span>' : ''}`;
    },
  };
  window.U = U;
})();
