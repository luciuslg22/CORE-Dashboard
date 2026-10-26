import { useState } from "react";
import { supabase } from "../supabase";

export default function RecuperarSenha() {
  const [senha, setSenha] = useState("");
  const [confirmacao, setConfirmacao] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function alterarSenha(evento) {
    evento.preventDefault();

    if (senha !== confirmacao) {
      setMensagem("As senhas não coincidem.");
      return;
    }

    if (senha.length < 6) {
      setMensagem("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    setCarregando(true);
    setMensagem("");

    const { error } = await supabase.auth.updateUser({
      password: senha
    });

    if (error) {
      setMensagem("Não foi possível alterar a senha. Verifique se o link ainda é válido.");
    } else {
      setMensagem("Senha alterada com sucesso! Você já pode voltar ao login.");
    }

    setCarregando(false);
  }

  return (
    <div className="login-pagina">
      <div className="login-caixa">
        <h1>C.O.R.E</h1>
        <p>DEFINIR NOVA SENHA</p>

        <form onSubmit={alterarSenha}>
          <label>Nova senha</label>
          <input
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
          />

          <label>Confirmar nova senha</label>
          <input
            type="password"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            required
          />

          {mensagem && <p role="status">{mensagem}</p>}

          <button type="submit" disabled={carregando}>
            {carregando ? "SALVANDO..." : "ALTERAR SENHA"}
          </button>
        </form>
      </div>
    </div>
  );
}