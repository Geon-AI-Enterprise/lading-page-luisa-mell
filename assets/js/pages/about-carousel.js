/**
 * Carrossel da seção institucional (Quem Somos)
 * Alterna automaticamente entre as imagens e permite navegação por dots
 * Suporte a touch/swipe para dispositivos móveis
 */

document.addEventListener('DOMContentLoaded', () => {
  const carousel = document.querySelector('.about__carousel');
  if (!carousel) return;

  const images = carousel.querySelectorAll('.about__carousel-img');
  const dots = carousel.querySelectorAll('.about__carousel-dot');
  
  if (images.length === 0) return;

  let currentIndex = 0;
  let autoPlayInterval;
  const AUTO_PLAY_DELAY = 4000; // 4 segundos

  // Variáveis para touch/swipe
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;

  // Função para mostrar uma imagem específica
  function showImage(index) {
    // Remove active de todas as imagens e dots
    images.forEach(img => img.classList.remove('active'));
    dots.forEach(dot => dot.classList.remove('active'));

    // Adiciona active na imagem e dot atual
    images[index].classList.add('active');
    dots[index].classList.add('active');

    currentIndex = index;
  }

  // Função para ir para a próxima imagem
  function nextImage() {
    const nextIndex = (currentIndex + 1) % images.length;
    showImage(nextIndex);
  }

  // Função para ir para a imagem anterior
  function prevImage() {
    const prevIndex = (currentIndex - 1 + images.length) % images.length;
    showImage(prevIndex);
  }

  // Iniciar autoplay
  function startAutoPlay() {
    autoPlayInterval = setInterval(nextImage, AUTO_PLAY_DELAY);
  }

  // Pausar autoplay
  function stopAutoPlay() {
    clearInterval(autoPlayInterval);
  }

  // Adicionar eventos de clique nos dots
  dots.forEach((dot, index) => {
    dot.addEventListener('click', () => {
      stopAutoPlay();
      showImage(index);
      startAutoPlay();
    });
  });

  // Touch/Swipe handlers
  function handleTouchStart(e) {
    touchStartX = e.touches[0].clientX;
    isSwiping = true;
    stopAutoPlay();
  }

  function handleTouchMove(e) {
    if (!isSwiping) return;
    touchEndX = e.touches[0].clientX;
  }

  function handleTouchEnd() {
    if (!isSwiping) return;
    isSwiping = false;
    
    const swipeDistance = touchStartX - touchEndX;
    const minSwipeDistance = 50; // Distância mínima para considerar swipe
    
    if (Math.abs(swipeDistance) > minSwipeDistance) {
      if (swipeDistance > 0) {
        // Swipe para esquerda - próxima imagem
        nextImage();
      } else {
        // Swipe para direita - imagem anterior
        prevImage();
      }
    }
    
    startAutoPlay();
  }

  // Adicionar eventos de touch
  carousel.addEventListener('touchstart', handleTouchStart, { passive: true });
  carousel.addEventListener('touchmove', handleTouchMove, { passive: true });
  carousel.addEventListener('touchend', handleTouchEnd);

  // Pausar autoplay ao passar o mouse
  carousel.addEventListener('mouseenter', stopAutoPlay);
  carousel.addEventListener('mouseleave', startAutoPlay);

  // Iniciar o carrossel
  startAutoPlay();
});
