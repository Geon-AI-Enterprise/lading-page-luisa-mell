// ========================================
// Events Page - JavaScript
// Carrega e exibe eventos na página eventos.html
// ========================================

const getConfig = () => window.APP_CONFIG || {};
const EDGE_FUNCTION_EVENTS_URL = () => `${getConfig().EDGE_FUNCTION_BASE || ''}/get-events`;
const SUPABASE_ANON_KEY = () => getConfig().SUPABASE_ANON_KEY || '';

// ========================================
// API Functions
// ========================================

async function fetchEvents(filters = {}) {
  try {
    const anonKey = SUPABASE_ANON_KEY();
    const url = EDGE_FUNCTION_EVENTS_URL();
    
    const headers = {
      'Content-Type': 'application/json',
    };

    if (anonKey) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }

    const response = await fetch(url, { 
      method: 'POST',
      headers: headers,
      body: JSON.stringify(filters)
    });

    if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

    const result = await response.json();
    if (!result.success) throw new Error(result.error || 'Erro ao buscar eventos');
    return result;

  } catch (err) {
    console.error('❌ Erro ao buscar eventos:', err);
    return { success: false, data: [], error: err.message };
  }
}

// ========================================
// Utility Functions
// ========================================

const MONTH_NAMES = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

const EVENT_TYPE_LABELS = {
  adoption_fair: 'Feira de Adoção',
  vaccination: 'Vacinação',
  fundraising: 'Arrecadação',
  volunteer: 'Voluntariado',
  education: 'Educação',
  general: 'Geral'
};

const STATUS_LABELS = {
  scheduled: 'Agendado',
  cancelled: 'Cancelado',
  completed: 'Realizado',
  postponed: 'Adiado'
};

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return {
    day: date.getDate(),
    month: MONTH_NAMES[date.getMonth()],
    year: date.getFullYear(),
    time: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    full: date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    })
  };
}

function isEventPast(dateStr) {
  return new Date(dateStr) < new Date();
}

function isEventUpcoming(dateStr) {
  return new Date(dateStr) >= new Date();
}

// ========================================
// Event Card Renderers
// ========================================

function renderFeaturedEventCard(event) {
  const date = formatDate(event.start_at);
  const isPast = isEventPast(event.start_at);
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Evento';
  
  const imageHtml = event.image_url 
    ? `<img src="${event.image_url}" alt="${event.title}" class="event-card__image" loading="lazy">`
    : `<div class="event-card__placeholder">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        <span class="event-card__placeholder-text">${event.title}</span>
      </div>`;

  let statusBadge = '';
  if (event.status === 'cancelled') {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--cancelled">Cancelado</span>';
  } else if (event.status === 'postponed') {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--postponed">Adiado</span>';
  } else if (event.status === 'completed' || isPast) {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--completed">Realizado</span>';
  }

  const signupBtn = event.signup_url && !isPast && event.status === 'scheduled'
    ? `<a href="${event.signup_url}" target="_blank" rel="noopener noreferrer" class="event-card__btn event-card__btn--primary">Participar</a>`
    : '';

  return `
    <article class="event-card-featured ${isPast ? 'event-card--past' : ''}">
      <div class="event-card__image-container">
        ${imageHtml}
        <span class="event-card__badge event-card__badge--${event.event_type}">${typeLabel}</span>
        <div class="event-card__date-badge">
          <span class="event-card__date-day">${date.day}</span>
          <span class="event-card__date-month">${date.month}</span>
        </div>
        ${statusBadge}
      </div>
      <div class="event-card__content">
        <h3 class="event-card__title">${event.title}</h3>
        <p class="event-card__description">${event.description || ''}</p>
        <div class="event-card__meta">
          ${event.venue ? `
            <span class="event-card__meta-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${event.venue}
            </span>
          ` : ''}
          <span class="event-card__meta-item">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${date.time}
          </span>
        </div>
        <div class="event-card__actions">
          ${signupBtn}
          <button class="event-card__btn event-card__btn--secondary" onclick="shareEvent('${event.title}', '${event.id}')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;">
              <circle cx="18" cy="5" r="3"></circle>
              <circle cx="6" cy="12" r="3"></circle>
              <circle cx="18" cy="19" r="3"></circle>
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
            </svg>
            Compartilhar
          </button>
        </div>
      </div>
    </article>
  `;
}

