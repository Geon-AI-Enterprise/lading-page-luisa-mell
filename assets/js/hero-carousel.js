// ========================================
// Hero Carousel - Instituto Luisa Mell
// Carrossel de banners com autoplay
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const carousel = document.getElementById('hero-carousel');
    const dotsContainer = document.getElementById('hero-dots');
    
    if (!carousel || !dotsContainer) return;

    const slides = carousel.querySelectorAll('.hero__carousel-slide');
    const dots = dotsContainer.querySelectorAll('.hero-dot');
    const prevBtn = carousel.querySelector('.hero__carousel-arrow--prev');
    const nextBtn = carousel.querySelector('.hero__carousel-arrow--next');

    if (slides.length === 0) return;

    let currentIndex = 0;
    let autoplayInterval = null;
    const autoplayDelay = 5000; // 5 segundos

    // Função para ir para um slide específico
    function goToSlide(index) {
        // Remove active de todos
        slides.forEach(slide => slide.classList.remove('hero__carousel-slide--active'));
        dots.forEach(dot => dot.classList.remove('hero-dot--active'));

        // Calcula o índice correto (loop infinito)
        currentIndex = (index + slides.length) % slides.length;

        // Adiciona active ao atual
        slides[currentIndex].classList.add('hero__carousel-slide--active');
        dots[currentIndex].classList.add('hero-dot--active');
    }

    // Próximo slide
    function nextSlide() {
        goToSlide(currentIndex + 1);
    }

    // Slide anterior
    function prevSlide() {
        goToSlide(currentIndex - 1);
    }

    // Inicia autoplay
    function startAutoplay() {
        stopAutoplay();
        autoplayInterval = setInterval(nextSlide, autoplayDelay);
    }

    // Para autoplay
    function stopAutoplay() {
        if (autoplayInterval) {
            clearInterval(autoplayInterval);
            autoplayInterval = null;
        }
    }

    // Event listeners para setas
    if (prevBtn) {
        prevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            prevSlide();
            startAutoplay(); // Reinicia o autoplay após interação
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            nextSlide();
            startAutoplay(); // Reinicia o autoplay após interação
        });
    }

    // Event listeners para dots
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
            startAutoplay(); // Reinicia o autoplay após interação
        });
    });

    // Pausa autoplay quando hover no carrossel
    carousel.addEventListener('mouseenter', stopAutoplay);
    carousel.addEventListener('mouseleave', startAutoplay);

    // Suporte a touch/swipe
    let touchStartX = 0;
    let touchEndX = 0;

    carousel.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        stopAutoplay();
    }, { passive: true });

    carousel.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
        startAutoplay();
    }, { passive: true });

    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                // Swipe para esquerda - próximo
                nextSlide();
            } else {
                // Swipe para direita - anterior
                prevSlide();
            }
        }
    }

    // Teclado (setas)
    document.addEventListener('keydown', (e) => {
        // Só funciona se o carrossel estiver visível na viewport
        const rect = carousel.getBoundingClientRect();
        const isVisible = rect.top < window.innerHeight && rect.bottom > 0;

        if (!isVisible) return;

        if (e.key === 'ArrowLeft') {
            prevSlide();
            startAutoplay();
        } else if (e.key === 'ArrowRight') {
            nextSlide();
            startAutoplay();
        }
    });

    // Inicia o autoplay
    startAutoplay();

    console.log('🎠 Hero Carousel initialized with', slides.length, 'slides');
});
