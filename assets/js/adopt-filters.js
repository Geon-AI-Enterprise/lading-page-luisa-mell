// ========================================
// Adopt Page - Filter Functionality with Supabase
// ========================================

import { fetchAnimals, renderAnimalsToGrid, renderSkeletonCards, renderErrorMessage } from './animal-service.js';

// Estado atual dos filtros
let currentFilters = {
    type: 'all',
    size: null,
    gender: null,
    isPuppy: false
};

// Tipo da página (adoption ou sponsorship)
let pageType = 'adoption';

// Referências aos elementos DOM
let animalsGrid = null;
let noResultsElement = null;

/**
 * Detecta o tipo de página baseado na URL
 */
function detectPageType() {
    const path = window.location.pathname.toLowerCase();
    if (path.includes('apadrinhar')) {
        return 'sponsorship';
    }
    return 'adoption';
}

/**
 * Mostra loading skeleton enquanto carrega
 */
function showLoading() {
    if (animalsGrid) {
        animalsGrid.innerHTML = renderSkeletonCards(6);
        animalsGrid.style.display = '';
    }
    if (noResultsElement) {
        noResultsElement.hidden = true;
    }
}

/**
 * Mostra mensagem de erro
 */
function showError() {
    if (animalsGrid) {
        animalsGrid.innerHTML = renderErrorMessage();
        animalsGrid.style.display = '';
    }
}

/**
 * Carrega animais do Supabase com os filtros atuais
 */
async function loadAnimals() {
    showLoading();

    try {
        const animals = await fetchAnimals(currentFilters, pageType);
        renderAnimalsToGrid(animals, animalsGrid);
    } catch (error) {
        console.error('Erro ao carregar animais:', error);
        showError();
    }
}

/**
 * Atualiza um filtro e recarrega os animais
 */
async function updateFilter(filterName, value) {
    currentFilters[filterName] = value;
    await loadAnimals();
}

/**
 * Reseta todos os filtros
 */
async function resetFilters() {
    currentFilters = {
        type: 'all',
        size: null,
        gender: null,
        isPuppy: false
    };
    await loadAnimals();
}

/**
 * Configura os filtros da página de adoção/apadrinhamento
 */
export async function setupAdoptFilters() {
    const filterButtons = document.querySelectorAll('.adopt-filter-btn');
    const sizeBtn = document.getElementById('size-btn');
    const sizeMenu = document.getElementById('size-menu');
    const sizeOptions = document.querySelectorAll('.adopt-filter-size-option');
    
    animalsGrid = document.querySelector('.adopt-animals__grid');
    noResultsElement = document.getElementById('adopt-no-results');

    // Se não houver grid, não estamos em uma página de adoção/apadrinhamento
    if (!animalsGrid) return;

    // Detectar tipo da página
    pageType = detectPageType();

    // Carregar animais iniciais
    await loadAnimals();

    // Configura botões de filtro principal (tipo de animal)
    filterButtons.forEach(button => {
        button.addEventListener('click', async () => {
            const filterType = button.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Mapear filtros especiais
            if (filterType === 'puppies') {
                currentFilters.type = 'all';
                currentFilters.isPuppy = true;
            } else if (filterType === 'female') {
                currentFilters.type = 'all';
                currentFilters.gender = 'female';
                currentFilters.isPuppy = false;
            } else if (filterType === 'male') {
                currentFilters.type = 'all';
                currentFilters.gender = 'male';
                currentFilters.isPuppy = false;
            } else {
                currentFilters.type = filterType;
                currentFilters.gender = null;
                currentFilters.isPuppy = false;
            }

            await loadAnimals();
        });
    });

    // Botão "Ver todos" na mensagem de nenhum resultado
    if (noResultsElement) {
        const showAllBtn = noResultsElement.querySelector('.adopt-no-results__btn');
        if (showAllBtn) {
            showAllBtn.addEventListener('click', async () => {
                // Ativar o botão "Todos"
                filterButtons.forEach(btn => {
                    btn.classList.remove('active');
                    if (btn.getAttribute('data-filter') === 'all') {
                        btn.classList.add('active');
                    }
                });

                // Resetar filtro de tamanho se existir
                if (sizeBtn) {
                    const spanElement = sizeBtn.querySelector('span');
                    if (spanElement) {
                        spanElement.textContent = 'Tamanho';
                    }
                    sizeOptions.forEach(opt => opt.classList.remove('active'));
                }

                // Resetar todos os filtros
                await resetFilters();
            });
        }
    }

    // Funcionalidade do seletor de tamanho
    if (sizeBtn && sizeMenu) {
        sizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = sizeMenu.hidden;
            sizeMenu.hidden = !isHidden;
            sizeBtn.classList.toggle('active');
        });

        sizeOptions.forEach(option => {
            option.addEventListener('click', async (e) => {
                e.stopPropagation();
                const sizeFilter = option.getAttribute('data-filter');
                const sizeValue = sizeFilter.replace('size-', '');

                // Update active option
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Update button text
                const sizeText = option.textContent;
                const spanElement = sizeBtn.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = `Tamanho: ${sizeText}`;
                }

                // Close menu
                sizeMenu.hidden = true;
                sizeBtn.classList.remove('active');

                // Atualizar filtro e recarregar
                await updateFilter('size', sizeValue);
            });
        });

        // Fechar menu ao clicar fora
        document.addEventListener('click', () => {
            sizeMenu.hidden = true;
            sizeBtn.classList.remove('active');
        });
    }
}

// Exportar função para recarregar manualmente (útil para realtime)
export { loadAnimals, resetFilters };

