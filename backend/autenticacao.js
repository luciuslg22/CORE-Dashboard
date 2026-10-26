const bcrypt = require("bcryptjs");
const banco = require("./banco");

async function criptografarSenha(senha) {
    return await bcrypt.hash(senha, 12);
}

async function verificarSenha(senha, senhaHash) {
    return await bcrypt.compare(senha, senhaHash);
}

function buscarUsuario(usuario) {
    return banco
        .prepare("SELECT * FROM usuarios WHERE usuario = ?")
        .get(usuario);
}

module.exports = {
    criptografarSenha,
    verificarSenha,
    buscarUsuario
};