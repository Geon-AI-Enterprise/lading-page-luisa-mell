// Events frontend module - Calendário customizado
// Responsável por buscar eventos via Edge Function `get-events` e renderizar
// um calendário simples e uma lista de eventos

const getConfig = () => window.APP_CONFIG || {};
const EDGE_FUNCTION_EVENTS_URL = () => `${getConfig().EDGE_FUNCTION_BASE || ''}/get-events`;
const SUPABASE_ANON_KEY = () => getConfig().SUPABASE_ANON_KEY || '';

// ========================================
// API Functions
// ========================================

async function fetchEventsGet(filters = {}) {
  try {
    const anonKey = SUPABASE_ANON_KEY();
    const url = EDGE_FUNCTION_EVENTS_URL();
    
    // Debug: verificar se a chave está disponível
    console.log('🔑 API Key disponível:', anonKey ? 'Sim' : 'Não', '| URL:', url);
    
    const headers = {
      'Content-Type': 'application/json',
    };

    // Adiciona apikey se disponível (necessário para Edge Functions do Supabase)
    if (anonKey) {
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }

    // Usa POST como o supabase-client.js (mais confiável para Edge Functions)
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
    throw err;
  }
}

// ========================================
// Calendar Utilities
// ========================================

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function getDaysInMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year, month) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1, date2) {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
}

function getEventTypeIcon(type) {
  const icons = {
    adoption_fair: '🐾',
    vaccination: '💉',
    fundraising: '💰',
    volunteer: '🤝',
    education: '📚',
    general: '📅'
  };
  return icons[type] || '📅';
}

// ========================================
// Calendar Component
// ========================================

class EventCalendar {
  constructor(container, events = []) {
    this.container = container;
    this.events = events;
    this.currentDate = new Date();
    this.selectedDate = null;
    this.onDateSelect = null;
    
    this.render();
  }

  setEvents(events) {
    this.events = events;
    this.renderCalendarGrid();
  }

  getEventsForDate(date) {
    return this.events.filter(event => {
      const eventDate = new Date(event.start_at);
      return isSameDay(eventDate, date);
    });
  }

  navigateMonth(delta) {
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + delta,
      1
    );
    this.render();
  }

  render() {
    this.container.innerHTML = '';
    this.container.classList.add('custom-calendar');

    // Header com navegação
    const header = document.createElement('div');
    header.className = 'calendar-header';
    header.innerHTML = `
      <button class="calendar-nav-btn calendar-prev" aria-label="Mês anterior">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="15 18 9 12 15 6"></polyline>
        </svg>
      </button>
      <span class="calendar-title">
        ${MONTH_NAMES[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}
      </span>
      <button class="calendar-nav-btn calendar-next" aria-label="Próximo mês">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="9 18 15 12 9 6"></polyline>
        </svg>
      </button>
    `;

    header.querySelector('.calendar-prev').addEventListener('click', () => this.navigateMonth(-1));
    header.querySelector('.calendar-next').addEventListener('click', () => this.navigateMonth(1));

    this.container.appendChild(header);

    // Dias da semana
    const weekdays = document.createElement('div');
    weekdays.className = 'calendar-weekdays';
    WEEKDAY_NAMES.forEach(day => {
      const dayEl = document.createElement('span');
      dayEl.className = 'calendar-weekday';
      dayEl.textContent = day;
      weekdays.appendChild(dayEl);
    });
    this.container.appendChild(weekdays);

    // Grid de dias
    const grid = document.createElement('div');
    grid.className = 'calendar-grid';
    grid.id = 'calendar-days-grid';
    this.container.appendChild(grid);

    this.renderCalendarGrid();
  }

  renderCalendarGrid() {
    const grid = this.container.querySelector('#calendar-days-grid');
    if (!grid) return;

    grid.innerHTML = '';

    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const today = new Date();

    // Dias vazios antes do primeiro dia do mês
    for (let i = 0; i < firstDay; i++) {
      const emptyDay = document.createElement('div');
      emptyDay.className = 'calendar-day calendar-day--empty';
      grid.appendChild(emptyDay);
    }

    // Dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayEvents = this.getEventsForDate(date);
      const isToday = isSameDay(date, today);
      const isSelected = this.selectedDate && isSameDay(date, this.selectedDate);
      const hasEvents = dayEvents.length > 0;

      const dayEl = document.createElement('button');
      dayEl.className = 'calendar-day';
      if (isToday) dayEl.classList.add('calendar-day--today');
      if (isSelected) dayEl.classList.add('calendar-day--selected');
      if (hasEvents) dayEl.classList.add('calendar-day--has-event');

      dayEl.innerHTML = `
        <span class="calendar-day__number">${day}</span>
        ${hasEvents ? `<span class="calendar-day__dot" title="${dayEvents.length} evento(s)"></span>` : ''}
      `;

      dayEl.addEventListener('click', () => {
        this.selectedDate = date;
        this.renderCalendarGrid();
        if (this.onDateSelect) {
          this.onDateSelect(date, dayEvents);
        }
      });

      if (hasEvents) {
        dayEl.title = dayEvents.map(e => e.title).join(', ');
      }

      grid.appendChild(dayEl);
    }
  }
}

// ========================================
// Event List Component
// ========================================

