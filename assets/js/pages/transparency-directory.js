document.addEventListener('DOMContentLoaded', () => {
  const breadcrumb = document.getElementById('directory-breadcrumb');
  const rootGrid = document.getElementById('directory-root');
  const subGrids = document.querySelectorAll('.directory-sub');

  const categoryLabels = {
    contratos: 'Contratos e Documentos',
    relatorios: 'Relatórios',
    acoes: 'Ações',
  };

  // Navigate to a sub-directory
  rootGrid.querySelectorAll('.directory-card[data-target]').forEach((card) => {
    card.addEventListener('click', () => {
      const target = card.dataset.target;
      const subGrid = document.getElementById(`directory-${target}`);
      if (!subGrid) return;

      rootGrid.classList.add('hidden');
      subGrids.forEach((g) => g.classList.add('hidden'));
      subGrid.classList.remove('hidden');

      updateBreadcrumb(target);
    });
  });

  function updateBreadcrumb(category) {
    breadcrumb.innerHTML = '';

    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item';
    rootItem.textContent = 'Transparência';
    rootItem.addEventListener('click', () => navigateToRoot());
    breadcrumb.appendChild(rootItem);

    if (category) {
      const separator = document.createElement('span');
      separator.className = 'breadcrumb-separator';
      separator.textContent = '›';
      breadcrumb.appendChild(separator);

      const catItem = document.createElement('span');
      catItem.className = 'breadcrumb-item active';
      catItem.textContent = categoryLabels[category] || category;
      breadcrumb.appendChild(catItem);
    } else {
      rootItem.classList.add('active');
    }
  }

  function navigateToRoot() {
    subGrids.forEach((g) => g.classList.add('hidden'));
    rootGrid.classList.remove('hidden');
    updateBreadcrumb(null);
  }
});
