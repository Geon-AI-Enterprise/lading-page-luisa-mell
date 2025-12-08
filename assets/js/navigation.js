// ========================================
// Mobile Menu Toggle
// ========================================

export function toggleMobileMenu() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.mobile-menu-toggle');

    nav.classList.toggle('active');
    toggle.classList.toggle('active');
}

// Close mobile menu when clicking on a nav link
export function closeMobileMenuOnLinkClick() {
    const nav = document.querySelector('.nav');
    const toggle = document.querySelector('.mobile-menu-toggle');

    if (nav && nav.classList.contains('active')) {
        nav.classList.remove('active');
        toggle.classList.remove('active');
    }
}

export function setupMobileMenu() {
    // Mobile menu toggle button
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    if (mobileToggle) {
        mobileToggle.addEventListener('click', toggleMobileMenu);
    }

    // Close mobile menu when clicking outside
    document.addEventListener('click', (e) => {
        const nav = document.querySelector('.nav');
        const toggle = document.querySelector('.mobile-menu-toggle');

        if (nav && nav.classList.contains('active') &&
            !nav.contains(e.target) &&
            !toggle.contains(e.target)) {
            closeMobileMenuOnLinkClick();
        }
    });
}
