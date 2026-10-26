require("dotenv").config();

const jwt = require("jsonwebtoken");
const { bancoPostgres } = require("./postgres");

async function verificarToken(requisicao, resposta, proximo) {
    try {
        const autorizacao = requisicao.headers.authorization;

        if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
            return resposta.status(401).json({
                erro: "Acesso não autorizado. Faça login."
            });
        }

        const token = autorizacao.slice(7);

        if (!token || !process.env.JWT_SECRET) {
            return resposta.status(401).json({
                erro: "Token inválido."
            });
        }

        const dados = jwt.verify(token, process.env.JWT_SECRET);

        const resultado = await bancoPostgres.query(
            `SELECT id, nome, usuario, patente, interna, ativo
             FROM usuarios
             WHERE id = $1 AND usuario = $2 AND ativo = TRUE
             LIMIT 1`,
            [dados.id, dados.usuario]
        );

        const usuario = resultado.rows[0];

        if (!usuario) {
            return resposta.status(401).json({
                erro: "Conta inexistente ou desativada."
            });
        }

        requisicao.usuario = usuario;

        proximo();
    } catch (erro) {
        if (
            erro.name === "JsonWebTokenError" ||
            erro.name === "TokenExpiredError" ||
            erro.name === "NotBeforeError"
        ) {
            return resposta.status(401).json({
                erro: "Sessão inválida ou expirada. Faça login novamente."
            });
        }

        console.error("Erro ao verificar autenticação:", erro.message);

        return resposta.status(500).json({
            erro: "Erro interno ao verificar autenticação."
        });
    }
}

module.exports = verificarToken;
