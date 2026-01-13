// ========================================
// Help Dropdown Menu Logic
// ========================================

export function setupHelpDropdown() {
    const helpWrapper = document.querySelector('.help-dropdown-wrapper');
    const displayButton = document.getElementById('help-display');
    const dropdown = document.getElementById('help-dropdown');

    // Segurança: se os elementos não existirem no HTML, para a execução
    if (!helpWrapper || !displayButton || !dropdown) return;

    // 1. Toggle visibility ao clicar no botão
    displayButton.addEventListener('click', (e) => {
        e.stopPropagation(); // Previne fechar imediatamente
        const isExpanded = displayButton.getAttribute('aria-expanded') === 'true';
        toggleDropdown(!isExpanded);
    });

    // 2. Handle seleção de opção no dropdown
    dropdown.querySelectorAll('.help-option').forEach(option => {
        option.addEventListener('click', (e) => {
            const action = e.target.getAttribute('data-action');

            // Fecha o dropdown
            toggleDropdown(false);

            // Processa a ação selecionada
            handleHelpAction(action);
        });
    });

    // 3. Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!helpWrapper.contains(e.target)) {
            toggleDropdown(false);
        }
    });

    // Função auxiliar para abrir/fechar
    function toggleDropdown(show) {
        displayButton.setAttribute('aria-expanded', show);
        dropdown.hidden = !show;
    }
}

// ========================================
// Handle Help Actions
// ========================================

function handleHelpAction(action) {
    switch (action) {
        case 'donate':
            // Redirecionar para a página de doação
            window.open('https://institutoluisamell.colabore.org/doe/single_step', '_blank', 'noopener,noreferrer');
            break;
        case 'volunteer':
            // Redirecionar para a página de voluntários
            window.location.href = 'ser-voluntario.html';
            break;
        case 'report':
            // Redirecionar para a página de denúncias
            window.location.href = 'denunciar.html';
            break;
        default:
            break;
    }
}
