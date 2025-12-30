// ========================================
// Animal Service - Edge Function Integration
// Instituto Luisa Mell
// ========================================

import { fetchAnimalsSecure } from './supabase-client.js';

/**
 * Busca animais via Edge Function com filtros opcionais
 * @param {Object} filters - Objeto com filtros a aplicar
 * @param {string} filters.type - 'dogs', 'cats', 'all'
 * @param {string} filters.size - 'p', 'm', 'g'
 * @param {string} filters.gender - 'male', 'female'
 * @param {boolean} filters.isPuppy - true para filhotes
 * @param {string} pageType - 'adoption' ou 'sponsorship'
 * @returns {Promise<Array>} Lista de animais
 */
export async function fetchAnimals(filters = {}, pageType = 'adoption') {
    try {
        // Preparar filtros para a API
        const apiFilters = {
            pageType: pageType,
            limit: 12
        };

        // Converter tipo do frontend para o formato da API
        if (filters.type && filters.type !== 'all') {
            apiFilters.type = filters.type === 'dogs' ? 'dog' : 'cat';
        }

        // Adicionar outros filtros se existirem
        if (filters.size) {
            apiFilters.size = filters.size;
        }

        if (filters.gender) {
            apiFilters.gender = filters.gender;
        }

        if (filters.isPuppy) {
            apiFilters.isPuppy = true;
        }

        // Buscar via Edge Function (seguro)
        const result = await fetchAnimalsSecure(apiFilters);
        
        return result.data || [];
    } catch (error) {
        console.error('Erro no fetchAnimals:', error);
        return [];
    }
}

/**
 * Busca um animal específico por ID
 * @param {string} id - UUID do animal
 * @returns {Promise<Object|null>} Dados do animal ou null
 */
export async function fetchAnimalById(id) {
    try {
        // Busca todos e filtra por ID (temporário até criar endpoint específico)
        const result = await fetchAnimalsSecure({ limit: 100 });
        return result.data?.find(animal => animal.id === id) || null;
    } catch (error) {
        console.error('Erro ao buscar animal:', error);
        return null;
    }
}

/**
 * Formata data para exibição em português
 * @param {string} dateString - Data no formato ISO
 * @returns {string} Data formatada (ex: "20/10/25")
 */
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear()).slice(-2);
    return `${day}/${month}/${year}`;
}

/**
 * Retorna o texto do tipo do animal baseado no idioma atual
 * @param {string} type - 'dog' ou 'cat'
 * @returns {string} Texto traduzido
 */
function getAnimalTypeText(type) {
    const lang = document.documentElement.lang || 'pt';
    const translations = {
        pt: { dog: 'Cão', cat: 'Gato' },
        en: { dog: 'Dog', cat: 'Cat' },
        es: { dog: 'Perro', cat: 'Gato' }
    };
    return translations[lang]?.[type] || translations.pt[type];
}

/**
 * Retorna placeholder de imagem
 * @param {string} name - Nome do animal
 * @returns {string} HTML do placeholder
 */
function getImagePlaceholder(name) {
    return `<span>Foto ${name}</span>`;
}

/**
 * Renderiza um card de animal
 * @param {Object} animal - Dados do animal do Supabase
 * @returns {string} HTML do card
 */
export function renderAnimalCard(animal) {
    const typeClass = animal.type === 'dog' ? 'dogs' : 'cats';
    const sizeAttr = animal.size ? `data-filter-size="${animal.size}"` : '';
    const genderAttr = animal.gender ? `data-filter-gender="${animal.gender}"` : '';
    const puppyAttr = animal.is_puppy ? 'data-filter-puppy="true"' : '';

    const imageContent = animal.photo_url 
        ? `<img src="${animal.photo_url}" alt="${animal.name}" loading="lazy">`
        : getImagePlaceholder(animal.name);

    const rescueDateText = animal.rescue_date 
        ? `Resgatado em ${formatDate(animal.rescue_date)}` 
        : '';

    return `
        <article class="adopt-card" 
            data-filter-type="${typeClass}" 
            ${sizeAttr}
            ${genderAttr}
            ${puppyAttr}
            data-id="${animal.id}">
            <div class="adopt-card__image hero-placeholder">
                ${imageContent}
            </div>
            <div class="adopt-card__content">
                <h3 class="adopt-card__name">${animal.name}</h3>
                <p class="adopt-card__type">${getAnimalTypeText(animal.type)}</p>
                <p class="adopt-card__info">${animal.breed || 'Sem raça definida'}</p>
                ${rescueDateText ? `<p class="adopt-card__date">${rescueDateText}</p>` : ''}
                ${animal.quote ? `<p class="adopt-card__quote">"${animal.quote}"</p>` : ''}
                <button class="btn-primary" data-i18n="adopt.btnKnow">Conheça-me</button>
            </div>
        </article>
    `;
}

/**
 * Renderiza skeleton cards para loading
 * @param {number} count - Quantidade de skeletons
 * @returns {string} HTML dos skeletons
 */
export function renderSkeletonCards(count = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <article class="adopt-card adopt-card--skeleton">
                <div class="adopt-card__image skeleton-box"></div>
                <div class="adopt-card__content">
                    <div class="skeleton-text skeleton-text--title"></div>
                    <div class="skeleton-text skeleton-text--small"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-text"></div>
                    <div class="skeleton-btn"></div>
                </div>
            </article>
        `;
    }
    return html;
}

/**
 * Renderiza mensagem de erro
 * @returns {string} HTML da mensagem de erro
 */
export function renderErrorMessage() {
    return `
        <div class="adopt-error">
            <div class="adopt-error__icon">⚠️</div>
            <h3 class="adopt-error__title">Ops! Algo deu errado</h3>
            <p class="adopt-error__text">
                Não foi possível carregar os animais no momento. 
                Por favor, tente novamente mais tarde.
            </p>
            <button class="btn-primary adopt-error__btn" onclick="location.reload()">
                Tentar novamente
            </button>
        </div>
    `;
}

/**
 * Renderiza lista de animais no grid
 * @param {Array} animals - Lista de animais
 * @param {HTMLElement} container - Container do grid
 */
export function renderAnimalsToGrid(animals, container) {
    if (!container) return;

    if (animals.length === 0) {
        // Mostra mensagem de nenhum resultado
        const noResultsElement = document.getElementById('adopt-no-results');
        if (noResultsElement) {
            noResultsElement.hidden = false;
            container.style.display = 'none';
        }
        return;
    }

    // Esconde mensagem de nenhum resultado
    const noResultsElement = document.getElementById('adopt-no-results');
    if (noResultsElement) {
        noResultsElement.hidden = true;
    }

    container.style.display = '';
    container.innerHTML = animals.map(animal => renderAnimalCard(animal)).join('');
}

/**
 * Inscreve-se para atualizações em tempo real (opcional)
 * @param {Function} callback - Função a ser chamada quando houver mudanças
 * @returns {Object} Subscription object para cancelar
 */
export function subscribeToAnimals(callback) {
    const subscription = supabase
        .channel('animals-changes')
        .on(
            'postgres_changes',
            {
                event: '*',
                schema: 'public',
                table: 'animals'
            },
            (payload) => {
                console.log('Mudança detectada:', payload);
                callback(payload);
            }
        )
        .subscribe();

    return subscription;
}
