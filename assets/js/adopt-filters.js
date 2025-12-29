// ========================================
// Adopt Page - Filter Functionality
// ========================================

export function setupAdoptFilters() {
    const filterButtons = document.querySelectorAll('.adopt-filter-btn');
    const adoptCards = document.querySelectorAll('.adopt-card');
<<<<<<< HEAD
    const sizeBtn = document.getElementById('size-btn');
    const sizeMenu = document.getElementById('size-menu');
    const sizeOptions = document.querySelectorAll('.adopt-filter-size-option');

    if (!filterButtons.length || !adoptCards.length) return;

    // Main filter buttons functionality
=======

    if (!filterButtons.length || !adoptCards.length) return;

>>>>>>> 469f0519f2c506b35e198e301ddb29f1cc9e8cb1
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
<<<<<<< HEAD

    // Size selector functionality
    if (sizeBtn && sizeMenu) {
        sizeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const isHidden = sizeMenu.hidden;
            sizeMenu.hidden = !isHidden;
            sizeBtn.classList.toggle('active');
        });

        sizeOptions.forEach(option => {
            option.addEventListener('click', (e) => {
                e.stopPropagation();
                const sizeFilter = option.getAttribute('data-filter');

                // Update active option
                sizeOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');

                // Update button text (apenas o span, não remove os ícones)
                const sizeValue = option.textContent;
                const spanElement = sizeBtn.querySelector('span');
                if (spanElement) {
                    spanElement.textContent = `Tamanho: ${sizeValue}`;
                }

                // Close menu
                sizeMenu.hidden = true;
                sizeBtn.classList.remove('active');

                // Filter cards by size (if data attribute exists)
                adoptCards.forEach(card => {
                    const cardSize = card.getAttribute('data-filter-size');
                    if (!cardSize || cardSize === sizeFilter.replace('size-', '')) {
                        card.style.display = '';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });

        // Close menu when clicking outside
        document.addEventListener('click', () => {
            sizeMenu.hidden = true;
            sizeBtn.classList.remove('active');
        });
    }
=======
>>>>>>> 469f0519f2c506b35e198e301ddb29f1cc9e8cb1
}
