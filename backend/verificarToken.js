
const jwt = require("jsonwebtoken");
const banco = require("./banco");

function verificarToken(requisicao, resposta, proximo) {
    const autorizacao = requisicao.headers.authorization;

    if (!autorizacao || !autorizacao.startsWith("Bearer ")) {
        return resposta.status(401).json({
            erro: "Acesso não autorizado."
        });
    }

    const token = autorizacao.slice(7);

    try {
        const dados = jwt.verify(token, process.env.JWT_SECRET);

        const usuario = banco.prepare(`
            SELECT id, nome, usuario, patente, interna, ativo
            FROM usuarios
            WHERE id = ?
        `).get(dados.id);

        if (!usuario || !usuario.ativo || usuario.usuario !== dados.usuario) {
            return resposta.status(401).json({
                erro: "Sessão inválida."
            });
        }

        requisicao.usuario = usuario;
        proximo();
    } catch {
        return resposta.status(401).json({
            erro: "Sessão expirada ou inválida."
        });
    }
}

module.exports = verificarToken;
