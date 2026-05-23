// ========================================
// Institutional Video - Quem Somos
// Auto-play quando o video entra no viewport, pause quando sai.
// Tenta tocar COM audio primeiro; se o browser bloquear (autoplay policy),
// faz fallback para mudo. Apos qualquer interacao do usuario na pagina,
// o video toca com audio na proxima entrada no viewport.
// Clique no video alterna mudo/desmutado.
// ========================================

(function initInstitutionalVideo() {
    const video = document.getElementById('institutional-video');
    if (!video) return;

    video.setAttribute('playsinline', '');

    // Flag: usuario interagiu com a pagina (qualquer clique/teclado/touch).
    // Apos isso, browsers permitem play() com audio.
    let userInteracted = false;

    // Tenta tocar respeitando o estado atual de muted. Em primeira tentativa
    // sem interacao, geralmente browser exige muted — fazemos fallback.
    async function tryPlay() {
        try {
            await video.play();
        } catch {
            // Bloqueado: forca mudo e tenta de novo.
            video.muted = true;
            try { await video.play(); } catch {
                // Persistiu bloqueado (ex.: economia de dados). Usuario precisa
                // clicar manualmente — o handler de click cuida disso.
            }
        }
    }

    // Marca interacao globalmente para desbloquear audio nas proximas execucoes.
    const markInteraction = () => {
        userInteracted = true;
        // Se o video esta tocando mudo e a interacao acabou de acontecer,
        // libera o audio automaticamente.
        if (!video.paused && video.muted) {
            video.muted = false;
        }
    };
    ['click', 'keydown', 'touchstart'].forEach((evt) => {
        document.addEventListener(evt, markInteraction, { once: true, passive: true });
    });

    // Clique no video alterna mute (controle manual do usuario).
    video.addEventListener('click', (e) => {
        e.stopPropagation();
        video.muted = !video.muted;
        userInteracted = true;
    });

    // Play/pause baseado em visibilidade.
    const observer = new IntersectionObserver(
        (entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) {
                    // Se o usuario ja interagiu, tenta com audio.
                    if (userInteracted) video.muted = false;
                    tryPlay();
                } else {
                    video.pause();
                }
            }
        },
        { threshold: 0.5 }
    );

    observer.observe(video);
})();
