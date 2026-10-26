require("dotenv").config();

const bancoLocal = require("./banco");
const { bancoPostgres } = require("./postgres");

async function migrarUsuarios() {
    try {
        const usuarios = bancoLocal
            .prepare("SELECT * FROM usuarios")
            .all();

        console.log(`Usuários encontrados: ${usuarios.length}`);

        for (const usuario of usuarios) {
            await bancoPostgres.query(
                `INSERT INTO usuarios
                (nome, usuario, senha_hash, patente, interna, ativo)
                VALUES ($1, $2, $3, $4, $5, $6)
                ON CONFLICT (usuario) DO NOTHING`,
                [
                    usuario.nome,
                    usuario.usuario,
                    usuario.senha_hash,
                    usuario.patente,
                    usuario.interna,
                    Boolean(usuario.ativo)
                ]
            );

            console.log(`Conta processada: ${usuario.usuario}`);
        }

        console.log("Migração concluída!");
    } catch (erro) {
        console.error("Erro na migração:", erro.message);
        process.exitCode = 1;
    } finally {
        await bancoPostgres.end();
        bancoLocal.close();
    }
}

migrarUsuarios();