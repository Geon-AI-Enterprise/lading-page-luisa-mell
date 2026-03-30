/**
 * Filtros Dropdown para Mobile
 * Toggle do menu de filtros em resoluções menores
 */

document.addEventListener('DOMContentLoaded', () => {
  const filtersContainer = document.getElementById('adopt-filters');
  const filtersToggle = document.getElementById('filters-toggle');
  const filtersList = document.getElementById('filters-list');

  if (!filtersToggle || !filtersContainer) return;

  // Toggle do dropdown
  filtersToggle.addEventListener('click', () => {
    const isOpen = filtersContainer.classList.toggle('open');
    filtersToggle.setAttribute('aria-expanded', isOpen);
  });

  // Fechar ao clicar em um filtro (opcional - melhor UX)
  const filterButtons = filtersList.querySelectorAll('.adopt-filter-btn');
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Fecha o dropdown após selecionar um filtro em mobile
      if (window.innerWidth <= 768) {
        filtersContainer.classList.remove('open');
        filtersToggle.setAttribute('aria-expanded', 'false');
      }
    });
  });

  // Fechar ao clicar fora
  document.addEventListener('click', (e) => {
    if (!filtersContainer.contains(e.target) && filtersContainer.classList.contains('open')) {
      filtersContainer.classList.remove('open');
      filtersToggle.setAttribute('aria-expanded', 'false');
    }
  });
});
