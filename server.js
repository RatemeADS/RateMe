const express = require('express');
const mysql = require('mysql2');
const path = require('path');
const bcrypt = require('bcryptjs');
const session = require('express-session');
const jwt = require('jsonwebtoken');
const app = express();
const port = 3000;
const secretKey = 'sua_chave_secreta';
const nodemailer = require('nodemailer');



// Conexão com o MySQL
const db = mysql.createConnection({
  host: 'localhost',
  user: 'usuario',
  password: 'senhausuario',
  database: 'avaliacoes_db'
});

const transporter = nodemailer.createTransport({
  service: 'gmail', 
  auth: {
    user: 'ratemeapp.status@gmail.com',
    pass: 'jlsk moqa zihs ttzz'
  }
});

const verificarToken = (req, res, next) => {
  const token = req.header('Authorization').replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: 'Acesso negado' });

  try {
    const decoded = jwt.verify(token, secretKey);
    req.usuarioId = decoded.id;
    req.isAdmin = decoded.is_admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
};

db.connect((err) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    return;
  }
  console.log('Conectado ao banco de dados MySQL');
});

const verificarAdmin = (req, res, next) => {
  if (!req.session.usuarioId || !req.session.isAdmin) {
    return res.status(403).json({ error: 'Acesso negado: apenas administradores podem realizar esta ação.' });
  }
  next();
};

function enviarEmailNotificacao(email, status, titulo, username) {
  const mailOptions = {
    from: 'ratemeapp.status@gmail.com',
    to: email,
    subject: `Feedback "${titulo}" foi atualizado para o status: ${status}`,
    text: `Olá ${username}, o status da sua avaliação "${titulo}" foi atualizado para: ${status}.`
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Erro ao enviar e-mail:', error);
    } else {
      console.log('E-mail enviado: ' + info.response);
    }
  });
}

// Configuração da sessão
app.use(session({
  secret: 'segredo',  // Substitua por uma chave secreta única
  resave: false,  // Evita salvar a sessão se ela não for modificada
  saveUninitialized: true,  // Salva uma sessão não inicializada
  cookie: {
    maxAge: 1000 * 60 * 60 * 2,  // Tempo de expiração do cookie: 2 horas
    secure: false,  
    httpOnly: true,  // Impede que o cookie seja acessado por JavaScript no cliente (protege contra XSS)
    sameSite: 'strict',  // Evita o envio do cookie em requisições cross-site (protege contra CSRF)
  }
}));

// Middleware para parsing do corpo das requisições
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Serve arquivos estáticos da pasta 'public'
app.use(express.static(path.join(__dirname, 'public')));

// Configuração do EJS como mecanismo de visualização
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração da sessão
app.use(session({
  secret: 'seu_seguro_segredo',  // Substitua por uma chave secreta única
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }  // Defina como true se estiver usando HTTPS
}));

// Middleware para verificar se o usuário está logado
const verificarLogin = (req, res, next) => {
  if (!req.session.usuarioId) {
    return res.redirect('/login');  // Redireciona para a página de login caso não esteja logado
  }
  next();
};

// Rota para a página inicial que exibe categorias
app.get('/', (req, res) => {
  const query = 'SELECT * FROM categorias ORDER BY title ASC';

  db.query(query, (err, categorias) => {
    if (err) {
      console.error('Erro ao carregar categorias:', err);
      return res.status(500).send('Erro ao carregar categorias');
    }

    // Verifica se o usuário está logado e se é administrador
    const user = req.session.usuarioId ? { 
      id: req.session.usuarioId, 
      is_admin: req.session.isAdmin || false  
    } : null;

    res.render('index', { 
      categorias, 
      user 
    });
  });
});


// Rota para login
app.get('/login', (req, res) => {
  res.render('login');
});

// Rota para registro
app.get('/register', (req, res) => {
  res.render('register');
});

