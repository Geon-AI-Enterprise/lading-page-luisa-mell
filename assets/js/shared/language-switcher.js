// ========================================
// Custom Language Dropdown Logic
// ========================================

import { changeLanguage, currentLang } from './i18n.js';

export function setupCustomLanguageDropdown() {
    const switcher = document.getElementById('language-switcher');
    const displayButton = document.getElementById('lang-display');
    const dropdown = document.getElementById('lang-dropdown');
    const selectElement = document.getElementById('language-select');

    // Segurança: se os elementos não existirem no HTML, para a execução
    if (!switcher || !displayButton || !dropdown) return;

    // 1. Toggle visibility ao clicar no botão
    displayButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechar imediatamente
        const isExpanded = displayButton.getAttribute('aria-expanded') === 'true';
        toggleDropdown(!isExpanded);
    });

    // 2. Handle seleção de idioma na lista customizada
    dropdown.querySelectorAll('.lang-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const newLang = e.target.getAttribute('data-lang');

            // Fecha o dropdown
            toggleDropdown(false);

            // Sincroniza e Executa a troca
            if (selectElement) selectElement.value = newLang;
            changeLanguage(newLang);
        });
    });

    // 3. Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!switcher.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Função auxiliar para abrir/fechar
    function toggleDropdown(show) {
        displayButton.setAttribute('aria-expanded', show);
        dropdown.hidden = !show;
    }

    // Listen to language change events
    document.addEventListener('languageChanged', (e) => {
        // CORREÇÃO AQUI: Usar a função exportada correta
        updateAllLanguageVisuals(e.detail.lang);
    });

    // Initialize display
    // CORREÇÃO AQUI: Usar a função exportada correta
    updateAllLanguageVisuals(currentLang);
}

// Setup dos Botões Mobile
export function setupMobileLanguageSwitcher() {
    const mobileButtons = document.querySelectorAll('.mob-lang-btn');
    
    mobileButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const newLang = e.target.getAttribute('data-lang');
            changeLanguage(newLang);
        });
    });
}

// Atualiza TODOS os visuais (Desktop e Mobile)
export function updateAllLanguageVisuals(lang) {
    // 1. Atualiza Desktop Dropdown
    const langCodeSpan = document.getElementById('current-lang-code');
    const dropdown = document.getElementById('lang-dropdown');

    if (langCodeSpan) langCodeSpan.textContent = lang.toUpperCase();
    
    if (dropdown) {
        dropdown.querySelectorAll('.lang-option').forEach(opt => {
            opt.classList.remove('active');
            if (opt.getAttribute('data-lang') === lang) {
                opt.classList.add('active');
            }
        });
    }

    // 2. Atualiza Mobile Buttons
    const mobileButtons = document.querySelectorAll('.mob-lang-btn');
    mobileButtons.forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-lang') === lang) {
            btn.classList.add('active');
        }
    });
}

// Fallback: Native select
export function setupNativeSelectFallback() {
    const languageSelect = document.getElementById('language-select');
    if (languageSelect) {
        languageSelect.addEventListener('change', (e) => {
            changeLanguage(e.target.value);
        });
    }
}