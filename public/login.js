document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();  // Previne o comportamento padrão do formulário (não recarregar a página)

    const email = document.querySelector('#email').value;
    const senha = document.querySelector('#senha').value;

    // Realiza a requisição de login
    fetch('/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, senha })
    })
    .then(response => response.json())
    .then(data => {
        if (data.message === 'Login bem-sucedido') {
            // Redireciona para a página principal após login bem-sucedido
            window.location.href = '/';  // Redireciona para a página principal
        } else {
            // Exibe mensagem de erro
            alert(data.message);
        }
    })
    .catch(error => {
        console.error('Erro ao fazer login:', error);
        alert('Ocorreu um erro. Tente novamente.');
    });
});
