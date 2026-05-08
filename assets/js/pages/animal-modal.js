// ========================================
// Animal Modal - Instituto Luisa Mell
// Modal de perfil do animal com dados do Supabase
// ========================================

import { fetchAnimalsSecure } from '../shared/supabase-client.js';
import { modalMain, modalGallery, modalBeforeAfter } from '../shared/image-transform.js';

// Cache do animal atual no modal
let currentAnimal = null;

// Cache de animais já carregados no grid — evita nova requisição ao abrir o modal
const animalCache = new Map();

/**
 * Registra um animal no cache (chamado pelo grid ao renderizar os cards)
 * @param {Object} animal - Dados completos do animal
 */
export function cacheAnimal(animal) {
    if (animal?.id) animalCache.set(animal.id, animal);
}

/**
 * Ícones de características de cuidado
 * IDs sincronizados com o sistema de gestão (careFeatureOptions)
 */
const careIcons = {
    special_diet: {
        icon: 'assets/images/shared/icons/care-food.svg',
        label: 'Alimentação especial'
    },
    vet_followup: {
        icon: 'assets/images/shared/icons/care-vet.svg',
        label: 'Acompanhamento veterinário'
    },
    continuous_medication: {
        icon: 'assets/images/shared/icons/care-medicine.svg',
        label: 'Medicamentos contínuos'
    },
    hygiene_care: {
        icon: 'assets/images/shared/icons/care-hygiene.svg',
        label: 'Cuidados de higiene'
    },
    special_shelter: {
        icon: 'assets/images/shared/icons/care-shelter.svg',
        label: 'Necessita abrigo adequado'
    },
    behavioral_training: {
        icon: 'assets/images/shared/icons/care-training.svg',
        label: 'Treinamento comportamental'
    }
};

/**
 * Busca um animal específico por ID
 * @param {string} id - UUID do animal
 * @returns {Promise<Object|null>} Dados do animal
 */
async function fetchAnimalById(id) {
    try {
        const result = await fetchAnimalsSecure({ id, limit: 1 });
        if (result.data && result.data.length > 0) {
            return result.data.find(animal => animal.id === id) || result.data[0];
        }
        return null;
    } catch (error) {
        console.error('Erro ao buscar animal:', error);
        return null;
    }
}

/**
 * Formata valor em reais
 * @param {number} value - Valor numérico
 * @returns {string} Valor formatado
 */
