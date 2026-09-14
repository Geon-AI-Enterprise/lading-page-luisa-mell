// ========================================
// Cookie Consent (LGPD)
// Banner de consentimento que aparece em todas as paginas ate o
// usuario decidir, e persiste a escolha em localStorage. Depois de
// decidir, nao aparece mais (a menos que o consentimento seja limpo
// ou a versao mude).
// ========================================

import { translations, currentLang } from './i18n.js';

const STORAGE_KEY = 'ilm_cookie_consent';
// Incremente a versao para voltar a pedir consentimento a todos
// (ex.: se a politica de cookies mudar).
const CONSENT_VERSION = 1;

/** Le o consentimento salvo (ou null se ausente/invalido/versao antiga). */
function readConsent() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    return data && data.version === CONSENT_VERSION ? data : null;
  } catch (e) {
    return null;
  }
}

/** Persiste a escolha do usuario e notifica o restante da aplicacao. */
function saveConsent(choice) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        choice, // 'accepted' | 'rejected'
        version: CONSENT_VERSION,
        timestamp: new Date().toISOString(),
      })
    );
  } catch (e) {
    console.warn('Nao foi possivel salvar o consentimento de cookies:', e);
  }
  // Ponto de integracao futuro: scripts nao essenciais (analytics, pixels)
  // devem escutar este evento e so carregar quando choice === 'accepted'.
  document.dispatchEvent(
    new CustomEvent('cookie-consent-changed', { detail: { choice } })
  );
}

/** Retorna o texto traduzido para o idioma atual (fallback: pt). */
function t(key) {
  const lang = translations[currentLang] ? currentLang : 'pt';
  return (translations[lang] && translations[lang][key]) || translations.pt[key] || '';
}

/** Monta o elemento do banner (com data-i18n para troca de idioma ao vivo). */
function buildBanner() {
  const el = document.createElement('div');
  el.className = 'cookie-consent';
  el.id = 'cookie-consent';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-live', 'polite');
  el.setAttribute('aria-label', 'Aviso de cookies');
  el.innerHTML = `
    <div class="cookie-consent__inner">
      <div class="cookie-consent__text">
        <p class="cookie-consent__title" data-i18n="cookie.title">${t('cookie.title')}</p>
        <p class="cookie-consent__desc" data-i18n="cookie.desc">${t('cookie.desc')}</p>
      </div>
      <div class="cookie-consent__actions">
        <button type="button" class="cookie-consent__btn cookie-consent__btn--reject" data-i18n="cookie.reject">${t('cookie.reject')}</button>
        <button type="button" class="cookie-consent__btn cookie-consent__btn--accept" data-i18n="cookie.accept">${t('cookie.accept')}</button>
      </div>
    </div>`;
  return el;
}

/** Anima a saida e remove o banner do DOM. */
function hideBanner(el) {
  el.classList.add('cookie-consent--hiding');
  const remove = () => el.remove();
  el.addEventListener('transitionend', remove, { once: true });
  // Fallback caso o transitionend nao dispare
  setTimeout(remove, 500);
}

/**
 * Inicializa o consentimento de cookies. Chamado em main.js apos a
 * configuracao de idioma. Nao exibe nada se o usuario ja decidiu.
 */
export function setupCookieConsent() {
  if (readConsent()) return;
  if (document.getElementById('cookie-consent')) return;

  const banner = buildBanner();
  document.body.appendChild(banner);

  banner
    .querySelector('.cookie-consent__btn--accept')
    .addEventListener('click', () => {
      saveConsent('accepted');
      hideBanner(banner);
    });

  banner
    .querySelector('.cookie-consent__btn--reject')
    .addEventListener('click', () => {
      saveConsent('rejected');
      hideBanner(banner);
    });
}
