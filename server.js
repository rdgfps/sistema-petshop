const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Dados simulados em memória
let produtos = [
  { id: "101", nome: "Ração para Cães", preco: 50.00, quantidade: 20 },
  { id: "102", nome: "Coleira G", preco: 25.50, quantidade: 15 },
];

app.get('/produtos', (req, res) => {
  res.status(200).json(produtos);
});

app.post('/produtos', (req, res) => {
  const novoProduto = req.body;
  produtos.push(novoProduto);
  res.status(201).json(produtos);
});

app.delete('/produtos/:id', (req, res) => {
  const { id } = req.params;
  produtos = produtos.filter(p => p.id !== id);
  res.status(200).json(produtos);
});

app.put('/produtos/:id', (req, res) => {
  const { id } = req.params;
  const { quantidadeVendida } = req.body;

  const produtoIndex = produtos.findIndex(p => p.id === id);

  if (produtoIndex !== -1) {
    produtos[produtoIndex].quantidade -= quantidadeVendida;
    res.status(200).json(produtos[produtoIndex]);
  } else {
    res.status(404).send('Produto não encontrado.');
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});