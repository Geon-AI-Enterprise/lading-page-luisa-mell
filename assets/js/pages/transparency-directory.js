document.addEventListener('DOMContentLoaded', () => {
  const breadcrumb = document.getElementById('directory-breadcrumb');
  const rootGrid = document.getElementById('directory-root');
  const allGrids = document.querySelectorAll('.directory-grid');

  const categoryLabels = {
    'contratos-doc': 'Contratos e Documentos',
    'node-1-0': '1.0 Projeto 97777.2025',
    'node-1-1': '1.1 Consultor Administrativo',
    'node-2-1': '2.1 Agente Social',
    'node-3-1': '3.1 Serviços de Castração e Microchipagem',
    'node-4-1': '4.1 Documentos Adicionais',
    'node-5-1': '5.1 Contratação de Serviços Contábeis',
    'node-6-1': '6.1 Coordenador de Projeto',
    'node-7-1': '7.1 Coordenadora Técnica do Projeto',
    'node-8-1': '8.1 Serviços Gráficos',
  };

  const parentMap = {
    'contratos-doc': null,
    'node-1-0': 'contratos-doc',
    'node-1-1': 'node-1-0',
    'node-2-1': 'node-1-0',
    'node-3-1': 'node-1-0',
    'node-4-1': 'node-1-0',
    'node-5-1': 'node-1-0',
    'node-6-1': 'node-1-0',
    'node-7-1': 'node-1-0',
    'node-8-1': 'node-1-0',
  };

  let currentPath = [];

  function getPathTo(key) {
    const path = [];
    let current = key;
    while (current) {
      path.unshift(current);
      current = parentMap[current];
    }
    return path;
  }

  document.querySelectorAll('.directory-card[data-target]').forEach((card) => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.directory-card__download')) return;

      const target = card.dataset.target;
      const subGrid = document.getElementById(`directory-${target}`);
      if (!subGrid) return;

      allGrids.forEach((g) => g.classList.add('hidden'));
      subGrid.classList.remove('hidden');

      currentPath = getPathTo(target);
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