function renderEventList(container, events = []) {
  if (!container) return;
  container.innerHTML = '';

  if (!events || events.length === 0) {
    container.innerHTML = `
      <div class="events-empty">
        <div class="events-empty__icon">📅</div>
        <p class="events-empty__text">Nenhum evento encontrado.</p>
      </div>
    `;
    return;
  }

  const list = document.createElement('div');
  list.className = 'events-list-items';

  // Mostrar apenas os próximos 4 eventos
  const upcomingEvents = events
    .filter(ev => new Date(ev.start_at) >= new Date())
    .slice(0, 4);

  if (upcomingEvents.length === 0) {
    container.innerHTML = `
      <div class="events-empty">
        <div class="events-empty__icon">📅</div>
        <p class="events-empty__text">Não há eventos próximos.</p>
      </div>
    `;
    return;
  }

  upcomingEvents.forEach(ev => {
    const item = document.createElement('article');
    item.className = 'event-card';

    const eventDate = new Date(ev.start_at);
    const eventTypeIcon = getEventTypeIcon(ev.event_type);

    item.innerHTML = `
      <div class="event-card__date">
        <span class="event-card__day">${eventDate.getDate()}</span>
        <span class="event-card__month">${MONTH_NAMES[eventDate.getMonth()].slice(0, 3)}</span>
      </div>
      <div class="event-card__content">
        <div class="event-card__header">
          <span class="event-card__type">${eventTypeIcon}</span>
          <h4 class="event-card__title">${ev.title}</h4>
        </div>
        ${ev.venue ? `<p class="event-card__venue"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg> ${ev.venue}</p>` : ''}
        ${ev.description ? `<p class="event-card__desc">${ev.description.slice(0, 80)}${ev.description.length > 80 ? '...' : ''}</p>` : ''}
        ${ev.signup_url ? `<a href="${ev.signup_url}" class="event-card__link" target="_blank" rel="noopener">Saiba mais →</a>` : ''}
      </div>
    `;

    list.appendChild(item);
  });

  container.appendChild(list);
}

// ========================================
// Selected Day Events Panel
// ========================================

function showDayEventsPanel(container, date, events) {
  const existing = container.querySelector('.day-events-panel');
  if (existing) existing.remove();

  if (!events || events.length === 0) return;

  const panel = document.createElement('div');
  panel.className = 'day-events-panel';

  const formattedDate = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });

  panel.innerHTML = `
    <div class="day-events-panel__header">
      <h4>${formattedDate}</h4>
      <button class="day-events-panel__close" aria-label="Fechar">×</button>
    </div>
    <div class="day-events-panel__list">
      ${events.map(ev => `
        <div class="day-event-item">
          <span class="day-event-item__icon">${getEventTypeIcon(ev.event_type)}</span>
          <div class="day-event-item__content">
            <strong>${ev.title}</strong>
            ${ev.venue ? `<span>${ev.venue}</span>` : ''}
            ${ev.signup_url ? `<a href="${ev.signup_url}" target="_blank" rel="noopener">Ver detalhes</a>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  `;

  panel.querySelector('.day-events-panel__close').addEventListener('click', () => {
    panel.remove();
  });

  container.appendChild(panel);
}

// ========================================
// Main Initialization
// ========================================

export async function initEventsCalendar(opts = {}) {
  const calendarContainer = document.getElementById('events-calendar');
  const listContainer = document.getElementById('events-list');

  if (!calendarContainer && !listContainer) {
    console.log('📅 Containers de eventos não encontrados na página.');
    return { success: false, error: 'Containers não encontrados' };
  }

  // Loading state
  if (calendarContainer) {
    calendarContainer.innerHTML = `
      <div class="events-loading">
        <div class="events-loading__spinner"></div>
        <p>Carregando calendário...</p>
      </div>
    `;
  }
  if (listContainer) {
    listContainer.innerHTML = `
      <div class="events-loading">
        <div class="events-loading__spinner"></div>
        <p>Carregando eventos...</p>
      </div>
    `;
  }

  try {
    const res = await fetchEventsGet({ upcoming: false, limit: opts.limit || 100 });
    const events = res.data || [];

    console.log(`📅 ${events.length} eventos carregados`);

    // Renderizar calendário
    if (calendarContainer) {
      calendarContainer.innerHTML = '';
      const calendar = new EventCalendar(calendarContainer, events);
      
      calendar.onDateSelect = (date, dayEvents) => {
        showDayEventsPanel(calendarContainer, date, dayEvents);
      };
    }

    // Renderizar lista de próximos eventos
    if (listContainer) {
      renderEventList(listContainer, events);
    }

    return { success: true, count: events.length };

  } catch (err) {
    console.error('❌ Erro ao carregar eventos:', err);
    
    if (calendarContainer) {
      calendarContainer.innerHTML = `
        <div class="events-error">
          <p>Não foi possível carregar o calendário.</p>
          <button onclick="location.reload()">Tentar novamente</button>
        </div>
      `;
    }
    if (listContainer) {
      listContainer.innerHTML = `
        <div class="events-error">
          <p>Erro ao carregar eventos.</p>
        </div>
      `;
    }

    return { success: false, error: err?.message };
  }
}

// Expor para uso global
if (typeof window !== 'undefined') {
  window.initEventsCalendar = initEventsCalendar;
}

export { fetchEventsGet, renderEventList, EventCalendar };
