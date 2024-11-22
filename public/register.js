document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('#register-form');
  const senhaInput = document.querySelector('#senha');
  const confirmSenhaInput = document.querySelector('#confirm-senha');
  
  // Feedback dos requisitos de senha
  const feedbackLength = document.querySelector('#senha-length');
  const feedbackLetter = document.querySelector('#senha-letter');
  const feedbackNumber = document.querySelector('#senha-number');
  
  // Função de validação da senha
  function validatePassword() {
    const senha = senhaInput.value;

    // Verificar o comprimento mínimo de 8 caracteres
    const lengthValid = senha.length >= 8;
    if (lengthValid) {
      feedbackLength.classList.remove('invalid');
      feedbackLength.classList.add('valid');
    } else {
      feedbackLength.classList.remove('valid');
      feedbackLength.classList.add('invalid');
    }

    // Verificar se contém pelo menos uma letra
    const letterValid = /[a-zA-Z]/.test(senha);
    if (letterValid) {
      feedbackLetter.classList.remove('invalid');
      feedbackLetter.classList.add('valid');
    } else {
      feedbackLetter.classList.remove('valid');
      feedbackLetter.classList.add('invalid');
    }

    // Verificar se contém pelo menos um número
    const numberValid = /\d/.test(senha);
    if (numberValid) {
      feedbackNumber.classList.remove('invalid');
      feedbackNumber.classList.add('valid');
    } else {
      feedbackNumber.classList.remove('valid');
      feedbackNumber.classList.add('invalid');
    }
  }

  // Verifica se as senhas coincidem
  function validateConfirmPassword() {
    const senha = senhaInput.value;
    const confirmSenha = confirmSenhaInput.value;
    
    if (senha !== confirmSenha) {
      confirmSenhaInput.setCustomValidity("As senhas não coincidem.");
    } else {
      confirmSenhaInput.setCustomValidity("");
    }
  }

  // Chama a função de validação toda vez que o usuário digita
  senhaInput.addEventListener('input', validatePassword);
  confirmSenhaInput.addEventListener('input', validateConfirmPassword);

  // Valida a senha ao submeter o formulário
  form.addEventListener('submit', async (e) => {
    e.preventDefault(); // Impede o envio padrão do formulário

    // Coleta os dados do formulário
    const email = document.querySelector('#email').value;
    const username = document.querySelector('#username').value;
    const senha = document.querySelector('#senha').value;
    const confirmSenha = document.querySelector('#confirm-senha').value;

    // Validação da senha
    const senhaRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/; // Mínimo de 8 caracteres, com letras e números
    if (!senhaRegex.test(senha)) {
      alert('A senha deve ter pelo menos 8 caracteres e incluir letras e números.');
      return;
    }

    // Verifica se as senhas coincidem
    if (senha !== confirmSenha) {
      alert('As senhas não coincidem.');
      return;
    }

    // Envia os dados para o servidor
    try {
      const response = await fetch('/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, username, senha })
      });

      // Tenta parsear a resposta como JSON
      const result = await response.json();

      if (response.ok) {
        // Sucesso no registro, redireciona para a página de login
        alert(result.message); // Exibe a mensagem de sucesso
        window.location.href = '/login'; // Redireciona para a página de login
      } else {
        // Se houve erro (ex. email ou username já em uso)
        alert(result.message); // Exibe a mensagem de erro
      }

    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      alert('Erro ao registrar usuário. Tente novamente mais tarde.');
    }
  });
});

document.addEventListener('DOMContentLoaded', () => {
  const senhaInput = document.querySelector('#senha');
  const confirmSenhaInput = document.querySelector('#confirm-senha');
  const toggleSenhaButton = document.querySelector('#toggle-senha');
  const toggleConfirmSenhaButton = document.querySelector('#toggle-confirm-senha');

  // Função para alternar a visibilidade da senha
  function togglePasswordVisibility(input, button) {
    if (input.type === 'password') {
      input.type = 'text';
      button.textContent = '🙈'; // Pode substituir pelo ícone de esconder
    } else {
      input.type = 'password';
      button.textContent = '👁️'; // Ícone de mostrar
    }
  }

  // Adicionando evento de clique para alternar a visibilidade
  toggleSenhaButton.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility(senhaInput, toggleSenhaButton);
  });

  toggleSenhaButton.addEventListener('click', (e) => {
    e.preventDefault();
    togglePasswordVisibility(confirmSenhaInput, toggleConfirmSenhaButton);
  });
});