// Rota para processar login
app.post('/login', (req, res) => {
  const { email, senha } = req.body;

  // Consulta ao banco de dados para verificar o usuário
  const query = 'SELECT * FROM usuarios WHERE email = ?';
  db.query(query, [email], (err, results) => {
    if (err) {
      console.error('Erro ao verificar o usuário:', err);
      return res.status(500).json({ message: 'Erro ao verificar o usuário' });
    }

    // Verifica se o usuário foi encontrado
    if (results.length === 0) {
      return res.status(401).json({ message: 'Email ou senha incorretos' });
    }

    const user = results[0];
    
    // Comparação da senha usando bcrypt
    bcrypt.compare(senha, user.senha, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: 'Email ou senha incorretos' });
      }

      // Gerar o token após a autenticação bem-sucedida
      const token = jwt.sign({ id: user.id, is_admin: user.is_admin }, secretKey, { expiresIn: '2h' });

      // Definir as variáveis de sessão, incluindo o status de administrador
      req.session.usuarioId = user.id;
      req.session.email = user.email;
      req.session.isAdmin = user.is_admin;

      // Retorna o token para o frontend
      res.json({ message: 'Login bem-sucedido', token });
    });
  });
});

// Rota para processar registro
app.post('/register', (req, res) => {
  const { email, username, senha } = req.body;

  // Verificar se o email ou o username já existem
  const checkQuery = 'SELECT * FROM usuarios WHERE email = ? OR username = ?';
  db.query(checkQuery, [email, username], (err, results) => {
    if (err) {
      console.error('Erro ao verificar email ou username:', err);
      return res.status(500).json({ message: 'Erro ao verificar email ou username' });
    }

    if (results.length > 0) {
      return res.status(400).json({ message: 'Email ou username já estão em uso' });
    }

    // Criptografar a senha
    bcrypt.hash(senha, 10, (err, hashedPassword) => {
      if (err) {
        console.error('Erro ao criptografar a senha:', err);
        return res.status(500).json({ message: 'Erro ao criptografar a senha' });
      }

      // Inserir o novo usuário no banco de dados
      const insertQuery = 'INSERT INTO usuarios (email, username, senha) VALUES (?, ?, ?)';
      db.query(insertQuery, [email, username, hashedPassword], (err, results) => {
        if (err) {
          console.error('Erro ao registrar usuário:', err);
          return res.status(500).json({ message: 'Erro ao registrar usuário' });
        }

        res.status(200).json({ message: 'Usuário registrado com sucesso!' });
      });
    });
  });
});

// Rota para logout (remover a sessão)
app.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).send('Erro ao fazer logout');
    }
    res.redirect('/'); 
  });
});

app.post('/add-category', (req, res) => {
  const { title } = req.body;

  const checkQuery = 'SELECT * FROM categorias WHERE title = ?';
  db.query(checkQuery, [title], (err, existingCategory) => {
    if (err) {
      console.error('Erro ao verificar categoria:', err);
      return res.status(500).send('Erro ao verificar categoria');
    }

    if (existingCategory.length > 0) {
      // Se encontrar uma categoria com o mesmo título
      return res.render('index', { 
        errorMessage: 'Já existe uma categoria com esse título.',
        categorias: existingCategory
      });
    }

    const insertQuery = 'INSERT INTO categorias (title) VALUES (?)';
    db.query(insertQuery, [title], (err, result) => {
      if (err) {
        console.error('Erro ao adicionar categoria:', err);
        return res.status(500).send('Erro ao adicionar categoria');
      }
      res.redirect('/'); // Redireciona para a página inicial
    });
  });
});

// Rota para deletar uma classe
app.post('/delete-category/:id', (req, res) => {
  if (!req.session.isAdmin) {
    return res.status(403).send('Acesso negado');
  }

  const query = 'DELETE FROM categorias WHERE id = ?';
  db.query(query, [req.params.id], (err) => {
    if (err) {
      console.error('Erro ao deletar categoria:', err);
      return res.status(500).send('Erro ao deletar categoria');
    }
    res.redirect('/');
  });
});

