
require("dotenv").config();

const banco = require("./banco");
const { buscarUsuario, verificarSenha, criptografarSenha } = require("./autenticacao");
const jwt = require("jsonwebtoken");
const verificarToken = require("./verificarToken");
const express = require("express");
const cors = require("cors");

const aplicativo = express();

aplicativo.use(cors());
aplicativo.use(express.json());

function somenteAltoComando(requisicao, resposta, proximo) {
    if (requisicao.usuario?.interna !== "ALTO COMANDO") {
        return resposta.status(403).json({
            erro: "Acesso permitido somente ao ALTO COMANDO."
        });
    }

    proximo();
}

function buscarConta(id) {
    return banco.prepare(`
        SELECT id, nome, usuario, patente, interna, ativo
        FROM usuarios
        WHERE id = ?
    `).get(id);
}

function contarAltosComandosAtivos() {
    return banco.prepare(`
        SELECT COUNT(*) AS total
        FROM usuarios
        WHERE interna = 'ALTO COMANDO' AND ativo = 1
    `).get().total;
}

aplicativo.get("/", (requisicao, resposta) => {
    resposta.json({
        sistema: "C.O.R.E - Dashboard",
        status: "Servidor funcionando"
    });
});

aplicativo.post("/api/login", async (requisicao, resposta) => {
    try {
        const { usuario, senha } = requisicao.body;

        if (
            typeof usuario !== "string" ||
            typeof senha !== "string" ||
            !usuario.trim() ||
            !senha
        ) {
            return resposta.status(400).json({
                erro: "Informe usuário e senha."
            });
        }

        const conta = buscarUsuario(usuario.trim().toLowerCase());

        if (!conta || !conta.ativo) {
            return resposta.status(401).json({
                erro: "Usuário ou senha inválidos."
            });
        }

        const senhaCorreta = await verificarSenha(
            senha,
            conta.senha_hash
        );

        if (!senhaCorreta) {
            return resposta.status(401).json({
                erro: "Usuário ou senha inválidos."
            });
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET não configurado.");
        }

        const token = jwt.sign(
            {
                id: conta.id,
                usuario: conta.usuario
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "8h"
            }
        );

        return resposta.json({
            mensagem: "Login realizado com sucesso.",
            token,
            usuario: {
                id: conta.id,
                nome: conta.nome,
                usuario: conta.usuario,
                patente: conta.patente,
                interna: conta.interna
            }
        });
    } catch (erro) {
        console.error("Erro na autenticação:", erro.message);

        return resposta.status(500).json({
            erro: "Erro interno do servidor."
        });
    }
});

aplicativo.get(
    "/api/usuario-atual",
    verificarToken,
    (requisicao, resposta) => {
        resposta.json({
            usuario: requisicao.usuario
        });
    }
);

aplicativo.get(
    "/api/usuarios",
    verificarToken,
    somenteAltoComando,
    (requisicao, resposta) => {
        const usuarios = banco.prepare(`
            SELECT id, nome, usuario, patente, interna, ativo
            FROM usuarios
            ORDER BY nome COLLATE NOCASE
        `).all().map(conta => ({
            ...conta,
            ativo: Boolean(conta.ativo)
        }));

        resposta.json({ usuarios });
    }
);

aplicativo.post(
    "/api/usuarios",
    verificarToken,
    somenteAltoComando,
    async (requisicao, resposta) => {
        try {
            const { nome, usuario, senha, patente, interna } = requisicao.body;

            if (
                typeof nome !== "string" ||
                typeof usuario !== "string" ||
                typeof senha !== "string" ||
                typeof patente !== "string" ||
                typeof interna !== "string" ||
                !nome.trim() ||
                !usuario.trim() ||
                !senha ||
                !patente.trim() ||
                !interna.trim()
            ) {
                return resposta.status(400).json({
                    erro: "Preencha todos os campos obrigatórios."
                });
            }

            const nomeUsuario = usuario.trim().toLowerCase();

            if (!/^[a-z0-9._-]{3,30}$/.test(nomeUsuario)) {
                return resposta.status(400).json({
                    erro: "O usuário deve ter de 3 a 30 caracteres: letras, números, ponto, hífen ou sublinhado."
                });
            }

            if (senha.length < 12) {
                return resposta.status(400).json({
                    erro: "A senha deve ter pelo menos 12 caracteres."
                });
            }

            if (nomeUsuario === "lucius") {
                return resposta.status(400).json({
                    erro: "O usuário lucius é reservado para a conta principal."
                });
            }

            if (buscarUsuario(nomeUsuario)) {
                return resposta.status(409).json({
                    erro: "Esse nome de usuário já existe."
                });
            }

            const senhaHash = await criptografarSenha(senha);

            const resultado = banco.prepare(`
                INSERT INTO usuarios
                (nome, usuario, senha_hash, patente, interna, ativo)
                VALUES (?, ?, ?, ?, ?, 1)
            `).run(
                nome.trim(),
                nomeUsuario,
                senhaHash,
                patente.trim(),
                interna.trim()
            );

            return resposta.status(201).json({
                mensagem: "Usuário cadastrado com sucesso.",
                usuario: buscarConta(Number(resultado.lastInsertRowid))
            });
        } catch (erro) {
            if (erro.code === "SQLITE_CONSTRAINT_UNIQUE") {
                return resposta.status(409).json({
                    erro: "Esse nome de usuário já existe."
                });
            }

            console.error("Erro ao cadastrar usuário:", erro.message);

            return resposta.status(500).json({
                erro: "Não foi possível cadastrar o usuário."
            });
        }
    }
);

