const bcrypt = require("bcryptjs");
const { bancoPostgres } = require("./postgres");

async function criptografarSenha(senha) {
    return await bcrypt.hash(senha, 12);
}

async function verificarSenha(senha, senhaHash) {
    return await bcrypt.compare(senha, senhaHash);
}

async function buscarUsuario(usuario) {
    const resultado = await bancoPostgres.query(
        "SELECT * FROM usuarios WHERE usuario = $1 LIMIT 1",
        [usuario]
    );

    return resultado.rows[0] || null;
}

module.exports = {
    criptografarSenha,
    verificarSenha,
    buscarUsuario
};