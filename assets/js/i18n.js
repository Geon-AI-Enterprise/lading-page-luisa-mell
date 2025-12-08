// ========================================
// Multi-language Support
// ========================================

export const translations = {
    pt: {
        'nav.help': 'Como ajudar',
        'nav.adopt': 'Adotar',
        'nav.sponsor': 'Apadrinhar',
        'nav.about': 'Quem somos',
        'donation': 'Doação',
        'hero.title': 'Bem-vindo ao Instituto Luisa Mell'
    },
    en: {
        'nav.help': 'How to Help',
        'nav.adopt': 'Adopt',
        'nav.sponsor': 'Sponsor',
        'nav.about': 'About Us',
        'donation': 'Donate',
        'hero.title': 'Welcome to Luisa Mell Institute'
    },
    es: {
        'nav.help': 'Cómo ayudar',
        'nav.adopt': 'Adoptar',
        'nav.sponsor': 'Apadrinar',
        'nav.about': 'Quiénes somos',
        'donation': 'Donación',
        'hero.title': 'Bienvenido al Instituto Luisa Mell'
    }
};

// Current language state
export let currentLang = 'pt';

// ========================================
// Language Switching (Core)
// ========================================

export function changeLanguage(lang) {
    currentLang = lang;

    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang] && translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang;

    // Update hidden native select (para manter compatibilidade)
    const selectElement = document.getElementById('language-select');
    if (selectElement) {
        selectElement.value = lang;
    }

    // Save preference to localStorage
    localStorage.setItem('preferredLanguage', lang);

    // Dispatch custom event for other modules to listen
    document.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang } }));
}

export function loadSavedLanguage() {
    const savedLang = localStorage.getItem('preferredLanguage');
    if (savedLang && translations[savedLang]) {
        changeLanguage(savedLang);
        return savedLang;
    }
    return currentLang;
}
