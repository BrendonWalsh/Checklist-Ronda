document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = localStorage.getItem('loggedInUser');
    if (!loggedInUser) {
        window.location.href = 'login.html';
        return;
    }

    const historyContainer = document.getElementById('historyContainer');
    const loadingDiv = document.getElementById('loading');
    const errorDiv = document.getElementById('error');

    async function fetchHistory() {
        try {
            const response = await fetch('http://localhost:3000/api/checklists');
            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Falha ao buscar dados.');
            }
            const checklists = await response.json();
            displayHistory(checklists);
        } catch (error) {
            loadingDiv.classList.add('hidden');
            errorDiv.textContent = `Erro: ${error.message}`;
            errorDiv.classList.remove('hidden');
        }
    }

    function displayHistory(checklists) {
        loadingDiv.classList.add('hidden');
        historyContainer.classList.remove('hidden');
        historyContainer.innerHTML = '';

        if (checklists.length === 0) {
            historyContainer.innerHTML = '<p class="text-center text-gray-500">Nenhum checklist encontrado.</p>';
            return;
        }

        checklists.forEach(item => {
            const statusClass = item.statusFinal.includes('Não Conforme') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800';
            const borderClass = item.statusFinal.includes('Não Conforme') ? 'border-red-500' : 'border-green-500';
            
            const card = `
                <div class="bg-white p-4 rounded-lg shadow-md border-l-4 ${borderClass}">
                    <div class="flex justify-between items-start">
                        <div>
                            <p class="font-bold text-lg text-gray-800">Ocorrência #${String(item.occurrenceNumber).padStart(4, '0')}</p>
                            <p class="text-sm text-gray-600">Colaborador: ${item.colaboradorAbordado}</p>
                            <p class="text-sm text-gray-500">Segurança: ${item.seguranca} | Data: ${new Date(item.dataChecagem).toLocaleDateString('pt-BR')}</p>
                        </div>
                        <span class="font-medium px-3 py-1 rounded-full ${statusClass}">${item.statusFinal}</span>
                    </div>
                </div>
            `;
            historyContainer.innerHTML += card;
        });
    }

    fetchHistory();
});
