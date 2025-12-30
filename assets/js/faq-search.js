// ========================================
// FAQ Search - Instituto Luisa Mell
// Real-time search functionality for FAQ page
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('faq-search-input');
    const searchClear = document.getElementById('faq-search-clear');
    const searchResults = document.getElementById('faq-search-results');
    const noResultsMessage = document.getElementById('faq-no-results');
    const clearSearchBtn = document.getElementById('faq-clear-search');
    const faqCategories = document.querySelectorAll('.faq-category');
    const faqItems = document.querySelectorAll('.faq-item');

    if (!searchInput) return;

    // Build search index from FAQ items
    const searchIndex = [];
    faqItems.forEach((item, index) => {
        const question = item.querySelector('.faq-item__question');
        const answer = item.querySelector('.faq-item__answer');
        const category = item.closest('.faq-category');
        const categoryTitle = category?.querySelector('.faq-category__title span:last-child');
        
        searchIndex.push({
            id: index,
            element: item,
            category: categoryTitle?.textContent || '',
            categoryElement: category,
            question: question?.textContent?.trim() || '',
            answer: answer?.textContent?.trim() || '',
            questionElement: question,
            answerElement: answer
        });
    });

    // Normalize string for search (remove accents, lowercase)
    function normalizeString(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '');
    }

    // Search function
    function search(query) {
        const normalizedQuery = normalizeString(query);
        const words = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
        
        if (words.length === 0) return [];

        const results = searchIndex
            .map(item => {
                const normalizedQuestion = normalizeString(item.question);
                const normalizedAnswer = normalizeString(item.answer);
                const normalizedCategory = normalizeString(item.category);
                
                let score = 0;
                let matches = [];

                words.forEach(word => {
                    // Question match (high priority)
                    if (normalizedQuestion.includes(word)) {
                        score += 10;
                        matches.push({ type: 'question', word });
                    }
                    // Category match (medium priority)
                    if (normalizedCategory.includes(word)) {
                        score += 5;
                        matches.push({ type: 'category', word });
                    }
                    // Answer match (lower priority)
                    if (normalizedAnswer.includes(word)) {
                        score += 3;
                        matches.push({ type: 'answer', word });
                    }
                });

                return { ...item, score, matches };
            })
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score);

        return results;
    }

    // Highlight text
    function highlightText(text, query) {
        const words = query.split(/\s+/).filter(w => w.length > 1);
        let result = text;
        
        words.forEach(word => {
            const regex = new RegExp(`(${word})`, 'gi');
            result = result.replace(regex, '<mark class="faq-search__result-highlight">$1</mark>');
        });
        
        return result;
    }

    // Get preview text around match
    function getPreviewText(text, query, maxLength = 150) {
        const normalizedQuery = normalizeString(query);
        const normalizedText = normalizeString(text);
        const words = normalizedQuery.split(/\s+/).filter(w => w.length > 1);
        
        if (words.length === 0) return text.substring(0, maxLength) + '...';

        // Find first match position
        let firstMatchPos = -1;
        for (const word of words) {
            const pos = normalizedText.indexOf(word);
            if (pos !== -1 && (firstMatchPos === -1 || pos < firstMatchPos)) {
                firstMatchPos = pos;
            }
        }

        if (firstMatchPos === -1) {
            return text.substring(0, maxLength) + '...';
        }

        // Get context around match
        const start = Math.max(0, firstMatchPos - 30);
        const end = Math.min(text.length, firstMatchPos + maxLength - 30);
        let preview = text.substring(start, end);
        
        if (start > 0) preview = '...' + preview;
        if (end < text.length) preview = preview + '...';
        
        return highlightText(preview, query);
    }

    // Render search results dropdown
    function renderSearchResults(results, query) {
        if (results.length === 0) {
            searchResults.hidden = true;
            return;
        }

        searchResults.innerHTML = results.slice(0, 6).map(result => `
            <div class="faq-search__result-item" data-faq-id="${result.id}">
                <div class="faq-search__result-category">${result.category}</div>
                <div class="faq-search__result-question">${highlightText(result.question, query)}</div>
                <div class="faq-search__result-preview">${getPreviewText(result.answer, query)}</div>
            </div>
        `).join('');

        searchResults.hidden = false;

        // Add click handlers
        searchResults.querySelectorAll('.faq-search__result-item').forEach(item => {
            item.addEventListener('click', () => {
                const faqId = parseInt(item.dataset.faqId);
                const faqItem = searchIndex[faqId];
                
                if (faqItem) {
                    // Clear search and show all
                    clearSearch();
                    
                    // Open the clicked item
                    faqItem.element.setAttribute('open', '');
                    faqItem.element.classList.add('highlight');
                    
                    // Scroll to it
                    setTimeout(() => {
                        faqItem.element.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                    }, 100);

                    // Remove highlight after a few seconds
                    setTimeout(() => {
                        faqItem.element.classList.remove('highlight');
                    }, 3000);
                }
            });
        });
    }

    // Filter FAQ items in page
    function filterFaqItems(results, query) {
        if (query.trim() === '') {
            // Show all
            faqCategories.forEach(cat => cat.classList.remove('hidden'));
            faqItems.forEach(item => {
                item.classList.remove('hidden', 'highlight');
                item.removeAttribute('open');
            });
            noResultsMessage.hidden = true;
            return;
        }

        const matchedIds = new Set(results.map(r => r.id));
        const matchedCategories = new Set();

        // Hide/show items
        searchIndex.forEach((item, index) => {
            if (matchedIds.has(index)) {
                item.element.classList.remove('hidden');
                item.element.setAttribute('open', '');
                matchedCategories.add(item.categoryElement);
            } else {
                item.element.classList.add('hidden');
                item.element.removeAttribute('open');
            }
        });

        // Hide/show categories
        faqCategories.forEach(cat => {
            if (matchedCategories.has(cat)) {
                cat.classList.remove('hidden');
            } else {
                cat.classList.add('hidden');
            }
        });

        // Show no results message if needed
        noResultsMessage.hidden = results.length > 0;
    }

    // Clear search
    function clearSearch() {
        searchInput.value = '';
        searchClear.hidden = true;
        searchResults.hidden = true;
        filterFaqItems([], '');
    }

    // Debounce function
    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Search input handler
    const handleSearch = debounce((query) => {
        const results = search(query);
        renderSearchResults(results, query);
        filterFaqItems(results, query);
    }, 200);

    searchInput.addEventListener('input', (e) => {
        const query = e.target.value;
        searchClear.hidden = query.length === 0;
        handleSearch(query);
    });

    // Clear button
    searchClear.addEventListener('click', clearSearch);

    // Clear search from no results button
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', clearSearch);
    }

    // Close search results when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.faq-search')) {
            searchResults.hidden = true;
        }
    });

    // Keyboard navigation
    searchInput.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            searchResults.hidden = true;
            searchInput.blur();
        }
    });

    // Check for URL query parameter and auto-search
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q');
    
    if (searchQuery) {
        searchInput.value = searchQuery;
        searchClear.hidden = false;
        
        // Perform search
        const results = search(searchQuery);
        filterFaqItems(results, searchQuery);
        
        // Clean up URL (remove query param without reload)
        const cleanUrl = window.location.pathname;
        window.history.replaceState({}, document.title, cleanUrl);
        
        console.log('🔍 Auto-searched for:', searchQuery, '- Found', results.length, 'results');
    }

    console.log('🔍 FAQ Search initialized with', searchIndex.length, 'items');
});