function formatCurrency(value) {
    if (!value) return 'R$ 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Renderiza ícones de características de cuidado
 * @param {string[]} features - Array de features do sistema de gestão
 * @returns {string} HTML dos ícones
 */
function renderCareIcons(features = []) {
    // Se não houver features cadastradas, não mostrar nada
    if (!features || features.length === 0) {
        return '';
    }
    
    return features.map(feature => {
        const iconData = careIcons[feature];
        if (!iconData) return '';
        
        return `
            <div class="animal-modal__care-icon" title="${iconData.label}">
                <img src="${iconData.icon}" alt="${iconData.label}" />
            </div>
        `;
    }).join('');
}

/**
 * Gera legenda textual das características de cuidado
 * @param {string[]} features - Array de features
 * @returns {string} Legenda separada por vírgula
 */
function renderCareCaption(features = []) {
    if (!features || features.length === 0) return '';
    const labels = features.map(f => careIcons[f]?.label).filter(Boolean);
    return labels.join(', ');
}

/**
 * Renderiza galeria de imagens
 * @param {string[]} urls - Array de URLs das imagens
 * @param {string} name - Nome do animal para alt
 * @returns {string} HTML da galeria
 */
function renderGallery(urls = [], name = '') {
    // Se não houver galeria, mostrar placeholders
    if (!urls || urls.length === 0) {
        return Array(4).fill('').map((_, i) => `
            <div class="animal-modal__gallery-item animal-modal__gallery-placeholder">
                <span>Foto ${i + 1}</span>
            </div>
        `).join('');
    }
    
    return urls.slice(0, 4).map((url, i) => `
        <div class="animal-modal__gallery-item">
            <img src="${modalGallery(url)}" alt="${name} - Foto ${i + 1}" loading="lazy" decoding="async" />
        </div>
    `).join('');
}

/**
 * Popula o modal com dados do animal
 * @param {Object} animal - Dados do animal
 */
function populateModal(animal) {
    currentAnimal = animal;
    const modal = document.getElementById('animal-profile-modal');
    if (!modal) return;

    // Nome
    const nameEl = modal.querySelector('.animal-modal__name');
    if (nameEl) nameEl.textContent = `Olá, sou o ${animal.name}!`;

    // Descrição
    const descEl = modal.querySelector('.animal-modal__description');
    if (descEl) {
        descEl.textContent = animal.description || 
            'Este animal aguarda um lar cheio de amor. Entre em contato para conhecê-lo melhor!';
    }

    // Foto antes
    const beforeContainer = modal.querySelector('.animal-modal__before');
    if (beforeContainer) {
        if (animal.photo_before_url) {
            beforeContainer.innerHTML = `
                <img src="${modalBeforeAfter(animal.photo_before_url)}" alt="${animal.name} - Antes" loading="lazy" decoding="async" />
                <span class="animal-modal__label">ANTES</span>
            `;
        } else {
            beforeContainer.innerHTML = `
                <div class="animal-modal__placeholder">
                    <span>📷</span>
                    <p>Foto não disponível</p>
                </div>
                <span class="animal-modal__label">ANTES</span>
            `;
        }
    }

    // Foto depois
    const afterContainer = modal.querySelector('.animal-modal__after');
    if (afterContainer) {
        if (animal.photo_after_url) {
            afterContainer.innerHTML = `
                <img src="${modalBeforeAfter(animal.photo_after_url)}" alt="${animal.name} - Depois" loading="lazy" decoding="async" />
                <span class="animal-modal__label">DEPOIS</span>
            `;
        } else {
            afterContainer.innerHTML = `
                <div class="animal-modal__placeholder">
                    <span>📷</span>
                    <p>Foto não disponível</p>
                </div>
                <span class="animal-modal__label">DEPOIS</span>
            `;
        }
    }

    // Botão Adote com nome do animal
    const adoptBtn = modal.querySelector('.animal-modal__btn--adopt');
    if (adoptBtn) {
        adoptBtn.textContent = `Adote o ${animal.name}`;
        adoptBtn.href = `adotar.html?animal=${animal.id}#contato`;
    }

    // Ícones de cuidados + legenda
    const careContainer = modal.querySelector('.animal-modal__care-icons');
    if (careContainer) {
        careContainer.innerHTML = renderCareIcons(animal.care_features);
    }
    const captionEl = modal.querySelector('.animal-modal__care-caption');
    if (captionEl) {
        captionEl.textContent = renderCareCaption(animal.care_features);
    }

    // Texto de ajuda com nome do animal
    const helpText = modal.querySelector('.animal-modal__help-text');
    if (helpText) {
        helpText.innerHTML = `Não posso adotar o ${animal.name}, mas <strong>quero ajudar</strong>:`;
    }

    // Galeria
    const galleryContainer = modal.querySelector('.animal-modal__gallery');
    if (galleryContainer) {
        galleryContainer.innerHTML = renderGallery(animal.gallery_urls, animal.name);
    }

    // Atualizar links dos botões com o ID do animal
    const sponsorBtn = modal.querySelector('.animal-modal__btn--sponsor');
    if (sponsorBtn) {
        sponsorBtn.href = `apadrinhar.html?animal=${animal.id}`;
    }

    const giftBtn = modal.querySelector('.animal-modal__btn--gift');
    if (giftBtn) {
        giftBtn.href = `https://institutoluisamell.colabore.org/doe/single_step?animal=${animal.id}`;
    }
}

/**
 * Abre o modal de perfil do animal
 * @param {string} animalId - UUID do animal
 */
export async function openAnimalModal(animalId) {
    const modal = document.getElementById('animal-profile-modal');
    const overlay = document.getElementById('animal-modal-overlay');
    
    if (!modal || !overlay) {
        console.error('Modal não encontrado no DOM');
        return;
    }

    // Mostrar loading state
    modal.classList.add('animal-modal--loading');
    overlay.classList.add('active');
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    try {
        // Tenta o cache local primeiro (dados já carregados no grid)
        const cached = animalCache.get(animalId);
        const animal = cached ?? await fetchAnimalById(animalId);

        if (animal) {
            populateModal(animal);
        } else {
            console.error('Animal não encontrado:', animalId);
            closeAnimalModal();
            return;
        }
    } catch (error) {
        console.error('Erro ao carregar animal:', error);
        closeAnimalModal();
        return;
    } finally {
        modal.classList.remove('animal-modal--loading');
    }
}

/**
 * Fecha o modal de perfil do animal
 */
export function closeAnimalModal() {
    const modal = document.getElementById('animal-profile-modal');
    const overlay = document.getElementById('animal-modal-overlay');
    
    if (modal) modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
    currentAnimal = null;
}

/**
 * Inicializa navegação do carrossel de galeria
 */
function initGalleryCarousel() {
    const gallery = document.querySelector('.animal-modal__gallery');
    const prevBtn = document.querySelector('.animal-modal__gallery-prev');
    const nextBtn = document.querySelector('.animal-modal__gallery-next');

    if (!gallery || !prevBtn || !nextBtn) return;

    prevBtn.addEventListener('click', () => {
        const item = gallery.querySelector('.animal-modal__gallery-item');
        if (item) {
            gallery.scrollBy({ left: -(item.offsetWidth + 16), behavior: 'smooth' });
        }
    });

    nextBtn.addEventListener('click', () => {
        const item = gallery.querySelector('.animal-modal__gallery-item');
        if (item) {
            gallery.scrollBy({ left: item.offsetWidth + 16, behavior: 'smooth' });
        }
    });
}

/**
 * Inicializa event listeners do modal
 */
export function initAnimalModal() {
    // Fechar ao clicar no X
    const closeBtn = document.querySelector('.animal-modal__close');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAnimalModal);
    }

    // Fechar ao clicar no overlay
    const overlay = document.getElementById('animal-modal-overlay');
    if (overlay) {
        overlay.addEventListener('click', closeAnimalModal);
    }

    // Fechar ao pressionar ESC
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAnimalModal();
        }
    });

    // Delegar clique nos botões "Conheça-me" dos cards
    document.addEventListener('click', (e) => {
        const knowMeBtn = e.target.closest('.adopt-card__btn[data-i18n="adopt.btnKnow"]') || e.target.closest('.btn-primary[data-i18n="adopt.btnKnow"]');
        if (knowMeBtn) {
            e.preventDefault();
            const card = knowMeBtn.closest('.adopt-card');
            if (card) {
                const animalId = card.dataset.id;
                if (animalId) {
                    openAnimalModal(animalId);
                }
            }
        }
    });

    // Inicializar carrossel da galeria
    initGalleryCarousel();

    console.log('🐾 Animal modal initialized');
}

// Auto-inicializar quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAnimalModal);
} else {
    initAnimalModal();
}
