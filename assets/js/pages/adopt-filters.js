// ========================================
// Adopt Page - Filter Functionality with Supabase
// ========================================

import { fetchAnimals, renderAnimalsToGrid, renderSkeletonCards, renderErrorMessage } from './animal-service.js';

// Configuração de paginação
const ITEMS_PER_PAGE = 5;

// Estado atual dos filtros
let currentFilters = {
    type: 'all',
    size: null,
    gender: null,
    isPuppy: false
};

// Estado da paginação
let currentOffset = 0;
let hasMoreItems = true;
let isLoading = false;

// Tipo da página (adoption ou sponsorship)
let pageType = 'adoption';

// Referências aos elementos DOM
let animalsGrid = null;
let noResultsElement = null;
let loadMoreContainer = null;

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
function showLoading(append = false) {
    if (animalsGrid) {
        if (append) {
            // Mostrar loading inline no botão
            if (loadMoreContainer) {
                loadMoreContainer.innerHTML = `
                    <div class="adopt-load-more__loading">
                        <span class="adopt-load-more__spinner"></span>
                        Carregando...
                    </div>
                `;
            }
        } else {
            animalsGrid.innerHTML = renderSkeletonCards(ITEMS_PER_PAGE);
            animalsGrid.style.display = '';
        }
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
    hideLoadMore();
}

/**
 * Atualiza o botão "Carregar mais"
 */
function updateLoadMoreButton() {
    if (!loadMoreContainer) return;
    
    if (hasMoreItems) {
        loadMoreContainer.innerHTML = `
            <button class="adopt-load-more__btn btn-secondary" id="load-more-btn">
                Ver mais animais
            </button>
        `;
        
        const btn = document.getElementById('load-more-btn');
        if (btn) {
            btn.addEventListener('click', loadMoreAnimals);
        }
    } else {
        loadMoreContainer.innerHTML = `
            <p class="adopt-load-more__end">Você viu todos os animais disponíveis 🐾</p>
        `;
    }
}

/**
 * Esconde o container de carregar mais
 */
function hideLoadMore() {
    if (loadMoreContainer) {
        loadMoreContainer.innerHTML = '';
    }
}

/**
 * Carrega animais do Supabase com os filtros atuais
 */
async function loadAnimals() {
    if (isLoading) return;
    isLoading = true;
    
    // Resetar paginação
    currentOffset = 0;
    hasMoreItems = true;
    
    showLoading(false);

    try {
        const animals = await fetchAnimals(currentFilters, pageType, { 
            limit: ITEMS_PER_PAGE, 
            offset: 0 
        });
        
        renderAnimalsToGrid(animals, animalsGrid, false);
        
        // Verificar se há mais itens
        hasMoreItems = animals.length === ITEMS_PER_PAGE;
        currentOffset = animals.length;
        
        updateLoadMoreButton();
    } catch (error) {
        console.error('Erro ao carregar animais:', error);
        showError();
    } finally {
        isLoading = false;
    }
}

/**
 * Carrega mais animais (próxima página)
 */
async function loadMoreAnimals() {
    if (isLoading || !hasMoreItems) return;
    isLoading = true;
    
    showLoading(true);

    try {
        const animals = await fetchAnimals(currentFilters, pageType, { 
            limit: ITEMS_PER_PAGE, 
            offset: currentOffset 
        });
        
        if (animals.length > 0) {
            renderAnimalsToGrid(animals, animalsGrid, true);
            currentOffset += animals.length;
        }
        
        // Verificar se há mais itens
        hasMoreItems = animals.length === ITEMS_PER_PAGE;
        
        updateLoadMoreButton();
    } catch (error) {
        console.error('Erro ao carregar mais animais:', error);
        updateLoadMoreButton(); // Restaurar botão em caso de erro
    } finally {
        isLoading = false;
    }
}

/**
 * Atualiza um filtro e recarrega os animais
 */
async function updateFilter(filterName, value) {
    currentFilters[filterName] = value;
    // Resetar paginação ao mudar filtros
    currentOffset = 0;
    hasMoreItems = true;
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
    // Resetar paginação
    currentOffset = 0;
    hasMoreItems = true;
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
    const ageSwitch = document.querySelector('.adopt-filter-switch');
    const ageSwitchOptions = document.querySelectorAll('.adopt-filter-switch__option');
    
    animalsGrid = document.querySelector('.adopt-animals__grid');
    noResultsElement = document.getElementById('adopt-no-results');
    loadMoreContainer = document.getElementById('adopt-load-more');

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

    // Configura switch de idade (Filhote/Adulto)
    if (ageSwitch && ageSwitchOptions.length > 0) {
        ageSwitchOptions.forEach(option => {
            option.addEventListener('click', async () => {
                const filterType = option.getAttribute('data-filter');
                
                // Animar transição do toggle
                ageSwitchOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                
                // Atualizar filtro de idade
                if (filterType === 'puppies') {
                    currentFilters.isPuppy = true;
                } else {
                    currentFilters.isPuppy = false;
                }
                
                await loadAnimals();
            });
        });
    }

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