// Rota para exibir a página de adicionar review
app.get('/add-review/:categoriaId', verificarLogin, (req, res) => {
    const categoriaId = req.params.categoriaId;  // Obtém o ID da categoria da URL
    
    // Consultar informações da categoria para garantir que a categoria existe
    const query = 'SELECT * FROM categorias WHERE id = ?';
    db.query(query, [categoriaId], (err, results) => {
      if (err) {
        console.error('Erro ao carregar categoria:', err);
        return res.status(500).send('Erro ao carregar categoria');
      }
  
      if (results.length === 0) {
        return res.status(404).send('Categoria não encontrada');
      }
  
      const categoria = results[0];
      res.render('add-review', { categoria });  // Passa a categoria para a página de review
    });
  });
  
  // Rota para processar o formulário de review
  app.post('/submit-review/:categoriaId', verificarLogin, (req, res) => {
    const { titulo, comentario, sugestao} = req.body; 
    const categoriaId = req.params.categoriaId;
    const usuarioId = req.session.usuarioId;
    const status = 'pendente'; 
  
    const query = `
      INSERT INTO reviews (categoria_id, usuario_id, titulo, comentario, sugestao, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `;
  
    db.query(query, [categoriaId, usuarioId, titulo, comentario, sugestao, status], (err, results) => {
      if (err) {
        console.error('Erro ao adicionar review:', err.message);
        return res.status(500).send('Erro ao adicionar review');
      }
  
      console.log('Review adicionada com sucesso!');
      res.redirect(`/category/${categoriaId}`); // Redireciona para a página da categoria
    });
  });
  

  const query = 'DELETE FROM reviews WHERE id = ?';

  // Rota para deletar uma avaliação
  app.delete('/delete-review/:id', verificarAdmin, (req, res) => {
    const reviewId = req.params.id;  // ID da avaliação a ser deletada
    const categoriaId = req.body.categoriaId;  // ID da categoria, passado pelo frontend
  
    // Primeiro, exclui os votos associados à avaliação
    const deleteVotesQuery = 'DELETE FROM votes WHERE review_id = ?';
  
    db.query(deleteVotesQuery, [reviewId], (err) => {
      if (err) {
        console.error('Erro ao excluir votos:', err.message);
        return res.status(500).send('Erro ao excluir votos');
      }
  
      // Após excluir os votos, exclui a avaliação
      const deleteReviewQuery = 'DELETE FROM reviews WHERE id = ?';
  
      db.query(deleteReviewQuery, [reviewId], (err, results) => {
        if (err) {
          console.error('Erro ao excluir review:', err.message);
          return res.status(500).send('Erro ao excluir review');
        }
  
        // Verifica se a avaliação foi excluída com sucesso
        if (results.affectedRows === 0) {
          return res.status(404).send('Avaliação não encontrada');
        }
  
        // Recarregar a categoria e as avaliações atualizadas
        const categoriaQuery = 'SELECT * FROM categorias WHERE id = ?';
        const reviewsQuery = 'SELECT * FROM reviews WHERE categoria_id = ?';
  
        db.query(categoriaQuery, [categoriaId], (err, categoriaResults) => {
          if (err) {
            console.error('Erro ao buscar categoria:', err.message);
            return res.status(500).send('Erro ao buscar categoria');
          }
  
          db.query(reviewsQuery, [categoriaId], (err, reviewResults) => {
            if (err) {
              console.error('Erro ao buscar avaliações:', err.message);
              return res.status(500).send('Erro ao buscar avaliações');
            }
  
            // Retorna os dados atualizados
            res.json({
              success: true,
              categoria: categoriaResults[0],
              reviews: reviewResults,
            });
          });
        });
      });
    });
  });  

// Rota para exibir as informações da categoria e suas avaliações
app.get('/category/:id', (req, res) => {
  const categoriaId = req.params.id;

  // Buscar os dados da categoria
  const getCategoria = 'SELECT * FROM categorias WHERE id = ?';

  db.query(getCategoria, [categoriaId], (err, categoriaResults) => {
    if (err) {
      console.error('Erro ao buscar categoria:', err.message);
      return res.status(500).send('Erro ao buscar categoria');
    }

    const categoria = categoriaResults[0];

    // Buscar as avaliações relacionadas à categoria
    const getAvaliacoes = `
      SELECT reviews.*, usuarios.username 
      FROM reviews
      JOIN usuarios ON reviews.usuario_id = usuarios.id
      WHERE reviews.categoria_id = ?`;

    db.query(getAvaliacoes, [categoriaId], (err, reviewResults) => {
      if (err) {
        console.error('Erro ao buscar avaliações:', err.message);
        return res.status(500).send('Erro ao buscar avaliações');
      }

      // Verifica se o usuário está logado e se é administrador
      const user = req.session.usuarioId ? {
        id: req.session.usuarioId,
        is_admin: req.session.isAdmin || false
      } : null;

      // Renderiza a página da categoria com suas avaliações
      res.render('category-detail', { categoria, reviews: reviewResults, user });
    });
  });
});

