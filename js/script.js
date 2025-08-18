const loggedInUser = localStorage.getItem('loggedInUser');
if (!loggedInUser) {
    alert('Acesso negado. Por favor, faça o login.');
    window.location.href = 'login.html';
} else {
    document.addEventListener('DOMContentLoaded', function() {
        
        document.body.classList.remove('hidden');

        const backToMenuBtn = document.getElementById('backToMenuBtn');
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        const form = document.getElementById('checklistForm');
        const customConfirmModal = document.getElementById('customConfirmModal');
        const confirmYesBtn = document.getElementById('confirmYesBtn');
        const confirmNoBtn = document.getElementById('confirmNoBtn');

        function saveCurrentDraft() {
            const formData = new FormData(form);
            const data = {};
            formData.forEach((value, key) => {
                if (data[key]) {
                    if (!Array.isArray(data[key])) data[key] = [data[key]];
                    data[key].push(value);
                } else { data[key] = value; }
            });
            document.querySelectorAll('.preview-container[data-base64]').forEach(container => {
                const itemId = container.closest('.checklist-item').dataset.itemId;
                if (itemId) data[`evidencia${itemId}`] = container.dataset.base64;
            });
            localStorage.setItem('checklistRondaDraft', JSON.stringify(data));
            alert('Rascunho salvo com sucesso!');
        }
        
        if (saveDraftBtn) saveDraftBtn.addEventListener('click', (e) => { e.preventDefault(); saveCurrentDraft(); });
        if (backToMenuBtn) backToMenuBtn.addEventListener('click', (e) => { e.preventDefault(); customConfirmModal.classList.remove('hidden'); });
        if (confirmYesBtn) confirmYesBtn.addEventListener('click', () => { saveCurrentDraft(); customConfirmModal.classList.add('hidden'); window.location.href = 'menu.html'; });
        if (confirmNoBtn) confirmNoBtn.addEventListener('click', () => { customConfirmModal.classList.add('hidden'); window.location.href = 'menu.html'; });
        
        const securityUserInput = document.getElementById('securityUser');
        if (securityUserInput) securityUserInput.value = loggedInUser;
        
        const now = new Date();
        document.getElementById('checkDate').value = now.toISOString().split('T')[0];
        document.getElementById('checkTime').value = now.toTimeString().split(' ')[0].substring(0, 5);

        document.querySelectorAll('.checklist-item').forEach(item => {
            const takePhotoBtn = item.querySelector('.take-photo-btn');
            const uploadBtn = item.querySelector('.upload-btn');
            const fileInput = item.querySelector('.file-input');
            const previewContainer = item.querySelector('.preview-container');
            if (takePhotoBtn) takePhotoBtn.addEventListener('click', () => { fileInput.setAttribute('capture', 'user'); fileInput.click(); });
            if (uploadBtn) uploadBtn.addEventListener('click', () => { fileInput.removeAttribute('capture'); fileInput.click(); });
            if (fileInput) {
                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewContainer.innerHTML = '';
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.classList.add('image-preview');
                        previewContainer.appendChild(img);
                        previewContainer.dataset.base64 = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }
        });

        const radioDocSim = document.querySelector('input[name="checkDocumentoTransporte"][value="sim"]');
        const radioDocNao = document.querySelector('input[name="checkDocumentoTransporte"][value="nao"]');
        const detalhesComDocumento = document.getElementById('detalhesComDocumento');
        const detalhesSemDocumento = document.getElementById('detalhesSemDocumento');
        const numeroDocumentoInput = document.getElementById('numeroDocumento');
        const descricaoProdutosTextarea = document.getElementById('descricaoProdutos');

        function toggleDocumentoTransporteDetails() {
            if (radioDocSim.checked) {
                detalhesComDocumento.classList.remove('hidden');
                numeroDocumentoInput.required = true;
                detalhesSemDocumento.classList.add('hidden');
                descricaoProdutosTextarea.required = false;
            } else if (radioDocNao.checked) {
                detalhesComDocumento.classList.add('hidden');
                numeroDocumentoInput.required = false;
                detalhesSemDocumento.classList.remove('hidden');
                descricaoProdutosTextarea.required = true;
            }
            validateForm();
        }
        radioDocSim.addEventListener('change', toggleDocumentoTransporteDetails);
        radioDocNao.addEventListener('change', toggleDocumentoTransporteDetails);

        document.querySelectorAll('.checklist-item input[type="radio"]').forEach(radio => {
            if (radio.name === 'checkDocumentoTransporte') return;
            radio.addEventListener('change', () => {
                const container = radio.closest('.checklist-item');
                const observacaoContainer = container.querySelector('.observacao-container');
                if (observacaoContainer) {
                    if (radio.value === 'nao' && radio.checked) observacaoContainer.classList.remove('hidden');
                    else observacaoContainer.classList.add('hidden');
                }
            });
        });

        const statusChecagemSpan = document.getElementById('statusChecagem');
        const checklistRadios = document.querySelectorAll('.checklist-item input[type="radio"]');

        function updateFinalStatus() {
            let naoConformeEncontrado = false;
            document.querySelectorAll('.checklist-item input[value="nao"]:checked').forEach(() => { naoConformeEncontrado = true; });
            statusChecagemSpan.classList.remove('bg-green-100', 'text-green-800', 'bg-red-100', 'text-red-800');
            if (naoConformeEncontrado) {
                statusChecagemSpan.textContent = 'Não Conforme';
                statusChecagemSpan.classList.add('bg-red-100', 'text-red-800');
            } else {
                statusChecagemSpan.textContent = 'Conforme';
                statusChecagemSpan.classList.add('bg-green-100', 'text-green-800');
            }
        }
        checklistRadios.forEach(radio => radio.addEventListener('change', updateFinalStatus));
        
        const finalizarBtn = document.getElementById('finalizarBtn');
        function validateForm() {
            let isFormValid = true;
            const requiredInputs = form.querySelectorAll('[required]');

            requiredInputs.forEach(input => {
                if (input.offsetParent !== null) {
                    if (input.type === 'radio') {
                        const groupName = input.name;
                        if (!form.querySelector(`input[name="${groupName}"]:checked`)) isFormValid = false;
                    } else if (!input.value.trim()) {
                        isFormValid = false;
                    }
                }
            });
            
            const produtosChecked = form.querySelectorAll('input[name="tipoProduto"]:checked');
            if (produtosChecked.length > 0) {
                let allQuantitiesFilled = true;
                produtosChecked.forEach(checkbox => {
                    const qtdInput = document.querySelector(`input[name="qtd${checkbox.id.replace('tipoP', 'P')}"]`);
                    if (!qtdInput || !qtdInput.value || parseInt(qtdInput.value) < 1) allQuantitiesFilled = false;
                });
                if (!allQuantitiesFilled) isFormValid = false;
            } else {
                isFormValid = false;
            }

            finalizarBtn.disabled = !isFormValid;
        }

        form.addEventListener('input', validateForm);
        form.addEventListener('change', validateForm);
        
        updateFinalStatus();
        validateForm();

        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            if (finalizarBtn.disabled) {
                alert('Por favor, preencha todos os campos obrigatórios antes de finalizar.');
                return;
            }
            
            const dadosParaSalvar = {
                dataChecagem: document.getElementById('checkDate').value,
                horaChecagem: document.getElementById('checkTime').value,
                seguranca: document.getElementById('securityUser').value,
                colaboradorAbordado: document.getElementById('colaborador').value,
                setorOrigem: document.getElementById('setorOrigem').value,
                setorDestino: document.getElementById('setorDestino').value,
                produtos: [],
                checklistConformidade: {},
                numeroLacre: document.getElementById('numeroLacre').value,
                observacaoGeral: document.getElementById('obsGeral').value,
                statusFinal: document.getElementById('statusChecagem')?.textContent || 'Não definido'
            };

            form.querySelectorAll('input[name="tipoProduto"]:checked').forEach(c => {
                const qtd = document.querySelector(`input[name="qtd${c.id.replace('tipoP', 'P')}"]`);
                dadosParaSalvar.produtos.push({ tipo: c.nextElementSibling.textContent, quantidade: parseInt(qtd.value) || 0 });
            });

            document.querySelectorAll('.checklist-item').forEach(item => {
                const id = item.dataset.itemId;
                const radio = item.querySelector('input[type="radio"]:checked');
                const obs = item.querySelector('.observacao-container textarea, #detalhesSemDocumento textarea');
                const preview = item.querySelector('.preview-container');
                const numDoc = item.querySelector('#numeroDocumento');

                if(id === 'DocumentoTransporte') {
                    if(radio) dadosParaSalvar.checklistConformidade.documentoTransporte = radio.value;
                    if(numDoc) dadosParaSalvar.checklistConformidade.numeroDocumentoAnexo = numDoc.value;
                    if(obs) dadosParaSalvar.checklistConformidade.descricaoSemDocumento = obs.value;
                    if(preview?.dataset.base64) dadosParaSalvar.checklistConformidade.evidenciaDocumentoAnexo = preview.dataset.base64;
                } else {
                    if(radio) dadosParaSalvar.checklistConformidade[id.toLowerCase()] = radio.value;
                    if(obs) dadosParaSalvar.checklistConformidade[`observacao${id}`] = obs.value;
                    if(preview?.dataset.base64) dadosParaSalvar.checklistConformidade[`evidencia${id}`] = preview.dataset.base64;
                }
            });

            try {
                const response = await fetch('http://localhost:3000/api/checklists', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(dadosParaSalvar),
                });
                const result = await response.json();
                if (!response.ok) throw new Error(result.message);
                alert('Checklist salvo com sucesso!');
                form.reset();
                location.reload();
            } catch (error) {
                alert(`Erro ao salvar: ${error.message}`);
            }
        });
    });
}
