// ========================================
// Help Dropdown Menu Logic
// ========================================

export function setupHelpDropdown() {
    const helpWrapper = document.querySelector('.help-dropdown-wrapper');
    const displayButton = document.getElementById('help-display');
    const dropdown = document.getElementById('help-dropdown');

    // Segurança: se os elementos não existirem no HTML, para a execução
    if (!helpWrapper || !displayButton || !dropdown) {
        console.warn('Elementos do help-dropdown não encontrados', { helpWrapper, displayButton, dropdown });
        return;
    }

    console.log('✓ Help dropdown inicializado');

    // 1. Toggle visibility ao clicar no botão
    displayButton.addEventListener('click', function(e) {
        console.log('Click no botão help-display');
        e.preventDefault();
        e.stopPropagation();
        
        const isExpanded = displayButton.getAttribute('aria-expanded') === 'true';
        const newState = !isExpanded;
        
        displayButton.setAttribute('aria-expanded', newState);
        dropdown.hidden = !newState;
        
        console.log('Dropdown agora está:', dropdown.hidden ? 'oculto' : 'visível');
    });

    // 2. Handle seleção de opção no dropdown
    dropdown.querySelectorAll('.help-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const action = this.getAttribute('data-action');
            console.log('Opção clicada, action:', action);

            // Fecha o dropdown
            displayButton.setAttribute('aria-expanded', 'false');
            dropdown.hidden = true;

            // Processa a ação selecionada
            handleHelpAction(action);
        });
    });

    // 3. Fechar ao clicar fora
    document.addEventListener('click', function(e) {
        if (!helpWrapper.contains(e.target)) {
            displayButton.setAttribute('aria-expanded', 'false');
            dropdown.hidden = true;
        }
    });
}

// ========================================
// Handle Help Actions
// ========================================

function handleHelpAction(action) {
    console.log('Executando ação:', action);
    
    switch (action) {
        case 'donate':
            // Abrir modal de doação via Paybox SDK
            if (window.transformandoVidasComLuisaMell && typeof window.transformandoVidasComLuisaMell === 'function') {
                console.log('Abrindo modal de doação com Paybox');
                window.transformandoVidasComLuisaMell();
            } else {
                console.log('Abrindo doação via fallback URL');
                window.open('https://institutoluisamell.colabore.org/doe/single_step', '_blank', 'noopener,noreferrer');
            }
            break;
        case 'volunteer':
            console.log('Redirecionando para voluntários');
            window.location.href = 'ser-voluntario.html';
            break;
        case 'report':
            console.log('Redirecionando para denúncias');
            window.location.href = 'denunciar.html';
            break;
        default:
            console.warn('Ação não reconhecida:', action);
            break;
    }
}
