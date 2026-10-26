
import { useState } from "react";
import "./Login.css";
import { supabase } from "../supabase";

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
        const { data, error } = await supabase.functions.invoke("login-core", {
          body: {
            usuario: usuario.trim().toLowerCase(),
            senha
          }
        });

        if (error || !data?.access_token || !data?.refresh_token) {
  let mensagem = data?.erro || "Falha na autenticação.";

  if (error?.context) {
    try {
      const resposta = await error.context.clone().json();
      console.error("Erro login-core:", resposta);
      mensagem = resposta.erro || resposta.message || resposta.msg || mensagem;
    } catch {
      console.error("Erro login-core:", error);
    }
  }

  setErro(mensagem);
  return;
}

        const { error: erroSessao } = await supabase.auth.setSession({
          access_token: data.access_token,
          refresh_token: data.refresh_token
        });

        if (erroSessao) {
          setErro("Não foi possível iniciar a sessão.");
          return;
        }

        const { data: cadastro, error: erroCadastro } = await supabase
          .from("usuarios")
          .select("id, nome, usuario, patente, interna, ativo")
          .eq("usuario", usuario.trim().toLowerCase())
          .single();

        if (erroCadastro || !cadastro?.ativo) {
          await supabase.auth.signOut();
          setErro("Não foi possível carregar seu cadastro.");
          return;
        }

        aoEntrar?.(cadastro);
      } catch {
        setErro("Não foi possível conectar ao Supabase.");
            } finally {
        setCarregando(false);
      }
  }

  return (
    <div className="login-pagina">
      <div className="login-caixa">
        <img
          src={`${import.meta.env.BASE_URL}logo-core.webp`}
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