app.get('/admin', verificarAdmin, (req, res) => {
  const queryCategorias = 'SELECT * FROM categorias';
  const queryAvaliacoes = 'SELECT * FROM reviews';
  const queryUsuarios = 'SELECT * FROM usuarios';  // Adicionando a consulta para usuários

  // Buscar categorias
  db.query(queryCategorias, (err, categorias) => {
    if (err) {
      console.error('Erro ao buscar categorias:', err.message);
      return res.status(500).send('Erro ao buscar categorias');
    }

    // Buscar avaliações
    db.query(queryAvaliacoes, (err, reviews) => {
      if (err) {
        console.error('Erro ao buscar avaliações:', err.message);
        return res.status(500).send('Erro ao buscar avaliações');
      }

      // Buscar usuários
      db.query(queryUsuarios, (err, usuarios) => {
        if (err) {
          console.error('Erro ao buscar usuários:', err.message);
          return res.status(500).send('Erro ao buscar usuários');
        }

        // Associar o nome da categoria à avaliação
        reviews = reviews.map(review => {
          const categoria = categorias.find(c => c.id === review.categoria_id);
          review.categoria_nome = categoria ? categoria.title : 'Categoria não encontrada';
          return review;
        });

        // Passa os dados para o frontend
        res.render('adm', { reviews, categorias, usuarios });
      });
    });
  });
});



// Rota para processar comandos SQL
app.post('/execute-sql', verificarAdmin, (req, res) => {
  const { sqlCommand } = req.body;

  // Verifica se o comando SQL não está vazio
  if (!sqlCommand || sqlCommand.trim() === "") {
    return res.status(400).json({ error: 'Comando SQL inválido ou vazio' });
  }

  // Executa o comando SQL
  db.query(sqlCommand, (err, result) => {
    if (err) {
      console.error('Erro ao executar o comando SQL:', err.message);
      return res.status(500).json({ error: 'Erro ao executar o comando SQL' });
    }
    
    // Retorna o resultado do comando
    res.json({ message: 'Comando executado com sucesso', result });
  });
});

// Rota para listar os usuários
app.get('/api/users', (req, res) => {
  const query = 'SELECT * FROM usuarios';
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuários:', err.message);
      return res.status(500).json({ error: 'Erro ao buscar usuários' });
    }
    res.json(results);  // Retorna a lista de usuários como JSON
  });
});

// Rota para atualizar o status
app.post('/update-status-review/:reviewId', verificarAdmin, (req, res) => {
  const { reviewId } = req.params;
  const { status } = req.body;

  console.log(`Atualizando status da review ${reviewId} para: ${status}`);

  const query = 'UPDATE reviews SET status = ? WHERE id = ?';

  db.query(query, [status, reviewId], (err, result) => {
    if (err) {
      console.error('Erro ao atualizar status:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar status' });
    }

    // Busca o e-mail, título e nome do usuário para notificação
    db.query('SELECT email, titulo, username FROM reviews INNER JOIN usuarios ON reviews.usuario_id = usuarios.id WHERE reviews.id = ?', [reviewId], (error, results) => {
      if (error) {
        console.error('Erro ao buscar e-mail do usuário:', error.message);
      } else if (results.length > 0) {
        const { email, titulo, username } = results[0]; // Agora utilizando 'username'
        console.log("Nome de usuário:", username); // Verifique o valor de 'username'
        enviarEmailNotificacao(email, status, titulo, username); // Passando 'username' para a função
      }
    });

    console.log(`Status da review ${reviewId} atualizado para ${status}`);
    res.json({ message: 'Status atualizado com sucesso' });
  });
});

