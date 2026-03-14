(function () {
  const root = document.getElementById('toast-root');
  if (!root) return;

  window.showToast = function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `saas-toast saas-toast-${type}`;
    toast.innerHTML = `
      <div class="toast-indicator"></div>
      <div class="toast-content">
        <strong>${type === 'error' ? 'Atención' : type === 'info' ? 'Información' : 'Éxito'}</strong>
        <span>${message}</span>
      </div>
      <button class="toast-close" aria-label="Cerrar">×</button>
    `;
    document.body.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('is-visible'));
    const timer = setTimeout(() => hideToast(toast), 4200);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      clearTimeout(timer);
      hideToast(toast);
    });
  };

  function hideToast(toast) {
    toast.classList.remove('is-visible');
    setTimeout(() => toast.remove(), 280);
  }

  const message = root.dataset.toast;
  const type = root.dataset.type || 'success';
  if (message) window.showToast(message, type);
})();
