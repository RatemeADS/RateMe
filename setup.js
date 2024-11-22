const mysql = require('mysql2');
const express = require('express');
const app = express();

// Conexão com o banco de dados MySQL
const db = mysql.createConnection({
  host: 'localhost',          
  user: 'usuario',            
  password: 'senhausuario',   
  database: 'avaliacoes_db'   
});

// Função para criar a tabela 'categorias'
function createCategoriasTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS categorias (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.query(query, (err) => {
    if (err) console.error('Erro ao criar tabela categorias:', err);
    else console.log('Tabela categorias verificada/criada.');
  });
}

// Função para criar a tabela 'reviews'
function createReviewsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS reviews (
      id INT AUTO_INCREMENT PRIMARY KEY,
      categoria_id INT,
      usuario_id INT,
      titulo VARCHAR(255) NOT NULL,
      comentario TEXT NOT NULL,
      prioridade INT DEFAULT 3 NOT NULL,
      data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      sugestao VARCHAR(255),
      status ENUM('pendente', 'analisado', 'em progresso', 'implementado') DEFAULT 'pendente',
      priority ENUM('Alta', 'Média', 'Baixa') DEFAULT 'Média',  -- coluna priority adicionada
      upvotes INT DEFAULT 0,
      downvotes INT DEFAULT 0,
      FOREIGN KEY (categoria_id) REFERENCES categorias(id),
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    );
  `;
  db.query(query, (err) => {
    if (err) console.error('Erro ao criar tabela reviews:', err);
    else console.log('Tabela reviews verificada/criada.');
  });
}

// Função para criar a tabela 'usuarios'
function createUsuariosTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS usuarios (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha VARCHAR(255) NOT NULL,
      username VARCHAR(255) UNIQUE NOT NULL,
      is_admin BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;
  db.query(query, (err) => {
    if (err) console.error('Erro ao criar tabela usuarios:', err);
    else console.log('Tabela usuarios verificada/criada.');
  });
}

// Função para criar a tabela 'votes'
function createVotesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS votes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      user_id INT NOT NULL,
      review_id INT NOT NULL,
      vote_type ENUM('up', 'down') NOT NULL,
      FOREIGN KEY (user_id) REFERENCES usuarios(id),
      FOREIGN KEY (review_id) REFERENCES reviews(id)
    );
  `;
  db.query(query, (err) => {
    if (err) console.error('Erro ao criar tabela votes:', err);
    else console.log('Tabela votes verificada/criada.');
  });
}

// Função para iniciar a configuração das tabelas
function setupDatabase() {
  createCategoriasTable();
  createUsuariosTable();
  createReviewsTable();
  createVotesTable();
}

// Executa a configuração e fecha a conexão após completar
setupDatabase();
db.end();
