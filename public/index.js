function deleteCategory(id) {
    fetch(`/delete-category/${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    })
    .then(response => {
      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Erro ao deletar a categoria.');
      }
    })
    .catch(error => console.error('Erro:', error));
  }
  
  // Função para verificar se o título da categoria já existe
function checkDuplicateCategory() {
    const newCategoryTitle = document.getElementById('title').value.trim();
    const existingCategories = document.querySelectorAll('.categoria-box p');
    for (let category of existingCategories) {
      if (category.innerText.trim().toLowerCase() === newCategoryTitle.toLowerCase()) {
        alert('Já existe uma categoria com esse título.');
        return false; // Impede o envio do formulário
      }
    }
    return true;
  }
  