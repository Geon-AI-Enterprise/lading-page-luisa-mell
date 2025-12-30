// ========================================
// Form Handler - Instituto Luisa Mell
// Handles form submissions to Supabase Edge Functions
// ========================================

const EDGE_FUNCTION_BASE_URL = 'https://iakcrxcpumsffcogmbhz.supabase.co/functions/v1';

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
 * Handles report form submission (denunciar.html)
 */
async function handleReportFormSubmit(event) {
    event.preventDefault();
    
    const form = event.target;
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Get form data - using actual IDs from denunciar.html
    const formData = {
        name: form.querySelector('#report-name')?.value?.trim() || '',
        email: form.querySelector('#report-email')?.value?.trim() || '',
        address: form.querySelector('#report-address')?.value?.trim() || '',
        whatsapp: form.querySelector('#report-whatsapp')?.value?.trim() || '',
        message: form.querySelector('#report-message')?.value?.trim() || ''
    };

    // Basic validation
    if (!formData.name || !formData.email || !formData.address || !formData.whatsapp || !formData.message) {
        showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/submit-report`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            form.reset();
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
    const formData = {
        state: form.querySelector('#state')?.value?.trim() || '',
        volunteerRole: form.querySelector('#volunteer-role')?.value?.trim() || '',
        fullname: form.querySelector('#fullname')?.value?.trim() || '',
        email: form.querySelector('#email')?.value?.trim() || '',
        whatsapp: form.querySelector('#whatsapp')?.value?.trim() || '',
        consent: form.querySelector('input[name="consent"]')?.checked || false
    };

    // Basic validation
    if (!formData.state || !formData.volunteerRole || !formData.fullname || !formData.email || !formData.whatsapp) {
        showToast('Por favor, preencha todos os campos obrigatórios.', 'error');
        return;
    }

    if (!formData.consent) {
        showToast('É necessário concordar com o uso dos dados.', 'error');
        return;
    }

    setButtonLoading(submitButton, true);

    try {
        const response = await fetch(`${EDGE_FUNCTION_BASE_URL}/submit-volunteer`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
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
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { handleReportFormSubmit, handleVolunteerFormSubmit };
}
