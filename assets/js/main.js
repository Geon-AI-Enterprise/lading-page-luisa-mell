// ========================================
// Main JavaScript - Initialization
// ========================================

import { loadSavedLanguage } from './i18n.js';
import { setupCustomLanguageDropdown,
    setupMobileLanguageSwitcher,
    setupNativeSelectFallback, updateAllLanguageVisuals } from './language-switcher.js';
import { setupMobileMenu } from './navigation.js';
import { setupSmoothScroll, handleHeaderScroll } from './scroll.js';
import { currentLang } from './i18n.js';

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    // 1. Setup Custom Language Dropdown
    setupCustomLanguageDropdown();
    setupMobileLanguageSwitcher()

    // 2. Load saved language preference
    const savedLang = loadSavedLanguage();
    if (!savedLang || savedLang === 'pt') {
        // Garante estado inicial correto visualmente
        updateAllLanguageVisuals(currentLang);
    }

    // 3. Fallback: Native select event listener (caso ainda exista no DOM visível)
    setupNativeSelectFallback();

    // 4. Mobile menu setup
    setupMobileMenu();

    // 5. Setup smooth scrolling & Header effect
    setupSmoothScroll();
    handleHeaderScroll();
});
