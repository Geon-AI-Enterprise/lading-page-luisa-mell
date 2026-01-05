// ========================================
// Form Handler - Instituto Luisa Mell
// Handles form submissions to Supabase Edge Functions
// ========================================

// Configuração carregada de config.js (não commitado no Git)
const getConfig = () => window.APP_CONFIG || {};
const EDGE_FUNCTION_BASE_URL = () => getConfig().EDGE_FUNCTION_BASE || '';
const SUPABASE_ANON_KEY = () => getConfig().SUPABASE_ANON_KEY || '';

/**
 * Format file size to human readable
 */
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file icon based on type
 */
function getFileIcon(type) {
    if (type.startsWith('image/')) {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>';
    } else if (type.startsWith('video/')) {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>';
    } else if (type === 'application/pdf') {
        return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>';
    }
    return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>';
}

/**
 * Initialize custom file upload
 */
function initFileUpload() {
    const fileUpload = document.querySelector('.file-upload');
    if (!fileUpload) return;

    const input = fileUpload.querySelector('.file-upload__input');
    const dropzone = fileUpload.querySelector('.file-upload__dropzone');
    const preview = fileUpload.querySelector('.file-upload__preview');
    
    let selectedFiles = new DataTransfer();

    // Render files preview
    function renderFiles() {
        preview.innerHTML = '';
        
        if (selectedFiles.files.length === 0) {
            fileUpload.classList.remove('file-upload--has-files');
            return;
        }
        
        fileUpload.classList.add('file-upload--has-files');
        
        Array.from(selectedFiles.files).forEach((file, index) => {
            const fileEl = document.createElement('div');
            fileEl.className = 'file-upload__file';
            fileEl.innerHTML = `
                <span class="file-upload__file-icon">${getFileIcon(file.type)}</span>
                <span class="file-upload__file-name" title="${file.name}">${file.name}</span>
                <span class="file-upload__file-size">${formatFileSize(file.size)}</span>
                <button type="button" class="file-upload__file-remove" data-index="${index}" title="Remover">×</button>
            `;
            preview.appendChild(fileEl);
        });
    }

    // Handle file selection
    input.addEventListener('change', (e) => {
        const newFiles = e.target.files;
        Array.from(newFiles).forEach(file => {
            // Check file size (10MB max)
            if (file.size > 10 * 1024 * 1024) {
                showToast(`Arquivo "${file.name}" excede o limite de 10MB.`, 'error');
                return;
            }
            selectedFiles.items.add(file);
        });
        input.files = selectedFiles.files;
        renderFiles();
    });

    // Handle remove file
    preview.addEventListener('click', (e) => {
        const removeBtn = e.target.closest('.file-upload__file-remove');
        if (!removeBtn) return;
        
        const index = parseInt(removeBtn.dataset.index);
        const newDataTransfer = new DataTransfer();
        
        Array.from(selectedFiles.files).forEach((file, i) => {
            if (i !== index) {
                newDataTransfer.items.add(file);
            }
        });
        
        selectedFiles = newDataTransfer;
        input.files = selectedFiles.files;
        renderFiles();
    });

    // Drag and drop
    ['dragenter', 'dragover'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUpload.classList.add('file-upload--dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            fileUpload.classList.remove('file-upload--dragover');
        });
    });

    dropzone.addEventListener('drop', (e) => {
        const droppedFiles = e.dataTransfer.files;
        Array.from(droppedFiles).forEach(file => {
            if (file.size > 10 * 1024 * 1024) {
                showToast(`Arquivo "${file.name}" excede o limite de 10MB.`, 'error');
                return;
            }
            selectedFiles.items.add(file);
        });
        input.files = selectedFiles.files;
        renderFiles();
    });

    console.log('📁 File upload initialized');
}

/**
 * Shows a toast notification
 */
function showToast(message, type = 'success') {
    // Remove any existing toasts
    const existingToast = document.querySelector('.form-toast');
    if (existingToast) {
        existingToast.remove();
    }

    const toast = document.createElement('div');
    toast.className = `form-toast form-toast--${type}`;
    toast.innerHTML = `
        <span class="form-toast__icon">${type === 'success' ? '✓' : '✕'}</span>
        <span class="form-toast__message">${message}</span>
    `;
    
    document.body.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => toast.classList.add('form-toast--visible'), 10);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        toast.classList.remove('form-toast--visible');
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Sets loading state on submit button
 */
function setButtonLoading(button, isLoading) {
    if (isLoading) {
        button.dataset.originalText = button.textContent;
        button.textContent = 'Enviando...';
        button.disabled = true;
        button.classList.add('btn--loading');
    } else {
        button.textContent = button.dataset.originalText || 'Enviar';
        button.disabled = false;
        button.classList.remove('btn--loading');
    }
}

/**
 * Validates email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone format (Brazilian)
 */
