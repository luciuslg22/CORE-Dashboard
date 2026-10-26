const banco = require("./banco");
const { criptografarSenha } = require("./autenticacao");
const readline = require("readline");

const terminal = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

terminal.question("Digite a senha da conta lucius: ", async (senha) => {
    try {
        if (senha.length < 12) {
            console.log("Utilize uma senha com pelo menos 12 caracteres.");
            return;
        }

        const existente = banco.prepare(
            "SELECT id FROM usuarios WHERE usuario = ?"
        ).get("lucius");

        if (existente) {
            console.log("A conta lucius já existe no banco.");
            return;
        }

        const senhaHash = await criptografarSenha(senha);

        banco.prepare(`
            INSERT INTO usuarios
            (nome, usuario, senha_hash, patente, interna, ativo)
            VALUES (?, ?, ?, ?, ?, ?)
        `).run(
            "Lucius",
            "lucius",
            senhaHash,
            "CABO",
            "ALTO COMANDO",
            1
        );

        console.log("Conta administrativa criada com sucesso!");
    } catch (erro) {
        console.error("Erro ao criar administrador:", erro.message);
    } finally {
        terminal.close();
    }
});