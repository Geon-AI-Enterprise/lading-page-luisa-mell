// ========================================
// Adopt Page - Filter Functionality
// ========================================

export function setupAdoptFilters() {
    const filterButtons = document.querySelectorAll('.adopt-filter-btn');
    const adoptCards = document.querySelectorAll('.adopt-card');

    if (!filterButtons.length || !adoptCards.length) return;

    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            const filterType = button.getAttribute('data-filter');

            // Update active button
            filterButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            // Filter cards
            adoptCards.forEach(card => {
                if (filterType === 'all') {
                    card.style.display = '';
                } else {
                    const cardType = card.getAttribute('data-filter-type');
                    card.style.display = cardType === filterType ? '' : 'none';
                }
            });
        });
    });
}
