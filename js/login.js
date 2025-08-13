document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.classList.add('hidden'); // Esconde mensagens de erro antigas

        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('http://localhost:3000/api/users/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || 'Erro de autenticação');
            }

            // Se o login for bem-sucedido:
            // 1. Salva o usuário logado no armazenamento local do navegador
            localStorage.setItem('loggedInUser', result.username);

            // 2. Redireciona para a página principal do checklist
            window.location.href = 'index.html';

        } catch (error) {
            errorMessageDiv.textContent = `Erro: ${error.message}`;
            errorMessageDiv.classList.remove('hidden');
        }
    });
});
