// ========================================
// Carrossel de empresas parceiras — Apoio e Parcerias
// Carrossel infinito (loop sem bordas vazias, via clonagem) com o
// card ativo destacado e maximizado ao centro. No desktop, inicia
// mostrando tres cards (vizinho esquerdo, ativo central e direito).
// ========================================

(function () {
  const carousel = document.getElementById('companies-carousel');
  if (!carousel) return;

  const viewport = carousel.querySelector('.companies-carousel__viewport');
  const track = carousel.querySelector('.companies-carousel__track');
  const prevBtn = carousel.querySelector('.companies-carousel__arrow--prev');
  const nextBtn = carousel.querySelector('.companies-carousel__arrow--next');

  let cards = Array.from(track.children);
  const originalCount = cards.length;
  if (!originalCount) return;

  // Clonagem para o efeito infinito: um conjunto identico antes e outro
  // depois dos cards originais. Assim sempre existem cards nos dois lados
  // do card ativo e o loop nunca deixa espacos vazios.
  if (originalCount > 1) {
    const pre = document.createDocumentFragment();
    const post = document.createDocumentFragment();
    cards.forEach((c) => pre.appendChild(c.cloneNode(true)));
    cards.forEach((c) => post.appendChild(c.cloneNode(true)));
    track.insertBefore(pre, track.firstChild);
    track.appendChild(post);
    cards = Array.from(track.children);
  }

  // Inicia no primeiro card do conjunto do meio — garante vizinhos nos
  // dois lados (tres cards visiveis no desktop) desde o carregamento.
  let active = originalCount > 1 ? originalCount : 0;
  let currentTranslate = 0;
  let autoplayId = null;
  const AUTOPLAY_MS = 4000;

  /**
   * Centraliza o card ativo no viewport e o destaca.
   * O scale e aplicado a partir do centro, entao o centro do card nao se
   * desloca — a medicao via getBoundingClientRect permanece estavel.
   * @param {boolean} animate - se false, reposiciona sem transicao (init/resize/loop)
   */
  function center(animate) {
    if (!animate) track.style.transition = 'none';

    cards.forEach((c, i) => c.classList.toggle('is-active', i === active));

    const vpRect = viewport.getBoundingClientRect();
    const cardRect = cards[active].getBoundingClientRect();
    const delta =
      vpRect.left + vpRect.width / 2 - (cardRect.left + cardRect.width / 2);

    currentTranslate += delta;
    track.style.transform = `translateX(${currentTranslate}px)`;

    if (!animate) {
      void track.offsetWidth; // forca reflow
      track.style.transition = '';
    }
  }

  /**
   * Apos a transicao, se o ativo entrou num dos conjuntos clonados,
   * salta silenciosamente para o card equivalente do conjunto do meio.
   * Como os cards sao identicos e o card fica centralizado, o salto e
   * visualmente imperceptivel.
   */
  function normalize() {
    if (originalCount <= 1) return;
    if (active < originalCount) {
      active += originalCount;
      center(false);
    } else if (active >= 2 * originalCount) {
      active -= originalCount;
      center(false);
    }
  }

  function go(dir) {
    active += dir;
    center(true);
  }

  track.addEventListener('transitionend', (e) => {
    if (e.propertyName === 'transform') normalize();
  });

  function startAutoplay() {
    stopAutoplay();
    autoplayId = setInterval(() => go(1), AUTOPLAY_MS);
  }

  function stopAutoplay() {
    if (autoplayId) {
      clearInterval(autoplayId);
      autoplayId = null;
    }
  }

  prevBtn.addEventListener('click', () => {
    go(-1);
    startAutoplay();
  });

  nextBtn.addEventListener('click', () => {
    go(1);
    startAutoplay();
  });

  // Clicar num card lateral traz ele para o centro
  cards.forEach((card, i) => {
    card.addEventListener('click', () => {
      if (i !== active) {
        active = i;
        center(true);
        startAutoplay();
      }
    });
  });

  // Pausa o autoplay enquanto o mouse esta sobre o carrossel
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Recalcula o posicionamento quando a viewport muda de tamanho
  let resizeTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => center(false), 150);
  });

  function init() {
    center(false);
    startAutoplay();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
  // Reajusta apos o carregamento completo (fontes/imagens)
  window.addEventListener('load', () => center(false));
})();
