document.addEventListener('DOMContentLoaded', () => {
    const loggedInUser = localStorage.getItem('loggedInUser');

    // Proteção de rota: se não estiver logado, volta para o login
    if (!loggedInUser) {
        alert('Acesso negado. Por favor, faça o login.');
        window.location.href = 'login.html';
        return;
    }

    // Exibe mensagem de boas-vindas
    const welcomeUserSpan = document.getElementById('welcomeUser');
    if (welcomeUserSpan) {
        welcomeUserSpan.textContent = `Bem-vindo, ${loggedInUser}!`;
    }

    // Lógica do botão de logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            localStorage.removeItem('loggedInUser');
            alert('Você saiu do sistema.');
            window.location.href = 'login.html';
        });
    }
});
