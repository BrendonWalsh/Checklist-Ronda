// Bloco de proteção (executado imediatamente antes de a página carregar)
const loggedInUser = localStorage.getItem('loggedInUser');
if (!loggedInUser) {
    // Se não houver usuário logado, o acesso é bloqueado ANTES da página carregar.
    alert('Acesso negado. Por favor, faça o login.');
    window.location.href = 'login.html';
} else {
    // Se o usuário estiver logado, a página pode ser mostrada.
    // O evento DOMContentLoaded garante que o HTML exista antes de tentarmos manipulá-lo.
    document.addEventListener('DOMContentLoaded', function() {
        
        // Mostra o corpo da página, que estava escondido para evitar "piscar" na tela
        document.body.classList.remove('hidden');

        // --- LÓGICA DE LOGOUT ---
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                localStorage.removeItem('loggedInUser');
                alert('Você saiu do sistema.');
                window.location.href = 'login.html';
            });
        }

        // Atualiza o campo de segurança com o nome do usuário
        const securityUserInput = document.getElementById('securityUser');
        if (securityUserInput) securityUserInput.value = loggedInUser;

        const form = document.getElementById('checklistForm');
        if (!form) return;

        // --- INICIALIZAÇÃO DO FORMULÁRIO ---
        const now = new Date();
        document.getElementById('checkDate').value = now.toISOString().split('T')[0];
        document.getElementById('checkTime').value = now.toTimeString().split(' ')[0].substring(0, 5);

        // --- LÓGICA DE UPLOAD DE ARQUIVO ---
        document.querySelectorAll('.checklist-item').forEach(item => {
            const takePhotoBtn = item.querySelector('.take-photo-btn');
            const uploadBtn = item.querySelector('.upload-btn');
            const fileInput = item.querySelector('.file-input');
            const previewContainer = item.querySelector('.preview-container');

            if (takePhotoBtn) {
                takePhotoBtn.addEventListener('click', () => {
                    fileInput.setAttribute('capture', 'user'); // Pede para abrir a câmera
                    fileInput.click();
                });
            }
            if (uploadBtn) {
                uploadBtn.addEventListener('click', () => {
                    fileInput.removeAttribute('capture'); // Garante que abra a galeria
                    fileInput.click();
                });
            }
            if (fileInput) {
                fileInput.addEventListener('change', (event) => {
                    const file = event.target.files[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        previewContainer.innerHTML = ''; // Limpa pré-visualizações antigas
                        const img = document.createElement('img');
                        img.src = e.target.result;
                        img.classList.add('image-preview');
                        previewContainer.appendChild(img);
                        // Armazena o dado da imagem (Base64) no próprio container para fácil acesso
                        previewContainer.dataset.base64 = e.target.result;
                    };
                    reader.readAsDataURL(file);
                });
            }
        });

        // --- LÓGICA DE VISIBILIDADE E VALIDAÇÃO ---
        
        // Lógica para mostrar/esconder a seção de observação e upload
        document.querySelectorAll('.checklist-item input[type="radio"]').forEach(radio => {
            radio.addEventListener('change', () => {
                const container = radio.closest('.checklist-item');
                const observacaoContainer = container.querySelector('.observacao-container');
                if (observacaoContainer) {
                    if (radio.value === 'nao' && radio.checked) {
                        observacaoContainer.classList.remove('hidden');
                    } else {
                        observacaoContainer.classList.add('hidden');
                    }
                }
            });
        });

        const comDocumentoRadio = document.getElementById('comDocumento');
        const semDocumentoRadio = document.getElementById('semDocumento');
        const detalhesComDocumento = document.getElementById('detalhesComDocumento');
        const detalhesSemDocumento = document.getElementById('detalhesSemDocumento');
        const numeroDocumentoInput = document.getElementById('numeroDocumento');
        const descricaoProdutosTextarea = document.getElementById('descricaoProdutos');

        function toggleDocumentoDetails() {
            if (comDocumentoRadio.checked) {
                detalhesComDocumento.classList.remove('hidden');
                numeroDocumentoInput.required = true;
                detalhesSemDocumento.classList.add('hidden');
                descricaoProdutosTextarea.required = false;
            } else if (semDocumentoRadio.checked) {
                detalhesComDocumento.classList.add('hidden');
                numeroDocumentoInput.required = false;
                detalhesSemDocumento.classList.remove('hidden');
                descricaoProdutosTextarea.required = true;
            }
        }
        comDocumentoRadio.addEventListener('change', toggleDocumentoDetails);
        semDocumentoRadio.addEventListener('change', toggleDocumentoDetails);

        // --- AÇÃO FINAL (ENVIAR PARA O BACKEND) ---
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            // Adicionar validação do botão finalizar aqui se necessário

            const dadosParaSalvar = {
                dataChecagem: document.getElementById('checkDate').value,
                horaChecagem: document.getElementById('checkTime').value,
                seguranca: document.getElementById('securityUser').value,
                colaboradorAbordado: document.getElementById('colaborador').value,
                setorOrigem: document.getElementById('setorOrigem').value,
                setorDestino: document.getElementById('setorDestino').value,
                produtos: [],
                validacaoDocumento: form.querySelector('input[name="validacaoDocumento"]:checked')?.value,
                numeroDocumento: document.getElementById('numeroDocumento').value,
                descricaoProdutos: document.getElementById('descricaoProdutos').value,
                checklistConformidade: {},
                numeroLacre: document.getElementById('numeroLacre').value,
                observacaoGeral: document.getElementById('obsGeral').value,
                statusFinal: document.getElementById('statusChecagem')?.textContent || 'Não definido'
            };

            // Coleta os produtos
            form.querySelectorAll('input[name="tipoProduto"]:checked').forEach(checkbox => {
                const qtdInput = document.querySelector(`input[name="qtd${checkbox.id.replace('tipoP', 'P')}"]`);
                dadosParaSalvar.produtos.push({
                    tipo: checkbox.nextElementSibling.textContent,
                    quantidade: parseInt(qtdInput.value) || 0
                });
            });

            // Coleta os dados de conformidade, incluindo observações e evidências
            document.querySelectorAll('.checklist-item').forEach(item => {
                const itemId = item.dataset.itemId;
                const radioChecked = item.querySelector('input[type="radio"]:checked');
                const observacao = item.querySelector('.observacao-container textarea');
                const preview = item.querySelector('.preview-container');
                
                if (radioChecked) {
                    dadosParaSalvar.checklistConformidade[itemId.toLowerCase()] = radioChecked.value;
                }
                if (observacao) {
                    dadosParaSalvar.checklistConformidade[`observacao${itemId}`] = observacao.value;
                }
                if (preview && preview.dataset.base64) {
                    dadosParaSalvar.checklistConformidade[`evidencia${itemId}`] = preview.dataset.base64;
                }
            });

            // Enviar os dados para o backend
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
                console.error('Erro ao enviar para o servidor:', error);
                alert(`Erro ao salvar: ${error.message}`);
            }
        });

    });
}
