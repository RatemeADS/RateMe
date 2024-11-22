document.getElementById('sql-form').addEventListener('submit', function (event) {
    event.preventDefault();
    
    const sqlCommand = document.getElementById('sqlCommand').value;
  
    fetch('/execute-sql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ sqlCommand })
    })
    .then(response => response.json())
    .then(data => {
      const resultDiv = document.getElementById('result');
      if (data.error) {
        resultDiv.textContent = `Erro: ${data.error}`;
      } else {
        resultDiv.textContent = `Resultado: ${JSON.stringify(data.result)}`;
      }
    })
    .catch(error => console.error('Erro ao executar comando SQL:', error));
  });  

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      const text = await response.text(); 
  
      try {
        const users = JSON.parse(text);  
        const tableBody = document.querySelector('#usuarios-table tbody');
        tableBody.innerHTML = '';  
  
        users.forEach(user => {
          const row = document.createElement('tr');
          row.innerHTML = `
            <td>${user.id}</td>
            <td>${user.email}</td>
            <td>${user.username}</td>
            <td>${user.is_admin ? 'Sim' : 'Não'}</td>
          `;
          tableBody.appendChild(row);
        });
      } catch (error) {
        console.error('Erro ao converter resposta para JSON:', error);
        console.log('Resposta recebida:', text);  
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };
  
  window.onload = loadUsers;
  
  document.addEventListener('DOMContentLoaded', () => {
    const reviewsTableBody = document.getElementById('reviews-table').querySelector('tbody');
    const orderByPriority = document.getElementById('order-by-priority');
    const orderByStatus = document.getElementById('order-by-status');
    
    if (!orderByPriority || !orderByStatus) {
      console.error('Os elementos de ordenação não foram encontrados no DOM');
      return;  
    }
  
    function renderReviews(reviews, order) {
      const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
    
      reviews.sort((a, b) => {
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;
        return order === 'desc' ? priorityB - priorityA : priorityA - priorityB;
      });
    
      reviewsTableBody.innerHTML = '';
    
      reviews.forEach(review => {
        const row = document.createElement('tr');
        row.innerHTML = `
          <td>${review.id}</td>
          <td>${review.categoria_nome || 'Categoria desconhecida'}</td>
          <td>${review.titulo}</td>
          <td>${review.comentario}</td>
          <td>${review.priority}</td>
          <td>
            <select class="status-select" data-review-id="${review.id}">
              <option value="pendente" ${review.status === 'pendente' ? 'selected' : ''}>Pendente</option>
              <option value="analisado" ${review.status === 'analisado' ? 'selected' : ''}>Analisado</option>
              <option value="em progresso" ${review.status === 'em progresso' ? 'selected' : ''}>Em Progresso</option>
              <option value="implementado" ${review.status === 'implementado' ? 'selected' : ''}>Implementado</option>
            </select>
          </td>
          <td>
            <button class="delete-review-btn" data-review-id="${review.id}" data-categoria-id="${review.categoria_id}">Excluir</button>
          </td>
        `;
        reviewsTableBody.appendChild(row);
      });
    
      document.querySelectorAll('.status-select').forEach(select => {
        select.addEventListener('change', function() {
          const reviewId = this.getAttribute('data-review-id');
          const status = this.value;
    
          fetch(`/update-status-review/${reviewId}`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
          })
          .then(response => response.json())
          .then(data => {
            if (data.error) {
              console.error('Erro ao atualizar status:', data.error);
              alert('Erro ao atualizar status');
            } else {
              console.log('Status atualizado com sucesso');
            }
          })
          .catch(error => console.error('Erro na solicitação:', error));
        });
      });
    }

    
    function fetchReviews() {
      const priorityOrder = orderByPriority.value;
      const statusFilter = orderByStatus.value;
    
      const queryParams = new URLSearchParams({
        order: priorityOrder,
        status: statusFilter
      }).toString();
    
      fetch(`/reviews?${queryParams}`)
        .then(response => response.json())
        .then(data => {
          renderReviews(data, priorityOrder);
        })
        .catch(error => console.error('Erro ao carregar avaliações:', error));
    }
  
    fetchReviews();
  
    orderByPriority.addEventListener('change', fetchReviews);
    orderByStatus.addEventListener('change', fetchReviews);
  });

  document.getElementById('alterarIsAdminBtn').addEventListener('click', async () => {
    try {
      const response = await fetch('/alterar-is-admin', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' } 
      });
      if (!response.ok) throw new Error('Erro ao enviar a requisição');
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Erro ao alterar o padrão de is_admin:', error);
      alert('Erro ao alterar o padrão de is_admin.');
    }
  });

  document.getElementById('alterarIsAdminBtn2').addEventListener('click', async () => {
    try {
      const response = await fetch('/alterar-is-admin-true', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' } 
      });
      if (!response.ok) throw new Error('Erro ao enviar a requisição');
      const data = await response.json();
      alert(data.message);
    } catch (error) {
      console.error('Erro ao alterar o padrão de is_admin:', error);
      alert('Erro ao alterar o padrão de is_admin.');
    }
  });

  document.querySelector('#reviews-table tbody').addEventListener('click', function(event) {
    // Verifica se o clique foi no botão de exclusão
    if (event.target && event.target.classList.contains('delete-review-btn')) {
      const reviewId = event.target.getAttribute('data-review-id');
      const categoriaId = event.target.getAttribute('data-categoria-id');
      
      fetch(`/delete-review/${reviewId}?categoriaId=${categoriaId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        return response.json(); 
      })
      .then(data => {
        if (data.success) {
          alert('Avaliação excluída com sucesso');
          location.reload();
        }
      })
    }
  });
  