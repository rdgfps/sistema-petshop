import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3001/produtos";

function App() {
  const [produtos, setProdutos] = useState([]);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [codigoBarras, setCodigoBarras] = useState("");
  
  const [termoBusca, setTermoBusca] = useState("");
  const [sugestoes, setSugestoes] = useState([]);
  
  const [venda, setVenda] = useState({
    qtd: "",
    desconto: "",
    tipoDesconto: "valor",
  });
  
  const [carrinho, setCarrinho] = useState([]);
  const [resultado, setResultado] = useState(null);

  useEffect(() => {
    fetch(API_URL)
      .then((response) => response.json())
      .then((data) => setProdutos(data))
      .catch((error) => console.error("Erro ao buscar produtos:", error));
  }, []);

  const adicionarProduto = async (e) => {
    e.preventDefault();
    if (!nome || !preco || !quantidade || !codigoBarras) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const novoProduto = {
      id: codigoBarras,
      nome,
      preco: parseFloat(preco),
      quantidade: parseInt(quantidade),
    };

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novoProduto),
      });

      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
        setNome("");
        setPreco("");
        setQuantidade("");
        setCodigoBarras("");
      } else {
        alert("Erro ao adicionar produto.");
      }
    } catch (error) {
      console.error("Erro de rede:", error);
      alert("Erro de conexão com o servidor.");
    }
  };

  const excluirProduto = async (id) => {
    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const data = await response.json();
        setProdutos(data);
      } else {
        alert("Erro ao excluir produto.");
      }
    } catch (error) {
      console.error("Erro de rede:", error);
    }
  };

  const handleTermoBuscaChange = (e) => {
    const termo = e.target.value;
    setTermoBusca(termo);
    
    if (termo.length > 0) {
      const termoLowerCase = termo.toLowerCase();
      const produtosFiltrados = produtos.filter(p =>
        p.nome.toLowerCase().includes(termoLowerCase) || p.id.toLowerCase().includes(termoLowerCase)
      );
      setSugestoes(produtosFiltrados);
    } else {
      setSugestoes([]);
    }
  };

  const selecionarSugestao = (produto) => {
    setTermoBusca(produto.nome);
    setSugestoes([]);
  };

  const adicionarAoCarrinho = (e) => {
    e.preventDefault();
    
    const termo = termoBusca.toLowerCase();
    const produtoEncontrado = produtos.find((p) => 
      p.id === termo || p.nome.toLowerCase() === termo
    );
    
    if (!produtoEncontrado) {
      alert("Produto não encontrado. Selecione da lista de sugestões ou digite o nome completo.");
      return;
    }

    const qtdVenda = parseInt(venda.qtd);
    if (!qtdVenda || qtdVenda <= 0) {
      alert("Por favor, insira uma quantidade válida.");
      return;
    }

    if (qtdVenda > produtoEncontrado.quantidade) {
      alert("Quantidade em estoque insuficiente!");
      return;
    }

    const itemNoCarrinho = carrinho.find(item => item.id === produtoEncontrado.id);
    
    if (itemNoCarrinho) {
      const novoCarrinho = carrinho.map(item =>
        item.id === produtoEncontrado.id 
          ? { ...item, qtd: item.qtd + qtdVenda } 
          : item
      );
      setCarrinho(novoCarrinho);
    } else {
      setCarrinho([...carrinho, { ...produtoEncontrado, qtd: qtdVenda }]);
    }

    setTermoBusca("");
    setVenda({ ...venda, qtd: "" });
  };

  const removerDoCarrinho = (id) => {
    const novoCarrinho = carrinho.filter(item => item.id !== id);
    setCarrinho(novoCarrinho);
  };
  
  const finalizarVenda = async (e) => {
    e.preventDefault();
    if (carrinho.length === 0) {
        alert("O carrinho está vazio.");
        return;
    }
    
    let subtotalGeral = 0;
    const novoEstoque = [...produtos];

    for (const itemCarrinho of carrinho) {
      const produtoIndex = novoEstoque.findIndex(
        (p) => p.id === itemCarrinho.id
      );
      if (produtoIndex !== -1) {
        novoEstoque[produtoIndex].quantidade -= itemCarrinho.qtd;
        subtotalGeral +=
          novoEstoque[produtoIndex].preco * itemCarrinho.qtd;
        
        await fetch(`${API_URL}/${itemCarrinho.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantidadeVendida: itemCarrinho.qtd
          }),
        });
      }
    }

    let descontoAplicado = 0;
    if (venda.tipoDesconto === "valor") {
      descontoAplicado = parseFloat(venda.desconto) || 0;
    } else {
      descontoAplicado =
        (subtotalGeral * (parseFloat(venda.desconto) || 0)) / 100;
    }
    const totalGeral = subtotalGeral - descontoAplicado;

    setProdutos(novoEstoque);
    setResultado({
      itensComprados: carrinho,
      subtotal: subtotalGeral,
      descontoAplicado,
      total: totalGeral < 0 ? 0 : totalGeral,
    });
    setCarrinho([]);
    setVenda({ ...venda, desconto: "" });
  };

  const limparResumoVenda = () => {
    setResultado(null);
  };

  return (
    <div className="container">
      <h1>Sistema de Estoque - Pet Shop</h1>

      <section>
        <h2>Cadastrar Produto</h2>
        <form onSubmit={adicionarProduto}>
          <input
            type="text"
            placeholder="Código de Barras"
            value={codigoBarras}
            onChange={(e) => setCodigoBarras(e.target.value)}
          />
          <input
            type="text"
            placeholder="Nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
          />
          <input
            type="number"
            placeholder="Preço"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
          />
          <input
            type="number"
            placeholder="Quantidade"
            value={quantidade}
            onChange={(e) => setQuantidade(e.target.value)}
          />
          <button type="submit">Adicionar</button>
        </form>
      </section>

      <section>
        <h2>Produtos Cadastrados</h2>
        <ul>
          {produtos.map((p) => (
            <li key={p.id}>
              {p.nome} - R$ {p.preco.toFixed(2)} ({p.quantidade} unid.)
              <button onClick={() => excluirProduto(p.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Adicionar ao Carrinho</h2>
        <form onSubmit={adicionarAoCarrinho}>
          <div className="input-busca-container">
            <input
              type="text"
              placeholder="Nome ou Código de Barras"
              value={termoBusca}
              onChange={handleTermoBuscaChange}
            />
            {sugestoes.length > 0 && (
              <ul className="sugestoes-lista">
                {sugestoes.map(sugestao => (
                  <li key={sugestao.id} onClick={() => selecionarSugestao(sugestao)}>
                    {sugestao.nome} ({sugestao.id})
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <input
            type="number"
            placeholder="Quantidade"
            value={venda.qtd}
            onChange={(e) => setVenda({ ...venda, qtd: e.target.value })}
          />
          <button type="submit">Adicionar ao Carrinho</button>
        </form>
      </section>
      
      <section>
        <h2>Carrinho ({carrinho.length})</h2>
        {carrinho.length > 0 ? (
            <>
                <ul>
                  {carrinho.map((item) => (
                    <li key={item.id}>
                      {item.nome} - {item.qtd} unid.
                      <button onClick={() => removerDoCarrinho(item.id)}>Remover</button>
                    </li>
                  ))}
                </ul>
                <hr />
                <form onSubmit={finalizarVenda}>
                  <h3>Finalizar Venda</h3>
                  <input
                    type="number"
                    placeholder="Desconto"
                    value={venda.desconto}
                    onChange={(e) => setVenda({ ...venda, desconto: e.target.value })}
                  />

                  <select
                    value={venda.tipoDesconto}
                    onChange={(e) =>
                      setVenda({ ...venda, tipoDesconto: e.target.value })
                    }
                  >
                    <option value="valor">R$</option>
                    <option value="percentual">%</option>
                  </select>
                  <button type="submit">Finalizar Venda</button>
                </form>
            </>
        ) : (
            <p>O carrinho está vazio.</p>
        )}
      </section>

      {resultado && (
        <div className="resultado">
          <h3>Resumo da Venda</h3>
          
          {resultado.itensComprados && (
            <>
              <h4>Itens Comprados:</h4>
              <ul className="resumo-lista-itens">
                {resultado.itensComprados.map(item => (
                  <li key={item.id}>
                    <span>{item.nome} ({item.qtd} unid.)</span>
                    <span>R$ {(item.preco * item.qtd).toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
          
          <p>Subtotal: R$ {resultado.subtotal.toFixed(2)}</p>
          <p>Desconto: R$ {resultado.descontoAplicado.toFixed(2)}</p>
          <p>
            <strong>Total: R$ {resultado.total.toFixed(2)}</strong>
          </p>
          
          <button onClick={limparResumoVenda}>Limpar Resumo</button>
        </div>
      )}
    </div>
  );
}

export default App;