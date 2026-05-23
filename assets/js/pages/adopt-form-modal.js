// ========================================
// Adopt Form Modal - Instituto Luisa Mell
// Modal de formulario de pedido de adocao. Abre ao clicar em "Adote o/a X"
// dentro do modal de perfil do animal. Pre-preenche o animal de interesse
// com dados vindos do banco (id, nome, genero).
//
// Submission ainda nao tem backend ativo (edge function submit-adoption
// nao deployada). O handler abaixo esta preparado: basta deployar a function
// e descomentar o bloco do fetch.
// ========================================

(function initAdoptFormModal() {
    const overlay = document.getElementById('adopt-form-overlay');
    const modal = document.getElementById('adopt-form-modal');
    const form = document.getElementById('adopt-form');
    if (!modal || !overlay || !form) return;

    const animalInput = document.getElementById('adopt-form-animal');
    const animalIdInput = document.getElementById('adopt-form-animal-id');
    const titleEl = modal.querySelector('.adopt-form-modal__title');
    const closeBtn = modal.querySelector('.adopt-form-modal__close');

    function openForm(payload) {
        const { animalId, animalName, animalGender } = payload;
        const article = animalGender === 'female' ? 'a' : 'o';

        if (titleEl) titleEl.textContent = `Quero adotar ${article} ${animalName}!`;
        if (animalInput) animalInput.value = animalName;
        if (animalIdInput) animalIdInput.value = animalId;

        modal.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeForm() {
        modal.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Delegacao: qualquer clique em .animal-modal__btn--adopt abre o form
    document.addEventListener('click', (e) => {
        const adoptBtn = e.target.closest('.animal-modal__btn--adopt');
        if (!adoptBtn) return;
        e.preventDefault();

        // Fecha o modal do animal por baixo (se aberto)
        document.getElementById('animal-profile-modal')?.classList.remove('active');
        document.getElementById('animal-modal-overlay')?.classList.remove('active');

        openForm({
            animalId: adoptBtn.dataset.animalId || '',
            animalName: adoptBtn.dataset.animalName || '',
            animalGender: adoptBtn.dataset.animalGender || 'male',
        });
    });

    closeBtn?.addEventListener('click', closeForm);
    overlay.addEventListener('click', closeForm);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal.classList.contains('active')) closeForm();
    });

    // Submission handler
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitBtn = form.querySelector('.adopt-form__submit');
        const data = Object.fromEntries(new FormData(form).entries());

        // Validacao basica adicional aos required do HTML
        if (!data.email || !data.email.includes('@')) {
            alert('Por favor, informe um e-mail valido.');
            return;
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Enviando...';
        }

        try {
            // TODO: quando a edge function submit-adoption estiver pronta,
            // descomentar o bloco abaixo. Por enquanto, simulamos sucesso
            // localmente e logamos o payload para inspecao.
            //
            // const response = await fetch(`${EDGE_FUNCTION_BASE_URL()}/submit-adoption`, {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //         'Authorization': `Bearer ${SUPABASE_ANON_KEY()}`,
            //         'apikey': SUPABASE_ANON_KEY(),
            //     },
            //     body: JSON.stringify(data),
            // });
            // const result = await response.json();
            // if (!result.success) throw new Error(result.error || 'Erro ao enviar.');

            console.log('[adopt-form] payload pronto para submit:', data);

            alert(
                `Pedido recebido! Em breve nossa equipe entrara em contato sobre ${data.animalName}.`
            );
            form.reset();
            closeForm();
        } catch (err) {
            console.error('[adopt-form] erro:', err);
            alert('Erro ao enviar pedido. Tente novamente mais tarde.');
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Enviar pedido de adocao';
            }
        }
    });
})();
