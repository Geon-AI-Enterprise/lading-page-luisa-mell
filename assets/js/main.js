// ========================================
// Main JavaScript - Initialization
// ========================================

import { loadSavedLanguage, currentLang, changeLanguage } from './i18n.js';
import {
  setupCustomLanguageDropdown,
  setupMobileLanguageSwitcher,
  setupNativeSelectFallback,
  updateAllLanguageVisuals,
} from './language-switcher.js';
import { setupMobileMenu } from './navigation.js';
import { setupSmoothScroll, handleHeaderScroll } from './scroll.js';

// ========================================
// HERO - Carrossel de banners (placeholder)
// ========================================

function setupHeroCarousel() {
  const banner = document.querySelector('.hero__banner');
  const dots = document.querySelectorAll('.hero-dot');

  if (!banner || dots.length === 0) return;

  let currentIndex = 0;
  let autoTimer = null;
  const total = dots.length;

  function clearAllStates() {
    dots.forEach((dot) => dot.classList.remove('hero-dot--active'));
    for (let i = 0; i < total; i += 1) {
      banner.classList.remove(`hero__banner--slide-${i}`);
    }
  }

  function goToSlide(index) {
    const safeIndex = ((index % total) + total) % total;

    clearAllStates();
    banner.classList.add(`hero__banner--slide-${safeIndex}`);
    dots[safeIndex].classList.add('hero-dot--active');
    currentIndex = safeIndex;
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = window.setInterval(nextSlide, 7000); // 7s para o hero
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  // Clique nos pontinhos
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      startAuto();
    });
  });

  // Pausa quando a aba não está visível
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAuto();
    } else {
      startAuto();
    }
  });

  // Estado inicial
  goToSlide(0);
  startAuto();
}

// ========================================
// GALERIA "4 fotos" (placeholder de carrossel)
// ========================================

function setupAboutGallerySlider() {
  const frame = document.querySelector('.about__gallery-frame');
  const imageBox = document.querySelector('.about__gallery-image');
  const dots = document.querySelectorAll('.about__gallery-dots span');

  if (!frame || !imageBox || dots.length === 0) return;

  let currentIndex = 0;
  let autoTimer = null;
  const total = dots.length;

  function clearAllStates() {
    dots.forEach((dot) => dot.classList.remove('about__dot--active'));
    for (let i = 0; i < total; i += 1) {
      imageBox.classList.remove(`about__gallery-image--slide-${i}`);
    }
  }

  function goToSlide(index) {
    const safeIndex = ((index % total) + total) % total;

    clearAllStates();
    imageBox.classList.add(`about__gallery-image--slide-${safeIndex}`);
    dots[safeIndex].classList.add('about__dot--active');
    currentIndex = safeIndex;
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function startAuto() {
    stopAuto();
    autoTimer = window.setInterval(nextSlide, 6000); // 6s
  }

  function stopAuto() {
    if (autoTimer) {
      window.clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      goToSlide(index);
      startAuto();
    });
  });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopAuto();
    } else {
      startAuto();
    }
  });

  goToSlide(0);
  startAuto();
}

// ========================================
// Micro-interações dos cards "Como ajudar"
// ========================================

function setupHelpCardsInteractions() {
  const cards = document.querySelectorAll('.help-card');

  if (!cards.length) return;

  cards.forEach((card) => {
    card.addEventListener('mouseenter', () => {
      card.classList.add('help-card--hover');
    });

    card.addEventListener('mouseleave', () => {
      card.classList.remove('help-card--hover');
    });
  });
}

// ========================================
// Initialization
// ========================================

document.addEventListener('DOMContentLoaded', () => {
  // 1. Language Switcher (desktop + mobile)
  setupCustomLanguageDropdown();
  setupMobileLanguageSwitcher();

  // 2. Load saved language preference
  const savedLang = loadSavedLanguage();
  // Se não há idioma salvo, aplicamos o idioma corrente para garantir que
  // todos os elementos com `data-i18n` sejam atualizados (isso cobre
  // alterações recentes no HTML que adicionaram atributos).
  if (!savedLang) {
    changeLanguage(currentLang);
  }
  // Garante estado visual dos controles de idioma
  updateAllLanguageVisuals(currentLang);

  // 3. Fallback: Native select event listener
  setupNativeSelectFallback();

  // 4. Mobile menu setup
  setupMobileMenu();

  // 5. Smooth scrolling & header effect
  setupSmoothScroll();
  handleHeaderScroll();

  // 6. Animações / interações da Home
  setupHeroCarousel();
  setupAboutGallerySlider();
  setupHelpCardsInteractions();
});