// Rota POST para votar
app.post('/vote/:reviewId', verificarLogin, (req, res) => {
  const { reviewId } = req.params;  // ID da avaliação
  const userId = req.session.usuarioId; // ID do usuário logado
  const { voteType } = req.body;    // 'up' ou 'down'

  console.log(`Recebendo voto para a review ${reviewId} do usuário ${userId} com tipo ${voteType}`);

  // Verifica se o voto é válido (up ou down)
  if (voteType !== 'up' && voteType !== 'down') {
    return res.status(400).json({ error: 'Voto inválido. Use "up" ou "down".' });
  }

  // Verifica se o usuário já votou nesta avaliação
  const queryCheckVote = 'SELECT * FROM votes WHERE user_id = ? AND review_id = ?';
  db.query(queryCheckVote, [userId, reviewId], (err, results) => {
    if (err) {
      console.error('Erro ao verificar voto:', err);
      return res.status(500).json({ error: 'Erro ao verificar voto' });
    }

    if (results.length > 0) {
      // Se o usuário já votou, permite mudar o voto
      const currentVoteType = results[0].vote_type;

      // Se o voto atual for diferente do novo voto, altera o voto
      if (currentVoteType !== voteType) {
        // Atualiza o voto na tabela 'votes'
        const queryUpdateVote = 'UPDATE votes SET vote_type = ? WHERE user_id = ? AND review_id = ?';
        db.query(queryUpdateVote, [voteType, userId, reviewId], (err) => {
          if (err) {
            console.error('Erro ao atualizar voto:', err);
            return res.status(500).json({ error: 'Erro ao atualizar voto' });
          }

          // Atualiza a contagem de votos na tabela 'reviews'
          const updateVoteCount = voteType === 'up' 
            ? 'upvotes = upvotes + 1, downvotes = downvotes - 1' 
            : 'upvotes = upvotes - 1, downvotes = downvotes + 1';
          const queryUpdateReview = `UPDATE reviews SET ${updateVoteCount} WHERE id = ?`;
          db.query(queryUpdateReview, [reviewId], (err) => {
            if (err) {
              console.error('Erro ao atualizar contagem de votos:', err);
              return res.status(500).json({ error: 'Erro ao atualizar contagem de votos' });
            }

            res.json({ success: true, message: 'Voto alterado com sucesso', voteChanged: true });
          });
        });
      } else {
        return res.status(400).json({ error: 'Você já votou com esse tipo', voteChanged: false });
      }
    } else {
      // Se o usuário ainda não votou, registra o novo voto
      const queryInsertVote = 'INSERT INTO votes (user_id, review_id, vote_type) VALUES (?, ?, ?)';
      db.query(queryInsertVote, [userId, reviewId, voteType], (err) => {
        if (err) {
          console.error('Erro ao registrar voto:', err);
          return res.status(500).json({ error: 'Erro ao registrar voto' });
        }

        // Atualiza a contagem de votos na tabela 'reviews'
        const updateVoteCount = voteType === 'up' 
          ? 'upvotes = upvotes + 1' 
          : 'downvotes = downvotes + 1';
        const queryUpdateReview = `UPDATE reviews SET ${updateVoteCount} WHERE id = ?`;
        db.query(queryUpdateReview, [reviewId], (err) => {
          if (err) {
            console.error('Erro ao atualizar contagem de votos:', err);
            return res.status(500).json({ error: 'Erro ao atualizar contagem de votos' });
          }

          res.json({ success: true, message: 'Voto registrado com sucesso', voteChanged: false });
        });
      });
    }
  });
});

