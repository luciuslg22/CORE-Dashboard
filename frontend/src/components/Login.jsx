
import { useState } from "react";
import "./Login.css";

export default function Login({ aoEntrar }) {
  const [usuario, setUsuario] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar(evento) {
    evento.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await fetch("http://localhost:3001/api/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          usuario: usuario.trim().toLowerCase(),
          senha
        })
      });

      const dados = await resposta.json();

      if (!resposta.ok) {
        setErro(dados.erro || "Não foi possível realizar o login.");
        return;
      }

      if (!dados.token || !dados.usuario) {
        setErro("Resposta de autenticação inválida.");
        return;
      }

      sessionStorage.setItem("core_token", dados.token);

      aoEntrar?.(dados.usuario);
    } catch {
      setErro("Não foi possível conectar ao servidor C.O.R.E.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="login-pagina">
      <div className="login-caixa">
        <img
          src="/logo-core.webp"
          alt="Logo C.O.R.E"
          className="login-logo"
        />

        <h1>C.O.R.E</h1>

        <p className="login-subtitulo">
          COORDENADORIA DE RECURSOS ESPECIAIS
        </p>

        <form onSubmit={entrar}>
          <label htmlFor="usuario">USUÁRIO</label>
          <input
            id="usuario"
            type="text"
            placeholder="Digite seu usuário"
            value={usuario}
            onChange={e => setUsuario(e.target.value)}
            autoComplete="username"
            required
          />

          <label htmlFor="senha">SENHA</label>

          <div className="login-senha">
            <input
              id="senha"
              type={mostrarSenha ? "text" : "password"}
              placeholder="Digite sua senha"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              autoComplete="current-password"
              required
            />

            <button
              type="button"
              onClick={() => setMostrarSenha(!mostrarSenha)}
            >
              {mostrarSenha ? "Ocultar" : "Mostrar"}
            </button>
          </div>

          {erro && (
            <p role="alert" style={{ color: "#ef4444", fontSize: 12 }}>
              {erro}
            </p>
          )}

          <button
            className="login-entrar"
            type="submit"
            disabled={carregando}
          >
            {carregando ? "CONECTANDO..." : "ENTRAR NO SISTEMA"}
          </button>
        </form>

        <p className="login-rodape">
          DEPARTAMENTO POLICIAL HOST
        </p>
      </div>
    </div>
  );
}
