document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const errorMessageDiv = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        errorMessageDiv.classList.add('hidden');

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

            localStorage.setItem('loggedInUser', result.username);
            
            // LINHA ATUALIZADA: Redireciona para o menu principal
            window.location.href = 'menu.html';

        } catch (error) {
            errorMessageDiv.textContent = `Erro: ${error.message}`;
            errorMessageDiv.classList.remove('hidden');
        }
    });
});
