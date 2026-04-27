document.addEventListener('DOMContentLoaded', () => {
  const breadcrumb = document.getElementById('directory-breadcrumb');
  const rootGrid = document.getElementById('directory-root');
  const allGrids = document.querySelectorAll('.directory-grid');

  const categoryLabels = {
    contratos: 'Contratos e Documentos',
    relatorios: 'Relatórios',
    acoes: 'Ações',
    doc031717: 'Doc.031717/2025',
  };

  const parentMap = {
    doc031717: 'contratos',
  };

  let currentPath = [];

  document.querySelectorAll('.directory-card[data-target]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.directory-card__download')) return;

      const target = card.dataset.target;
      const subGrid = document.getElementById(`directory-${target}`);
      if (!subGrid) return;

      allGrids.forEach((g) => g.classList.add('hidden'));
      subGrid.classList.remove('hidden');

      if (parentMap[target]) {
        currentPath = [parentMap[target], target];
      } else {
        currentPath = [target];
      }
      updateBreadcrumb();
    });
  });

  function updateBreadcrumb() {
    breadcrumb.innerHTML = '';

    const rootItem = document.createElement('span');
    rootItem.className = 'breadcrumb-item' + (currentPath.length === 0 ? ' active' : '');
    rootItem.textContent = 'Transparência';
    rootItem.addEventListener('click', () => navigateTo([]));
    breadcrumb.appendChild(rootItem);

    currentPath.forEach((key, i) => {
      const sep = document.createElement('span');
      sep.className = 'breadcrumb-separator';
      sep.textContent = '›';
      breadcrumb.appendChild(sep);

      const item = document.createElement('span');
      const isLast = i === currentPath.length - 1;
      item.className = 'breadcrumb-item' + (isLast ? ' active' : '');
      item.textContent = categoryLabels[key] || key;
      if (!isLast) {
        const pathSlice = currentPath.slice(0, i + 1);
        item.addEventListener('click', () => navigateTo(pathSlice));
      }
      breadcrumb.appendChild(item);
    });
  }

  function navigateTo(path) {
    currentPath = path;
    allGrids.forEach((g) => g.classList.add('hidden'));

    if (path.length === 0) {
      rootGrid.classList.remove('hidden');
    } else {
      const target = path[path.length - 1];
      const grid = document.getElementById(`directory-${target}`);
      if (grid) grid.classList.remove('hidden');
    }
    updateBreadcrumb();
  }
});