function isValidPhone(phone) {
    // Accept (XX) XXXX-XXXX or (XX) XXXXX-XXXX
    const phoneRegex = /^\(\d{2}\) \d{4,5}-\d{4}$/;
    return phoneRegex.test(phone);
}

/**
 * Applies phone mask in real-time
 */
function applyPhoneMask(value) {
    // Remove all non-digits
    let digits = value.replace(/\D/g, '');
    
    // Limit to 11 digits (Brazilian mobile with DDD)
    digits = digits.substring(0, 11);
    
    // Apply mask
    if (digits.length === 0) {
        return '';
    } else if (digits.length <= 2) {
        return `(${digits}`;
    } else if (digits.length <= 6) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2)}`;
    } else if (digits.length <= 10) {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
    } else {
        return `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
    }
}

/**
 * Initialize phone mask on input
 */
function initPhoneMask() {
    const phoneInputs = document.querySelectorAll('input[type="tel"]');
    
    phoneInputs.forEach(input => {
        input.addEventListener('input', (e) => {
            const cursorPosition = e.target.selectionStart;
            const oldValue = e.target.value;
            const newValue = applyPhoneMask(oldValue);
            
            e.target.value = newValue;
            
            // Try to maintain cursor position
            if (cursorPosition < newValue.length) {
                e.target.setSelectionRange(cursorPosition, cursorPosition);
            }
        });

        input.addEventListener('blur', (e) => {
            const value = e.target.value;
            if (value && !isValidPhone(value)) {
                e.target.classList.add('input-error');
                showFieldError(e.target, 'Formato inválido. Use: (00) 00000-0000');
            } else {
                e.target.classList.remove('input-error');
                clearFieldError(e.target);
            }
        });

        input.addEventListener('focus', (e) => {
            e.target.classList.remove('input-error');
            clearFieldError(e.target);
        });
    });

    console.log('📱 Phone mask initialized');
}

/**
 * Initialize email validation on input
 */
function initEmailValidation() {
    const emailInputs = document.querySelectorAll('input[type="email"]');
    
    emailInputs.forEach(input => {
        input.addEventListener('blur', (e) => {
            const value = e.target.value.trim();
            if (value && !isValidEmail(value)) {
                e.target.classList.add('input-error');
                showFieldError(e.target, 'Digite um e-mail válido');
            } else {
                e.target.classList.remove('input-error');
                clearFieldError(e.target);
            }
        });

        input.addEventListener('focus', (e) => {
            e.target.classList.remove('input-error');
            clearFieldError(e.target);
        });
    });

    console.log('📧 Email validation initialized');
}

/**
 * Shows error message below a field
 */
function showFieldError(input, message) {
    clearFieldError(input);
    
    const errorEl = document.createElement('span');
    errorEl.className = 'field-error-message';
    errorEl.textContent = message;
    errorEl.style.cssText = 'color: #ef4444; font-size: 0.75rem; margin-top: 0.25rem; display: block;';
    
    input.parentNode.appendChild(errorEl);
}

/**
 * Clears error message from a field
 */
function clearFieldError(input) {
    const existingError = input.parentNode.querySelector('.field-error-message');
    if (existingError) {
        existingError.remove();
    }
}

/**
 * Convert file to base64
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = reader.result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Handles report form submission (denunciar.html)
 */
