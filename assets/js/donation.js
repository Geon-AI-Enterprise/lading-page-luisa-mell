// ========================================
// Donation Modal - Paybox SDK Integration
// ========================================

var PAYBOX_ID = 'f4255df6-5099-4632-85fb-3e14762b5e5b';
var DONATION_FALLBACK_URL =
  'https://institutoluisamell.colabore.org/doe/single_step';

function abrirDoacaoFallback() {
  window.open(DONATION_FALLBACK_URL, '_blank', 'noopener,noreferrer');
}

/**
 * Abre o modal de doação via Paybox SDK
 */
function transformandoVidasComLuisaMell() {
  try {
    if (typeof Paybox !== 'undefined' && typeof Paybox.show === 'function') {
      var opts = {
        payboxId: PAYBOX_ID
      };

      // Mantém o mesmo padrão solicitado: Paybox.url(opts) + Paybox.show(opts)
      if (typeof Paybox.url === 'function') {
        Paybox.url(opts);
      }

      Paybox.show(opts);
      return;
    }

    abrirDoacaoFallback();
  } catch (e) {
    console.error('Erro ao abrir modal de doação:', e);
    abrirDoacaoFallback();
  }
}

/**
 * Intercepta todos os links/botões de doação e redireciona para o modal Paybox
 */
document.addEventListener('DOMContentLoaded', function () {
  var donationLinks = document.querySelectorAll(
    'a[href*="institutoluisamell.colabore.org"], a[href^="javascript:transformandoVidasComLuisaMell"]'
  );

  donationLinks.forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      transformandoVidasComLuisaMell();
      return false;
    });

    // Mantém acessibilidade visual e evita duplicidade de navegação
    link.style.cursor = 'pointer';
    link.setAttribute('href', 'javascript:transformandoVidasComLuisaMell()');
    link.removeAttribute('target');
    link.removeAttribute('rel');
  });
});