aplicativo.put(
    "/api/usuarios/:id",
    verificarToken,
    somenteAltoComando,
    async (requisicao, resposta) => {
        try {
            const id = Number(requisicao.params.id);
            const { nome, patente, interna, senha } = requisicao.body;

            if (!Number.isSafeInteger(id) || id <= 0) {
                return resposta.status(400).json({
                    erro: "ID inválido."
                });
            }

            const conta = buscarConta(id);

            if (!conta) {
                return resposta.status(404).json({
                    erro: "Usuário não encontrado."
                });
            }

            if (conta.usuario === "lucius") {
                return resposta.status(403).json({
                    erro: "A conta administrativa principal está protegida."
                });
            }

            if (
                typeof nome !== "string" ||
                !nome.trim() ||
                typeof patente !== "string" ||
                !patente.trim() ||
                typeof interna !== "string" ||
                !interna.trim() ||
                (senha !== undefined && (
                    typeof senha !== "string" ||
                    (senha.length > 0 && senha.length < 12)
                ))
            ) {
                return resposta.status(400).json({
                    erro: "Dados inválidos. A nova senha deve ter pelo menos 12 caracteres."
                });
            }

            if (
                conta.interna === "ALTO COMANDO" &&
                conta.ativo &&
                interna !== "ALTO COMANDO" &&
                contarAltosComandosAtivos() <= 1
            ) {
                return resposta.status(400).json({
                    erro: "Não é possível remover o último ALTO COMANDO ativo."
                });
            }

            if (senha) {
                const senhaHash = await criptografarSenha(senha);

                banco.prepare(`
                    UPDATE usuarios
                    SET nome = ?, patente = ?, interna = ?, senha_hash = ?
                    WHERE id = ?
                `).run(nome.trim(), patente.trim(), interna.trim(), senhaHash, id);
            } else {
                banco.prepare(`
                    UPDATE usuarios
                    SET nome = ?, patente = ?, interna = ?
                    WHERE id = ?
                `).run(nome.trim(), patente.trim(), interna.trim(), id);
            }

            return resposta.json({
                mensagem: "Usuário atualizado com sucesso.",
                usuario: buscarConta(id)
            });
        } catch (erro) {
            console.error("Erro ao atualizar usuário:", erro.message);

            return resposta.status(500).json({
                erro: "Não foi possível atualizar o usuário."
            });
        }
    }
);

aplicativo.patch(
    "/api/usuarios/:id/status",
    verificarToken,
    somenteAltoComando,
    (requisicao, resposta) => {
        const id = Number(requisicao.params.id);
        const { ativo } = requisicao.body;

        if (!Number.isSafeInteger(id) || id <= 0) {
            return resposta.status(400).json({
                erro: "ID inválido."
            });
        }

        if (typeof ativo !== "boolean") {
            return resposta.status(400).json({
                erro: "Informe um status válido."
            });
        }

        const conta = buscarConta(id);

        if (!conta) {
            return resposta.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (conta.usuario === "lucius" || id === requisicao.usuario.id) {
            return resposta.status(403).json({
                erro: "Essa conta não pode ser desativada ou reativada por aqui."
            });
        }

        if (
            !ativo &&
            conta.ativo &&
            conta.interna === "ALTO COMANDO" &&
            contarAltosComandosAtivos() <= 1
        ) {
            return resposta.status(400).json({
                erro: "Não é possível desativar o último ALTO COMANDO ativo."
            });
        }

        banco.prepare(`
            UPDATE usuarios SET ativo = ? WHERE id = ?
        `).run(ativo ? 1 : 0, id);

        return resposta.json({
            mensagem: "Status atualizado com sucesso.",
            usuario: {
                ...buscarConta(id),
                ativo
            }
        });
    }
);

aplicativo.delete(
    "/api/usuarios/:id",
    verificarToken,
    somenteAltoComando,
    (requisicao, resposta) => {
        const id = Number(requisicao.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return resposta.status(400).json({
                erro: "ID inválido."
            });
        }

        const conta = buscarConta(id);

        if (!conta) {
            return resposta.status(404).json({
                erro: "Usuário não encontrado."
            });
        }

        if (conta.usuario === "lucius" || id === requisicao.usuario.id) {
            return resposta.status(403).json({
                erro: "Essa conta administrativa não pode ser excluída."
            });
        }

        if (
            conta.ativo &&
            conta.interna === "ALTO COMANDO" &&
            contarAltosComandosAtivos() <= 1
        ) {
            return resposta.status(400).json({
                erro: "Não é possível excluir o último ALTO COMANDO ativo."
            });
        }

        banco.prepare("DELETE FROM usuarios WHERE id = ?").run(id);

        return resposta.json({
            mensagem: "Usuário excluído com sucesso."
        });
    }
);

const porta = process.env.PORT || 3001;

aplicativo.listen(porta, () => {
    console.log(`C.O.R.E - Servidor online na porta ${porta}`);
});