async function handleReportFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Get form data - using actual IDs from denunciar.html
    const name = form.querySelector('#report-name')?.value?.trim() || '';
    const email = form.querySelector('#report-email')?.value?.trim() || '';
    const phone = form.querySelector('#report-phone')?.value?.trim() || '';
    const reportType = form.querySelector('#report-type')?.value?.trim() || '';
    const message = form.querySelector('#report-message')?.value?.trim() || '';

    // Collect structured address data
    const cep = form.querySelector('#report-cep')?.value?.replace(/\D/g, '') || '';
    const street = form.querySelector('#report-street')?.value?.trim() || '';
    const number = form.querySelector('#report-number')?.value?.trim() || '';
    const complement = form.querySelector('#report-complement')?.value?.trim() || '';
    const neighborhood = form.querySelector('#report-neighborhood')?.value?.trim() || '';
    const city = form.querySelector('#report-city')?.value?.trim() || '';
    const state = form.querySelector('#report-state')?.value?.trim() || '';

    // Build full address string
    let fullAddress = street;
    if (number) fullAddress += `, ${number}`;
    if (complement) fullAddress += ` - ${complement}`;
    if (neighborhood) fullAddress += `, ${neighborhood}`;
    if (city) fullAddress += ` - ${city}`;
    if (state) fullAddress += `/${state}`;
    if (cep) fullAddress += ` - CEP: ${cep.replace(/(\d{5})(\d{3})/, '$1-$2')}`;

    // Check for evidence files
    const proofInput = form.querySelector('#report-proof');
    const hasProof = proofInput && proofInput.files && proofInput.files.length > 0;

    // Basic validation
    if (!name || !email || !phone || !reportType || !street || !city || !message) {
        showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Validate CEP format (8 digits)
    if (cep && cep.length !== 8) {
        showToast('Por favor, digite um CEP válido com 8 dígitos.', 'error');
        form.querySelector('#report-cep')?.focus();
        return;
    }

    // Validate email format
    if (!isValidEmail(email)) {
        showToast('Por favor, digite um e-mail válido.', 'error');
        form.querySelector('#report-email')?.focus();
        return;
    }

    // Validate phone format
    if (!isValidPhone(phone)) {
        showToast('Por favor, digite um telefone válido no formato (00) 00000-0000.', 'error');
        form.querySelector('#report-phone')?.focus();
        return;
    }

    if (!hasProof) {
        showToast('Por favor, anexe pelo menos uma evidência (foto ou vídeo).', 'error');
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        // Build payload with structured address
        const payload = {
            name: name,
            email: email,
            whatsapp: phone,
            address: fullAddress,
            addressData: {
                cep: cep,
                street: street,
                number: number,
                complement: complement,
                neighborhood: neighborhood,
                city: city,
                state: state
            },
            message: message,
            reportType: reportType
        };

        // Convert first proof file to base64 and add to payload
        if (hasProof) {
            const file = proofInput.files[0];
            
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showToast('O arquivo é muito grande. Máximo permitido: 10MB.', 'error');
                setButtonLoading(submitButton, false);
                return;
            }

            try {
                const base64 = await fileToBase64(file);
                payload.proofFile = {
                    name: file.name,
                    type: file.type,
                    base64: base64
                };
            } catch (fileError) {
                console.error('Erro ao processar arquivo:', fileError);
                showToast('Erro ao processar o arquivo. Tente novamente.', 'error');
                setButtonLoading(submitButton, false);
                return;
            }
        }

        const response = await fetch(`${EDGE_FUNCTION_BASE_URL()}/submit-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
                'apikey': SUPABASE_ANON_KEY()
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            form.reset();
            // Clear file preview
            const preview = form.querySelector('.file-upload__preview');
            if (preview) preview.innerHTML = '';
            const fileUpload = form.querySelector('.file-upload');
            if (fileUpload) fileUpload.classList.remove('file-upload--has-files');
        } else {
            showToast(result.error || 'Erro ao enviar denúncia.', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showToast('Erro de conexão. Tente novamente mais tarde.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Handles volunteer form submission (ser-voluntario.html)
 */
async function handleVolunteerFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Get form data - using actual IDs from ser-voluntario.html
    const consentCheckbox = form.querySelector('#consent');
    const formData = {
        fullname: form.querySelector('#fullname')?.value?.trim() || '',
        email: form.querySelector('#email')?.value?.trim() || '',
        whatsapp: form.querySelector('#phone')?.value?.trim() || '',
        state: form.querySelector('#volunteer-state')?.value?.trim() || 'SP',
        volunteerRole: form.querySelector('#volunteer-topic')?.value?.trim() || '',
        motivation: form.querySelector('#motivation')?.value?.trim() || '',
        consent: consentCheckbox?.checked || false
    };

    // Basic validation
    if (!formData.fullname || !formData.email || !formData.whatsapp || !formData.volunteerRole) {
        showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    // Validate consent
    if (!formData.consent) {
        showToast('É necessário concordar com a Política de Privacidade para continuar.', 'error');
        return;
    }

    // Validate email format
    if (!isValidEmail(formData.email)) {
        showToast('Por favor, digite um e-mail válido.', 'error');
        form.querySelector('#email')?.focus();
        return;
    }

    // Validate phone format
    if (!isValidPhone(formData.whatsapp)) {
        showToast('Por favor, digite um telefone válido no formato (00) 00000-0000.', 'error');
        form.querySelector('#phone')?.focus();
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await fetch(`${EDGE_FUNCTION_BASE_URL()}/submit-volunteer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
                'apikey': SUPABASE_ANON_KEY()
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            form.reset();
        } else {
            showToast(result.error || 'Erro ao enviar cadastro.', 'error');
        }
    } catch (error) {
        console.error('Erro ao enviar formulário:', error);
        showToast('Erro de conexão. Tente novamente mais tarde.', 'error');
    } finally {
        setButtonLoading(submitButton, false);
    }
}

/**
 * Initialize form handlers
 */
function initFormHandlers() {
    // Report form - denunciar.html
    const reportForm = document.querySelector('.report-card__form');
    if (reportForm) {
        reportForm.addEventListener('submit', handleReportFormSubmit);
        console.log('📝 Report form handler initialized');
    }

    // Volunteer form - ser-voluntario.html
    const volunteerForm = document.querySelector('.volunteer-card__form');
    if (volunteerForm) {
        volunteerForm.addEventListener('submit', handleVolunteerFormSubmit);
        console.log('🤝 Volunteer form handler initialized');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    initFormHandlers();
    initFileUpload();
    initPhoneMask();
    initEmailValidation();
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleReportFormSubmit, handleVolunteerFormSubmit };
}