function renderGridEventCard(event) {
  const date = formatDate(event.start_at);
  const isPast = isEventPast(event.start_at);
  const typeLabel = EVENT_TYPE_LABELS[event.event_type] || 'Evento';
  
  const imageHtml = event.image_url 
    ? `<img src="${event.image_url}" alt="${event.title}" class="event-card__image" loading="lazy">`
    : `<div class="event-card__placeholder">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </div>`;

  let statusBadge = '';
  if (event.status === 'cancelled') {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--cancelled">Cancelado</span>';
  } else if (event.status === 'postponed') {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--postponed">Adiado</span>';
  } else if (event.status === 'completed' || isPast) {
    statusBadge = '<span class="event-card__status-badge event-card__status-badge--completed">Realizado</span>';
  }

  return `
    <article class="event-card-grid ${isPast ? 'event-card--past' : ''}" data-event-id="${event.id}">
      <div class="event-card__image-container">
        ${imageHtml}
        <span class="event-card__badge event-card__badge--${event.event_type}">${typeLabel}</span>
        <div class="event-card__date-badge">
          <span class="event-card__date-day">${date.day}</span>
          <span class="event-card__date-month">${date.month}</span>
        </div>
        ${statusBadge}
      </div>
      <div class="event-card__content">
        <h3 class="event-card__title">${event.title}</h3>
        <p class="event-card__description">${event.description || ''}</p>
        <div class="event-card__meta">
          ${event.venue ? `
            <span class="event-card__meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              ${event.venue}
            </span>
          ` : ''}
          <span class="event-card__meta-item">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
              <polyline points="12 6 12 12 16 14"></polyline>
            </svg>
            ${date.time}
          </span>
        </div>
      </div>
    </article>
  `;
}

// ========================================
// Carousel Logic
// ========================================

class EventsCarousel {
  constructor() {
    this.track = document.getElementById('carousel-track');
    this.dotsContainer = document.getElementById('carousel-dots');
    this.prevBtn = document.getElementById('carousel-prev');
    this.nextBtn = document.getElementById('carousel-next');
    this.currentIndex = 0;
    this.events = [];
    this.autoplayInterval = null;
  }

  init(events) {
    this.events = events;
    this.render();
    this.setupEventListeners();
    this.startAutoplay();
  }

  render() {
    if (!this.track || this.events.length === 0) return;

    // Render cards
    this.track.innerHTML = this.events.map(event => renderFeaturedEventCard(event)).join('');

    // Render dots
    if (this.dotsContainer) {
      this.dotsContainer.innerHTML = this.events.map((_, i) => 
        `<button class="carousel-dot ${i === 0 ? 'active' : ''}" data-index="${i}" aria-label="Ir para evento ${i + 1}"></button>`
      ).join('');
    }

    this.updateButtons();
  }

  setupEventListeners() {
    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', () => this.prev());
    }
    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', () => this.next());
    }
    if (this.dotsContainer) {
      this.dotsContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('carousel-dot')) {
          this.goTo(parseInt(e.target.dataset.index));
        }
      });
    }

    // Touch support
    let touchStartX = 0;
    let touchEndX = 0;
    
    this.track?.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      this.stopAutoplay();
    }, { passive: true });

    this.track?.addEventListener('touchend', (e) => {
      touchEndX = e.changedTouches[0].screenX;
      this.handleSwipe(touchStartX, touchEndX);
      this.startAutoplay();
    }, { passive: true });
  }

  handleSwipe(startX, endX) {
    const diff = startX - endX;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        this.next();
      } else {
        this.prev();
      }
    }
  }

  goTo(index) {
    if (index < 0 || index >= this.events.length) return;
    
    this.currentIndex = index;
    this.track.style.transform = `translateX(-${index * 100}%)`;
    
    // Update dots
    this.dotsContainer?.querySelectorAll('.carousel-dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });
    
    this.updateButtons();
  }

  prev() {
    const newIndex = this.currentIndex === 0 ? this.events.length - 1 : this.currentIndex - 1;
    this.goTo(newIndex);
  }

  next() {
    const newIndex = this.currentIndex === this.events.length - 1 ? 0 : this.currentIndex + 1;
    this.goTo(newIndex);
  }

  updateButtons() {
    // Não desabilitar, apenas dar feedback visual se necessário
  }

  startAutoplay() {
    this.stopAutoplay();
    this.autoplayInterval = setInterval(() => this.next(), 5000);
  }

  stopAutoplay() {
    if (this.autoplayInterval) {
      clearInterval(this.autoplayInterval);
      this.autoplayInterval = null;
    }
  }
}

