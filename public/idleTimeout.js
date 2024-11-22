document.addEventListener('DOMContentLoaded', () => {
    let idleTime = 0;
    const timeoutTime = 10 * 60 * 1000; 

    function resetIdleTime() {
        idleTime = 0;
    }

    // Função para redirecionar o usuário após o tempo de inatividade
    function logoutAndReload() {
        window.location.href = '/'; 
        window.location.href = '/logout'
    }

    // Incrementa o contador de tempo ocioso a cada segundo
    setInterval(() => {
        idleTime += 1000;
        if (idleTime >= timeoutTime) {
            logoutAndReload();
        }
    }, 1000); 

    // Resetar o contador de tempo ocioso quando houver atividade do usuário
    window.addEventListener('mousemove', resetIdleTime);
    window.addEventListener('keypress', resetIdleTime);
    window.addEventListener('click', resetIdleTime);
    window.addEventListener('scroll', resetIdleTime);
});
