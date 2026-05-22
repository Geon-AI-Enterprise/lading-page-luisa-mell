// ========================================
// Institutional Video - Quem Somos
// Auto-play quando o video entra no viewport, pause quando sai.
// Clique no video alterna mute (audio liga/desliga).
// ========================================

(function initInstitutionalVideo() {
    const video = document.getElementById('institutional-video');
    if (!video) return;

    // Inicia mudo: browsers bloqueiam autoplay com audio. Usuario clica
    // para liberar o som (e o video continua tocando).
    video.muted = true;
    video.setAttribute('playsinline', '');

    // Clique alterna mute em vez de pausar — o controle de play/pause fica
    // 100% por conta do IntersectionObserver, evitando estado inconsistente.
    video.addEventListener('click', () => {
        video.muted = !video.muted;
    });

    // Play/pause baseado em visibilidade.
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    video.play().catch(() => {
                        // Autoplay bloqueado em alguns browsers mesmo mutado
                        // (ex.: economia de dados). Silenciamos o erro — o
                        // usuario pode clicar para iniciar.
                    });
                } else {
                    video.pause();
                }
            }
        },
        { threshold: 0.5 }
    );

    observer.observe(video);
})();
