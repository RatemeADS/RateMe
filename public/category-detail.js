document.addEventListener('DOMContentLoaded', () => {
  // Função para votar na avaliação
  const voteButtons = document.querySelectorAll('.vote-btn');

  voteButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const reviewId = event.target.getAttribute('data-review-id'); // ID da avaliação
      const voteType = event.target.getAttribute('data-vote-type'); // 'up' ou 'down'

      console.log(`Votando na review ${reviewId} com tipo ${voteType}`);

      try {
        const response = await fetch(`/vote/${reviewId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ voteType })  // Enviando 'up' ou 'down'
        });

        const text = await response.text();  // Captura a resposta como texto
        console.log('Resposta do servidor:', text);  // Exibe a resposta para depuração

        if (!response.ok) {
          throw new Error(text || 'Erro ao registrar voto');
        }

        const data = JSON.parse(text);  // Agora tenta converter o texto para JSON
        console.log('Resposta do servidor (JSON):', data);

        // Se a resposta for bem-sucedida, atualiza os contadores
        const upvoteCount = document.getElementById(`upvotes-${reviewId}`);
        const downvoteCount = document.getElementById(`downvotes-${reviewId}`);
        
        // Atualiza os contadores dependendo do tipo de voto
        if (data.voteChanged === false) {
          // Novo voto, só incrementa
          if (voteType === 'up') {
            upvoteCount.innerText = parseInt(upvoteCount.innerText) + 1;
          } else if (voteType === 'down') {
            downvoteCount.innerText = parseInt(downvoteCount.innerText) + 1;
          }
        } else {
          // Voto alterado, ajusta os contadores
          if (voteType === 'up') {
            upvoteCount.innerText = parseInt(upvoteCount.innerText) + 1;
            downvoteCount.innerText = parseInt(downvoteCount.innerText) - 1;
          } else if (voteType === 'down') {
            downvoteCount.innerText = parseInt(downvoteCount.innerText) + 1;
            upvoteCount.innerText = parseInt(upvoteCount.innerText) - 1;
          }
        }
      } catch (err) {
        console.error('Erro ao registrar voto:', err);
        alert(`Erro ao registrar voto: ${err.message}`);
      }
    });
  });

  // Função para excluir avaliação
  const deleteButtons = document.querySelectorAll('.delete-review-btn');

  deleteButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const reviewId = event.target.getAttribute('data-review-id');
      const categoriaId = event.target.getAttribute('data-categoria-id');
      
      // Confirmação para excluir
      const confirmDelete = confirm('Tem certeza que deseja excluir esta avaliação?');
      if (!confirmDelete) return;

      try {
        const response = await fetch(`/delete-review/${reviewId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ categoriaId }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          // Atualiza a página removendo a avaliação excluída
          const reviewElement = document.querySelector(`#review-${reviewId}`);
          reviewElement.remove(); // Remove o item da lista
          alert('Avaliação excluída com sucesso!');
        } else {
          throw new Error(data.error || 'Erro ao excluir avaliação!');
        }
      } catch (err) {
        console.error('Erro ao excluir avaliação:', err);
        alert('Erro ao excluir avaliação!');
      }
    });
  });

  // Função para atualizar status da avaliação
  const updateButtons = document.querySelectorAll('.update-status-btn');

  updateButtons.forEach(button => {
    button.addEventListener('click', async (event) => {
      const reviewId = button.getAttribute('data-review-id');
      const statusSelect = document.querySelector(`#status-${reviewId}`);
      const newStatus = statusSelect.value;

      try {
        const response = await fetch(`/update-status-review/${reviewId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ status: newStatus })
        });

        if (!response.ok) {
          throw new Error('Erro ao atualizar o status');
        }

        const data = await response.json();
        alert("Status atualizado com sucesso!");
        location.reload(); // Recarrega a página após a atualização
      } catch (error) {
        console.error("Erro:", error);
        alert("Erro ao atualizar o status.");
      }
    });
  });
});

document.querySelectorAll('.update-priority-btn').forEach(button => {
  button.addEventListener('click', (event) => {
    const reviewId = event.target.getAttribute('data-review-id');
    const priority = document.getElementById(`priority-${reviewId}`).value;

    // Envia a solicitação para o servidor para atualizar a prioridade
    fetch(`/update-priority/${reviewId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prioridade: priority })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Prioridade atualizada com sucesso');

        // Atualiza a prioridade na interface sem recarregar a página
        const reviewElement = document.querySelector(`#review-${reviewId}`);
        const prioridadeElement = reviewElement.querySelector('.priority');
        
        if (prioridadeElement) {
          prioridadeElement.innerText = priority;
        }
      } else {
        alert('Erro ao atualizar prioridade');
      }
    })
    .catch(error => {
      console.error('Erro:', error);
      alert('Erro ao atualizar prioridade');
    });
  });
});
