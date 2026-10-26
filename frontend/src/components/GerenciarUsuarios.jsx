
import { useState } from "react";
import "./GerenciarUsuarios.css";

const formularioInicial = {
  nome: "",
  usuario: "",
  senhaTeste: "",
  patente: "SOLDADO",
  interna: "MEMBRO"
};

const patentes = [
  "RECRUTA", "SOLDADO", "CABO", "3º SARGENTO", "2º SARGENTO",
  "1º SARGENTO", "SUBTENENTE", "TENENTE", "CAPITÃO", "MAJOR", "CORONEL"
];

const internas = [
  "ALTO COMANDO", "COMANDO", "SUB COMANDO", "COORDENADOR",
  "EXECUTOR", "OPERADOR", "MEMBRO", "PROBATORIO"
];

export default function GerenciarUsuarios({ usuarioAtual }) {
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");

  const [usuarios, setUsuarios] = useState(() => {
    try {
      const dados = JSON.parse(
        localStorage.getItem("core_usuarios_demo") || "[]"
      );
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  });

  const [formulario, setFormulario] = useState({
    ...formularioInicial
  });

  const usuariosFiltrados = usuarios.filter(item => {
    const termo = pesquisa.trim().toLowerCase();

    const correspondePesquisa =
      (item.nome || "").toLowerCase().includes(termo) ||
      (item.usuario || "").toLowerCase().includes(termo);

    const correspondeStatus =
      filtroStatus === "TODOS" ||
      (filtroStatus === "ATIVOS" && item.ativo === true) ||
      (filtroStatus === "INATIVOS" && item.ativo === false);

    return correspondePesquisa && correspondeStatus;
  });

  function atualizarFormulario(campo, valor) {
    setFormulario(anterior => ({
      ...anterior,
      [campo]: valor
    }));
  }

  function salvarUsuarios(atualizados) {
    localStorage.setItem(
      "core_usuarios_demo",
      JSON.stringify(atualizados)
    );
    setUsuarios(atualizados);
  }

  function limparFormulario() {
    setUsuarioEditando(null);
    setFormulario({ ...formularioInicial });
  }

  function cadastrar(evento) {
    evento.preventDefault();

    const nome = formulario.nome.trim();
    const nomeUsuario = formulario.usuario.trim().toLowerCase();

    if (!nome || !nomeUsuario) {
      alert("Preencha o nome e o usuário.");
      return;
    }

    if (usuarioEditando) {
      const conta = usuarios.find(
        item => item.id === usuarioEditando
      );

      if (!conta) {
        alert("Conta não encontrada.");
        limparFormulario();
        return;
      }

      if (conta.usuario === "lucius") {
        alert("A conta administrativa principal está protegida.");
        limparFormulario();
        return;
      }

      if (usuarios.some(item =>
        item.usuario.toLowerCase() === nomeUsuario &&
        item.id !== usuarioEditando
      )) {
        alert("Esse nome de usuário já está sendo utilizado.");
        return;
      }

      if (conta.interna !== formulario.interna) {
        const confirmado = window.confirm(
          `Deseja alterar a interna de ${conta.nome} de ${conta.interna} para ${formulario.interna}?`
        );

        if (!confirmado) return;
      }

      const atualizados = usuarios.map(item =>
        item.id === usuarioEditando
          ? {
              ...item,
              nome,
              patente: formulario.patente,
              interna: formulario.interna,
              ...(formulario.senhaTeste
                ? { senhaTeste: formulario.senhaTeste }
                : {})
            }
          : item
      );

      salvarUsuarios(atualizados);
      limparFormulario();
      alert("Usuário atualizado com sucesso!");
      return;
    }

    if (nomeUsuario === "lucius") {
      alert("Este nome de usuário é reservado para o administrador principal.");
      return;
    }

    if (usuarios.some(item =>
      item.usuario.toLowerCase() === nomeUsuario
    )) {
      alert("Esse nome de usuário já existe.");
      return;
    }

    if (!formulario.senhaTeste) {
      alert("Informe uma senha de teste.");
      return;
    }

    if (formulario.interna === "ALTO COMANDO") {
      const confirmado = window.confirm(
        "ATENÇÃO: Você está criando uma conta com acesso total ao gerenciamento de usuários. Deseja continuar?"
      );

      if (!confirmado) return;
    }

    salvarUsuarios([
      ...usuarios,
      {
        id: crypto.randomUUID(),
        nome,
        usuario: nomeUsuario,
        senhaTeste: formulario.senhaTeste,
        patente: formulario.patente,
        interna: formulario.interna,
        ativo: true
      }
    ]);

    limparFormulario();
    alert("Usuário cadastrado com sucesso!");
  }

  function editarUsuario(item) {
    if (item.usuario === "lucius") {
      alert("A conta administrativa principal está protegida contra alterações.");
      return;
    }

    setUsuarioEditando(item.id);

    setFormulario({
      nome: item.nome,
      usuario: item.usuario,
      senhaTeste: "",
      patente: item.patente,
      interna: item.interna
    });

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function alterarStatus(item) {
    if (
      item.id === usuarioAtual?.id ||
      item.usuario === "lucius"
    ) {
      alert("Esta conta não pode ser desativada ou reativada por aqui.");
      return;
    }

    const acao = item.ativo ? "desativar" : "ativar";

    if (!window.confirm(
      `Deseja ${acao} a conta de ${item.nome}?`
    )) return;

    salvarUsuarios(
      usuarios.map(usuario =>
        usuario.id === item.id
          ? { ...usuario, ativo: !usuario.ativo }
          : usuario
      )
    );
  }

  function excluirUsuario(item) {
    if (
      item.id === usuarioAtual?.id ||
      item.usuario === "lucius"
    ) {
      alert("Esta conta administrativa não pode ser excluída.");
      return;
    }

    const confirmado = window.confirm(
      `Deseja realmente excluir a conta de ${item.nome}?`
    );

    if (!confirmado) return;

    const atualizados = usuarios.filter(
      usuario => usuario.id !== item.id
    );

    salvarUsuarios(atualizados);

    if (usuarioEditando === item.id) {
      limparFormulario();
    }

    alert("Usuário excluído com sucesso!");
  }

  if (usuarioAtual?.interna !== "ALTO COMANDO") {
    return (
      <section className="painel">
        <h2>ACESSO RESTRITO</h2>
        <p>Área exclusiva do ALTO COMANDO.</p>
      </section>
    );
  }

  return (
    <section className="painel gerenciar-usuarios">
      <h2>GERENCIAMENTO DE USUÁRIOS</h2>
      <p>Área exclusiva do ALTO COMANDO.</p>

      <div className="usuarios-estatisticas">
        <div className="usuarios-indicador">
          <span>TOTAL DE USUÁRIOS</span>
          <strong>{usuarios.length}</strong>
        </div>

        <div className="usuarios-indicador">
          <span>ATIVOS</span>
          <strong>
            {usuarios.filter(item => item.ativo === true).length}
          </strong>
        </div>

        <div className="usuarios-indicador">
          <span>INATIVOS</span>
          <strong>
            {usuarios.filter(item => item.ativo === false).length}
          </strong>
        </div>
      </div>

      <form onSubmit={cadastrar}>
        <input
          type="text"
          placeholder="Nome do policial"
          value={formulario.nome}
          onChange={e =>
            atualizarFormulario("nome", e.target.value)
          }
          required
        />

        <input
          type="text"
          placeholder="Nome de usuário"
          value={formulario.usuario}
          onChange={e =>
            atualizarFormulario("usuario", e.target.value)
          }
          disabled={Boolean(usuarioEditando)}
          required
        />

        <input
          type="password"
          placeholder={
            usuarioEditando
              ? "Nova senha de teste (opcional)"
              : "Senha de teste do policial"
          }
          value={formulario.senhaTeste}
          onChange={e =>
            atualizarFormulario("senhaTeste", e.target.value)
          }
          autoComplete="new-password"
          required={!usuarioEditando}
        />

        <select
          value={formulario.patente}
          onChange={e =>
            atualizarFormulario("patente", e.target.value)
          }
        >
          {patentes.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select
          value={formulario.interna}
          onChange={e =>
            atualizarFormulario("interna", e.target.value)
          }
        >
          {internas.map(item => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <button type="submit">
          {usuarioEditando
            ? "SALVAR ALTERAÇÕES"
            : "CADASTRAR USUÁRIO"}
        </button>

        {usuarioEditando && (
          <button
            type="button"
            onClick={limparFormulario}
          >
            CANCELAR EDIÇÃO
          </button>
        )}
      </form>

      <h3>CONTAS CADASTRADAS ({usuarios.length})</h3>

        <div className="usuarios-filtros">
      <input
        type="text"
        placeholder="Pesquisar policial por nome ou usuário..."
        value={pesquisa}
        onChange={e => setPesquisa(e.target.value)}
        className="usuarios-pesquisa"
      />

      <select
        value={filtroStatus}
        onChange={e => setFiltroStatus(e.target.value)}
        className="usuarios-filtro"
      >
        <option value="TODOS">TODAS AS CONTAS</option>
        <option value="ATIVOS">CONTAS ATIVAS</option>
        <option value="INATIVOS">CONTAS INATIVAS</option>
      </select>
      </div>

      <div className="usuarios-tabela-container">
        <table className="usuarios-tabela">
          <thead>
            <tr>
              <th>NOME</th>
              <th>USUÁRIO</th>
              <th>PATENTE</th>
              <th>INTERNA</th>
              <th>STATUS</th>
              <th>AÇÕES</th>
            </tr>
          </thead>

          <tbody>
            {usuariosFiltrados.map(item => (
              <tr key={item.id}>
                <td>
                  <strong>{item.nome}</strong>
                </td>

                <td>@{item.usuario}</td>
                <td>{item.patente}</td>
                <td>{item.interna}</td>

                <td>
                  <span
                    className={
                      item.ativo
                        ? "usuario-ativo"
                        : "usuario-inativo"
                    }
                  >
                    {item.ativo ? "● ATIVO" : "● INATIVO"}
                  </span>
                </td>

                <td className="usuarios-acoes">
                  <button
                    type="button"
                    onClick={() => editarUsuario(item)}
                    disabled={item.usuario === "lucius"}
                  >
                    EDITAR
                  </button>

                  <button
                    type="button"
                    onClick={() => alterarStatus(item)}
                    disabled={
                      item.id === usuarioAtual?.id ||
                      item.usuario === "lucius"
                    }
                  >
                    {item.ativo
                      ? "DESATIVAR CONTA"
                      : "ATIVAR CONTA"}
                  </button>

                  <button
                    type="button"
                    onClick={() => excluirUsuario(item)}
                    disabled={
                      item.id === usuarioAtual?.id ||
                      item.usuario === "lucius"
                    }
                    className="botao-excluir-usuario"
                  >
                    EXCLUIR
                  </button>
                </td>
              </tr>
            ))}

            {usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="usuarios-vazio">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