app.post('/update-priority/:reviewId', (req, res) => {
  const { reviewId } = req.params;
  const { prioridade } = req.body;

  // Verifica se a prioridade está em um dos valores permitidos
  const prioridadesPermitidas = ['Alta', 'Média', 'Baixa'];
  if (!prioridadesPermitidas.includes(prioridade)) {
    return res.status(400).json({ error: 'Prioridade inválida' });
  }

  // Atualiza a prioridade no banco de dados
  const query = 'UPDATE reviews SET priority = ? WHERE id = ?';
  
  db.query(query, [prioridade, reviewId], (err, results) => {
    if (err) {
      console.error('Erro ao atualizar prioridade:', err);
      return res.status(500).json({ error: 'Erro ao atualizar prioridade' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Avaliação não encontrada' });
    }

    console.log('Prioridade atualizada:', { reviewId, prioridade });
    res.json({ success: true, message: 'Prioridade atualizada com sucesso' });
  });
});

// Rota para buscar as avaliações e associar as categorias
app.get('/reviews', (req, res) => {
  const order = req.query.order || 'asc'; // Definir a ordem de ordenação (ascendente ou descendente)
  const statusFilter = req.query.status || ''; // Filtro de status das avaliações
  const orderBy = req.query.order_by || 'data_criacao'; // Define qual campo usar para ordenar as avaliações (por padrão, 'data_criacao')

  const queryCategorias = 'SELECT * FROM categorias';
  const queryAvaliacoes = 'SELECT * FROM reviews';

  db.query(queryCategorias, (err, categorias) => {
    if (err) {
      console.error('Erro ao buscar categorias:', err.message);
      return res.status(500).send({ error: 'Erro ao buscar categorias' });
    }

    db.query(queryAvaliacoes, (err, reviews) => {
      if (err) {
        console.error('Erro ao buscar avaliações:', err.message);
        return res.status(500).send({ error: 'Erro ao buscar avaliações' });
      }

      // Associa o nome da categoria à avaliação
      reviews = reviews
        .map(review => {
          const categoria = categorias.find(c => c.id === review.categoria_id);
          review.categoria_nome = categoria ? categoria.title : 'Categoria não encontrada';
          return review;
        })
        .filter(review => {
          // Aplica o filtro de status se estiver definido
          return statusFilter ? review.status === statusFilter : true;
        });

      // Ordena as avaliações conforme o critério de ordenação
      reviews.sort((a, b) => {
        const priorityOrder = { 'Alta': 1, 'Média': 2, 'Baixa': 3 };
        const priorityA = priorityOrder[a.priority] || 2;
        const priorityB = priorityOrder[b.priority] || 2;

        // Ordenação por data, votos ou prioridade
        if (orderBy === 'data_criacao') {
          // Ordena por data de criação
          const dateA = new Date(a.data_criacao);
          const dateB = new Date(b.data_criacao);
          return order === 'asc' ? dateA - dateB : dateB - dateA;
        } else if (orderBy === 'upvotes') {
          // Ordena por número de upvotes
          return order === 'asc' ? a.upvotes - b.upvotes : b.upvotes - a.upvotes;
        } else if (orderBy === 'prioridade') {
          // Ordena por prioridade
          return order === 'asc' ? priorityA - priorityB : priorityB - priorityA;
        }

        // Caso o parâmetro de ordenação seja algo inesperado, ordena por data como fallback
        const dateA = new Date(a.data_criacao);
        const dateB = new Date(b.data_criacao);
        return order === 'asc' ? dateA - dateB : dateB - dateA;
      });

      res.json(reviews);
    });
  });
});


// Rota para buscar categorias diretamente
app.get('/categorias', (req, res) => {
  db.query('SELECT * FROM categorias', (err, result) => {
    if (err) {
      console.error('Erro ao buscar categorias:', err.message);
      return res.status(500).send({ error: 'Erro ao buscar categorias' });
    }
    res.json(result);
  });
});

// Rota para alterar o padrão de is_admin
app.post('/alterar-is-admin',verificarAdmin, (req, res) => {
  const query = `ALTER TABLE usuarios ALTER COLUMN is_admin SET DEFAULT 0;`;

  db.query(query, (err) => {
    if (err) {
      console.error('Erro ao alterar o padrão de is_admin:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar o padrão de is_admin.' });
    }
    res.json({ message: 'O padrão de is_admin foi alterado para FALSE com sucesso.' });
  });
});

// Rota para alterar o padrão de is_admin
app.post('/alterar-is-admin-true',verificarAdmin, (req, res) => {
  const query = `ALTER TABLE usuarios ALTER COLUMN is_admin SET DEFAULT 1;`;

  db.query(query, (err) => {
    if (err) {
      console.error('Erro ao alterar o padrão de is_admin:', err.message);
      return res.status(500).json({ error: 'Erro ao atualizar o padrão de is_admin.' });
    }
    res.json({ message: 'O padrão de is_admin foi alterado para TRUE com sucesso.' });
  });
});

// Iniciar o servidor
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});