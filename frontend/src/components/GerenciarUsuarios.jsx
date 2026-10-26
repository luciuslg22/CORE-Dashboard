import { useEffect, useState } from "react";
import "./GerenciarUsuarios.css";
import { supabase } from "../supabase";

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
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioEditando, setUsuarioEditando] = useState(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("TODOS");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [formulario, setFormulario] = useState({
    ...formularioInicial
  });

  async function requisicaoApi(caminho, opcoes = {}) {
    const token = sessionStorage.getItem("core_token");

    if (!token) {
      throw new Error("Sessão não encontrada. Faça login novamente.");
    }

    const resposta = await fetch(`${API}${caminho}`, {
      ...opcoes,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(opcoes.body ? { "Content-Type": "application/json" } : {}),
        ...opcoes.headers
      }
    });

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      throw new Error(
        dados.erro || "Não foi possível concluir a operação."
      );
    }

    return dados;
  }

async function carregarUsuarios() {
  setCarregando(true);
  setErro("");

  try {
    const { data, error } = await supabase
      .from("usuarios")
      .select("id, nome, usuario, patente, interna, ativo")
      .order("nome", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    setUsuarios(data || []);
  } catch (falha) {
    setErro(falha.message);
    setUsuarios([]);
  } finally {
    setCarregando(false);
  }
}

  useEffect(() => {
    if (usuarioAtual?.interna === "ALTO COMANDO") {
      carregarUsuarios();
    }
  }, [usuarioAtual?.interna]);

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

  function limparFormulario() {
    setUsuarioEditando(null);
    setFormulario({ ...formularioInicial });
  }

  async function cadastrar(evento) {
    evento.preventDefault();

    if (salvando) return;

    const nome = formulario.nome.trim();
    const nomeUsuario = formulario.usuario.trim().toLowerCase();

    if (!nome || !nomeUsuario) {
      alert("Preencha o nome e o usuário.");
      return;
    }

    if (
      formulario.senhaTeste &&
      formulario.senhaTeste.length < 6
    ) {
      alert("A senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (!usuarioEditando && !formulario.senhaTeste) {
      alert("Informe uma senha para o policial.");
      return;
    }

    if (
      !usuarioEditando &&
      formulario.interna === "ALTO COMANDO"
    ) {
      const confirmado = window.confirm(
        "ATENÇÃO: Você está criando uma conta com acesso total ao gerenciamento de usuários. Deseja continuar?"
      );

      if (!confirmado) return;
    }

    if (usuarioEditando) {
      const conta = usuarios.find(
        item => Number(item.id) === Number(usuarioEditando)
      );

      if (!conta) {
        alert("Conta não encontrada.");
        limparFormulario();
        return;
      }

      if (conta.usuario === "lucius") {
        alert("A conta administrativa principal está protegida.");
        return;
      }

      if (conta.interna !== formulario.interna) {
        const confirmado = window.confirm(
          `Deseja alterar a interna de ${conta.nome} de ${conta.interna} para ${formulario.interna}?`
        );

        if (!confirmado) return;
      }
    }

    setSalvando(true);

    try {

if (usuarioEditando) {
  const { data, error } = await supabase.functions.invoke(
    "editar-policial",
    {
      body: {
        id: usuarioEditando,
        nome,
        patente: formulario.patente,
        interna: formulario.interna,
        ...(formulario.senhaTeste
          ? { senha: formulario.senhaTeste }
          : {})
      }
    }
  );

  if (error || data?.erro || data?.sucesso !== true) {
    throw new Error(
      data?.erro || "Não foi possível atualizar o policial."
    );
  }

  alert("Usuário atualizado com sucesso!");
} else {
  const { data, error } = await supabase.functions.invoke(
    "criar-policial",
    {
      body: {
        nome,
        usuario: nomeUsuario,
        senha: formulario.senhaTeste,
        patente: formulario.patente,
        interna: formulario.interna
      }
    }
  );

  if (error || data?.erro || data?.sucesso !== true) {
    throw new Error(
      data?.erro || "Não foi possível cadastrar o policial."
    );
  }

  alert("Usuário cadastrado com sucesso!");
}

      limparFormulario();
      await carregarUsuarios();
    } catch (falha) {
      alert(falha.message);
    } finally {
      setSalvando(false);
    }
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

  async function alterarStatus(item) {
    if (
      Number(item.id) === Number(usuarioAtual?.id) ||
      item.usuario === "lucius"
    ) {
      alert("Esta conta não pode ser desativada ou reativada por aqui.");
      return;
    }

    const acao = item.ativo ? "desativar" : "ativar";

    if (!window.confirm(
      `Deseja ${acao} a conta de ${item.nome}?`
    )) return;

    try {
       const { data, error } = await supabase.functions.invoke(
  "alterar-status-policial",
  {
    body: {
      id: item.id,
      ativo: !item.ativo
    }
  }
);

if (error || data?.erro || data?.sucesso !== true) {
  throw new Error(
    data?.erro || "Não foi possível alterar o status do policial."
  );
}

      await carregarUsuarios();
    } catch (falha) {
      alert(falha.message);
    }
  }

  async function excluirUsuario(item) {
    if (
      Number(item.id) === Number(usuarioAtual?.id) ||
      item.usuario === "lucius"
    ) {
      alert("Esta conta administrativa não pode ser excluída.");
      return;
    }

    const confirmado = window.confirm(
      `Deseja realmente excluir a conta de ${item.nome}?`
    );

    if (!confirmado) return;

    try {
      
const { data, error } = await supabase.functions.invoke(
  "excluir-policial",
  {
    body: {
      id: item.id
    }
  }
);

if (error || data?.erro || data?.sucesso !== true) {
  let mensagem = data?.erro;

  if (!mensagem && error?.context) {
    try {
      const resposta = await error.context.clone().json();
      mensagem = resposta.erro;
    } catch {
      mensagem = null;
    } 
  }

  throw new Error(
    mensagem || "Não foi possível excluir o policial."
  );
}

      if (Number(usuarioEditando) === Number(item.id)) {
        limparFormulario();
      }

      await carregarUsuarios();
      alert("Usuário excluído com sucesso!");
    } catch (falha) {
      alert(falha.message);
    }
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

      {erro && (
        <p role="alert" style={{ color: "#ff7777" }}>
          {erro}
        </p>
      )}

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
              ? "Nova senha (opcional)"
              : "Senha do policial (mínimo 6 caracteres)"
          }
          value={formulario.senhaTeste}
          onChange={e =>
            atualizarFormulario("senhaTeste", e.target.value)
          }
          autoComplete="new-password"
          minLength={6}
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

        <button type="submit" disabled={salvando}>
          {salvando
            ? "SALVANDO..."
            : usuarioEditando
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
                      Number(item.id) === Number(usuarioAtual?.id) ||
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
                      Number(item.id) === Number(usuarioAtual?.id) ||
                      item.usuario === "lucius"
                    }
                    className="botao-excluir-usuario"
                  >
                    EXCLUIR
                  </button>
                </td>
              </tr>
            ))}

            {!carregando && usuariosFiltrados.length === 0 && (
              <tr>
                <td colSpan={6} className="usuarios-vazio">
                  Nenhuma conta encontrada.
                </td>
              </tr>
            )}

            {carregando && (
              <tr>
                <td colSpan={6} className="usuarios-vazio">
                  Carregando usuários...
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