// ========================================
// Grid & Filter Logic
// ========================================

let allEvents = [];
let currentFilter = 'all';

function renderEventsGrid(events) {
  const grid = document.getElementById('events-grid');
  const empty = document.getElementById('events-empty');
  
  if (!grid) return;

  if (events.length === 0) {
    grid.innerHTML = '';
    if (empty) {
      empty.removeAttribute('hidden');
      empty.style.display = 'flex';
    }
    return;
  }

  // Esconder empty state quando há eventos
  if (empty) {
    empty.setAttribute('hidden', '');
    empty.style.display = 'none';
  }
  grid.innerHTML = events.map(event => renderGridEventCard(event)).join('');
}

function filterEvents(filter) {
  currentFilter = filter;
  
  // Update active tab
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.classList.toggle('active', tab.dataset.filter === filter);
    tab.setAttribute('aria-selected', tab.dataset.filter === filter);
  });

  // Filter events
  let filtered = [...allEvents];
  
  if (filter === 'upcoming') {
    filtered = allEvents.filter(e => isEventUpcoming(e.start_at) && e.status === 'scheduled');
  } else if (filter === 'past') {
    filtered = allEvents.filter(e => isEventPast(e.start_at) || e.status === 'completed');
  }

  renderEventsGrid(filtered);
}

function setupFilterListeners() {
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      filterEvents(tab.dataset.filter);
    });
  });
}

// ========================================
// Share Function
// ========================================

window.shareEvent = function(title, eventId) {
  const url = `${window.location.origin}${window.location.pathname}#event-${eventId}`;
  
  if (navigator.share) {
    navigator.share({
      title: title,
      text: `Confira este evento do Instituto Luisa Mell: ${title}`,
      url: url
    }).catch(console.error);
  } else {
    // Fallback: copy to clipboard
    navigator.clipboard.writeText(url).then(() => {
      alert('Link copiado para a área de transferência!');
    }).catch(() => {
      prompt('Copie o link:', url);
    });
  }
};

// ========================================
// Initialization
// ========================================

async function initEventsPage() {
  const loadingEl = document.getElementById('events-loading');
  const carouselContainer = document.getElementById('events-carousel');
  const emptyEl = document.getElementById('events-empty');
  
  // Função auxiliar para esconder loading
  function hideLoading() {
    if (loadingEl) {
      loadingEl.setAttribute('hidden', '');
      loadingEl.style.display = 'none';
    }
  }
  
  try {
    // Fetch all events
    const result = await fetchEvents({ limit: 100 });
    
    // Sempre esconder loading após fetch
    hideLoading();
    
    if (!result.success || !result.data || result.data.length === 0) {
      console.log('📅 Nenhum evento encontrado');
      if (emptyEl) {
        emptyEl.removeAttribute('hidden');
        emptyEl.style.display = 'flex';
      }
      if (carouselContainer) carouselContainer.style.display = 'none';
      return;
    }

    allEvents = result.data;
    console.log(`📅 ${allEvents.length} eventos carregados`);

    // Get upcoming events for carousel (max 5)
    const upcomingEvents = allEvents
      .filter(e => isEventUpcoming(e.start_at) && e.status === 'scheduled')
      .slice(0, 5);

    // Initialize carousel
    if (upcomingEvents.length > 0) {
      const carousel = new EventsCarousel();
      carousel.init(upcomingEvents);
    } else {
      if (carouselContainer) carouselContainer.style.display = 'none';
    }

    // Initialize grid
    renderEventsGrid(allEvents);
    setupFilterListeners();

  } catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    // Esconder loading e mostrar empty state em caso de erro
    if (loadingEl) {
      loadingEl.setAttribute('hidden', '');
      loadingEl.style.display = 'none';
    }
    if (emptyEl) {
      emptyEl.removeAttribute('hidden');
      emptyEl.style.display = 'flex';
    }
  }
}

// Auto-init on DOMContentLoaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initEventsPage);
} else {
  initEventsPage();
}

export { initEventsPage };
