const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost', 
  user: 'root',
  password: 'root',
  database: 'oldgoal' 
});

connection.connect((err) => {
  if (err) {
    console.error('Erro de conexão ao banco de dados:', err.stack);
    return;
  }
  console.log('Conectado ao banco de dados');
});

module.exports = connection;