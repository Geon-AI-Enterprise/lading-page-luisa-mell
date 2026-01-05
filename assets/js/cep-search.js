// ========================================
// ViaCEP Integration
// Instituto Luisa Mell
// ========================================

/**
 * Limpa o CEP removendo caracteres não numéricos
 * @param {string} cep - CEP com ou sem formatação
 * @returns {string} CEP apenas com números
 */
function cleanCep(cep) {
    return cep.replace(/\D/g, '');
}

/**
 * Formata o CEP no padrão 00000-000
 * @param {string} cep - CEP
 * @returns {string} CEP formatado
 */
function formatCep(cep) {
    const cleaned = cleanCep(cep);
    if (cleaned.length <= 5) {
        return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
}

/**
 * Valida se o CEP tem 8 dígitos
 * @param {string} cep - CEP
 * @returns {boolean}
 */
function isValidCep(cep) {
    return cleanCep(cep).length === 8;
}

/**
 * Busca endereço pelo CEP usando ViaCEP
 * @param {string} cep - CEP
 * @returns {Promise<Object|null>} Dados do endereço ou null se não encontrado
 */
async function fetchAddressByCep(cep) {
    const cleanedCep = cleanCep(cep);
    
    if (!isValidCep(cleanedCep)) {
        return null;
    }
    
    try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanedCep}/json/`);
        const data = await response.json();
        
        if (data.erro) {
            return null;
        }
        
        return {
            cep: data.cep,
            street: data.logradouro,
            complement: data.complemento,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            ibge: data.ibge,
            ddd: data.ddd
        };
    } catch (error) {
        console.error('Erro ao buscar CEP:', error);
        return null;
    }
}

/**
 * Preenche os campos do formulário com os dados do endereço
 * @param {Object} address - Dados do endereço
 */
function fillAddressFields(address) {
    const fields = {
        'report-street': address.street || '',
        'report-neighborhood': address.neighborhood || '',
        'report-city': address.city || '',
        'report-state': address.state || ''
    };
    
    Object.entries(fields).forEach(([id, value]) => {
        const field = document.getElementById(id);
        if (field) {
            field.value = value;
            // Se o campo foi preenchido automaticamente, adicionar classe visual
            if (value) {
                field.classList.add('auto-filled');
            }
        }
    });
    
    // Focar no campo de número após preencher
    const numberField = document.getElementById('report-number');
    if (numberField) {
        numberField.focus();
    }
}

/**
 * Limpa os campos de endereço
 */
function clearAddressFields() {
    const fieldIds = ['report-street', 'report-neighborhood', 'report-city', 'report-state'];
    
    fieldIds.forEach(id => {
        const field = document.getElementById(id);
        if (field) {
            field.value = '';
            field.classList.remove('auto-filled');
        }
    });
}

/**
 * Atualiza o status do CEP
 * @param {string} status - 'loading', 'success', 'error', 'clear'
 * @param {string} message - Mensagem opcional
 */
function updateCepStatus(status, message = '') {
    const statusEl = document.getElementById('cep-status');
    const loaderEl = document.getElementById('cep-loader');
    
    if (statusEl) {
        statusEl.className = 'form-helper cep-status';
        
        switch (status) {
            case 'loading':
                statusEl.textContent = 'Buscando endereço...';
                statusEl.classList.add('cep-status--loading');
                break;
            case 'success':
                statusEl.textContent = message || 'Endereço encontrado!';
                statusEl.classList.add('cep-status--success');
                break;
            case 'error':
                statusEl.textContent = message || 'CEP não encontrado';
                statusEl.classList.add('cep-status--error');
                break;
            case 'clear':
            default:
                statusEl.textContent = '';
                break;
        }
    }
    
    if (loaderEl) {
        loaderEl.classList.toggle('active', status === 'loading');
    }
}

/**
 * Monta o endereço completo a partir dos campos
 * @returns {string} Endereço completo formatado
 */
function buildFullAddress() {
    const street = document.getElementById('report-street')?.value || '';
    const number = document.getElementById('report-number')?.value || '';
    const complement = document.getElementById('report-complement')?.value || '';
    const neighborhood = document.getElementById('report-neighborhood')?.value || '';
    const city = document.getElementById('report-city')?.value || '';
    const state = document.getElementById('report-state')?.value || '';
    const cep = document.getElementById('report-cep')?.value || '';
    
    let address = street;
    if (number) address += `, ${number}`;
    if (complement) address += ` - ${complement}`;
    if (neighborhood) address += `, ${neighborhood}`;
    if (city) address += ` - ${city}`;
    if (state) address += `/${state}`;
    if (cep) address += ` - CEP: ${cep}`;
    
    return address;
}

/**
 * Obtém os dados de endereço como objeto JSON
 * @returns {Object} Dados do endereço estruturados
 */
function getAddressData() {
    return {
        cep: cleanCep(document.getElementById('report-cep')?.value || ''),
        street: document.getElementById('report-street')?.value || '',
        number: document.getElementById('report-number')?.value || '',
        complement: document.getElementById('report-complement')?.value || '',
        neighborhood: document.getElementById('report-neighborhood')?.value || '',
        city: document.getElementById('report-city')?.value || '',
        state: document.getElementById('report-state')?.value || '',
        fullAddress: buildFullAddress()
    };
}

/**
 * Inicializa a funcionalidade de busca por CEP
 */
function initCepSearch() {
    const cepInput = document.getElementById('report-cep');
    
    if (!cepInput) return;
    
    let debounceTimer = null;
    
    // Formatar CEP enquanto digita
    cepInput.addEventListener('input', (e) => {
        const formatted = formatCep(e.target.value);
        e.target.value = formatted;
        
        // Limpar timer anterior
        if (debounceTimer) {
            clearTimeout(debounceTimer);
        }
        
        // Se o CEP estiver completo, buscar após 500ms
        if (isValidCep(formatted)) {
            debounceTimer = setTimeout(async () => {
                updateCepStatus('loading');
                
                const address = await fetchAddressByCep(formatted);
                
                if (address) {
                    fillAddressFields(address);
                    updateCepStatus('success', `${address.city}/${address.state}`);
                } else {
                    clearAddressFields();
                    updateCepStatus('error', 'CEP não encontrado. Verifique e tente novamente.');
                }
            }, 500);
        } else {
            updateCepStatus('clear');
        }
    });
    
    // Atualizar campo hidden com endereço completo antes do submit
    const form = cepInput.closest('form');
    if (form) {
        form.addEventListener('submit', () => {
            const addressHidden = document.getElementById('report-address');
            if (addressHidden) {
                addressHidden.value = buildFullAddress();
            }
        });
    }
    
    console.log('🏠 CEP search initialized');
}

// Auto-inicializar se estiver na página de denúncia
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCepSearch);
} else {
    initCepSearch();
}
