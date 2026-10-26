
require("dotenv").config();

const { bancoPostgres } = require("./postgres");
const { buscarUsuario, verificarSenha, criptografarSenha } = require("./autenticacao");
const jwt = require("jsonwebtoken");
const verificarToken = require("./verificarToken");
const express = require("express");
const cors = require("cors");

const aplicativo = express();

aplicativo.use(cors());
aplicativo.use(express.json({ limit: "100kb" }));

function somenteAltoComando(requisicao, resposta, proximo) {
    if (requisicao.usuario?.interna !== "ALTO COMANDO") {
        return resposta.status(403).json({
            erro: "Acesso permitido somente ao ALTO COMANDO."
        });
    }

    proximo();
}

function validarId(valor) {
    const id = Number(valor);
    return Number.isSafeInteger(id) && id > 0 ? id : null;
}

async function buscarConta(id, cliente = bancoPostgres) {
    const resultado = await cliente.query(
        `SELECT id, nome, usuario, patente, interna, ativo
         FROM usuarios
         WHERE id = $1`,
        [id]
    );

    return resultado.rows[0] || null;
}

async function contarAltosComandosAtivos(cliente = bancoPostgres) {
    const resultado = await cliente.query(
        `SELECT COUNT(*)::integer AS total
         FROM usuarios
         WHERE interna = 'ALTO COMANDO' AND ativo = TRUE`
    );

    return resultado.rows[0].total;
}

async function executarComTransacao(operacao) {
    const cliente = await bancoPostgres.connect();

    try {
        await cliente.query("BEGIN");

        const resultado = await operacao(cliente);

        await cliente.query("COMMIT");
        return resultado;
    } catch (erro) {
        await cliente.query("ROLLBACK");
        throw erro;
    } finally {
        cliente.release();
    }
}

aplicativo.get("/", (requisicao, resposta) => {
    resposta.json({
        sistema: "C.O.R.E - Dashboard",
        status: "Servidor funcionando"
    });
});

aplicativo.post("/api/login", async (requisicao, resposta) => {
    try {
        const { usuario, senha } = requisicao.body || {};

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

        const conta = await buscarUsuario(usuario.trim().toLowerCase());

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
    async (requisicao, resposta) => {
        try {
            const resultado = await bancoPostgres.query(
                `SELECT id, nome, usuario, patente, interna, ativo
                 FROM usuarios
                 ORDER BY LOWER(nome), id`
            );

            return resposta.json({
                usuarios: resultado.rows
            });
        } catch (erro) {
            console.error("Erro ao listar usuários:", erro.message);

            return resposta.status(500).json({
                erro: "Não foi possível listar os usuários."
            });
        }
    }
);

aplicativo.post(
    "/api/usuarios",
    verificarToken,
    somenteAltoComando,
    async (requisicao, resposta) => {
        try {
            const { nome, usuario, senha, patente, interna } =
                requisicao.body || {};

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

            if (senha.length < 6) {
                return resposta.status(400).json({
                    erro: "A senha deve ter pelo menos 6 caracteres."
                });
            }

            if (nomeUsuario === "lucius") {
                return resposta.status(400).json({
                    erro: "O usuário lucius é reservado para a conta principal."
                });
            }

            const senhaHash = await criptografarSenha(senha);

            const resultado = await bancoPostgres.query(
                `INSERT INTO usuarios
                 (nome, usuario, senha_hash, patente, interna, ativo)
                 VALUES ($1, $2, $3, $4, $5, TRUE)
                 RETURNING id, nome, usuario, patente, interna, ativo`,
                [
                    nome.trim(),
                    nomeUsuario,
                    senhaHash,
                    patente.trim(),
                    interna.trim()
                ]
            );

            return resposta.status(201).json({
                mensagem: "Usuário cadastrado com sucesso.",
                usuario: resultado.rows[0]
            });
        } catch (erro) {
            if (erro.code === "23505") {
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
        const id = validarId(requisicao.params.id);

        if (!id) {
            return resposta.status(400).json({
                erro: "ID inválido."
            });
        }

        const { nome, patente, interna, senha } =
            requisicao.body || {};

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            typeof patente !== "string" ||
            !patente.trim() ||
            typeof interna !== "string" ||
            !interna.trim() ||
            (senha !== undefined && (
                typeof senha !== "string" ||
                (senha.length > 0 && senha.length < 6)
            ))
        ) {
            return resposta.status(400).json({
                erro: "Dados inválidos. A nova senha deve ter pelo menos 6 caracteres."
            });
        }

        try {
            const resultado = await executarComTransacao(async cliente => {
                await cliente.query(
                    "SELECT pg_advisory_xact_lock(20261026)"
                );

                const conta = await buscarConta(id, cliente);

                if (!conta) {
                    return {
                        status: 404,
                        dados: { erro: "Usuário não encontrado." }
                    };
                }

                if (conta.usuario === "lucius") {
                    return {
                        status: 403,
                        dados: {
                            erro: "A conta administrativa principal está protegida."
                        }
                    };
                }

                if (
                    conta.interna === "ALTO COMANDO" &&
                    conta.ativo &&
                    interna.trim() !== "ALTO COMANDO" &&
                    await contarAltosComandosAtivos(cliente) <= 1
                ) {
                    return {
                        status: 400,
                        dados: {
                            erro: "Não é possível remover o último ALTO COMANDO ativo."
                        }
                    };
                }

                let atualizacao;

                if (senha) {
                    const senhaHash = await criptografarSenha(senha);

                    atualizacao = await cliente.query(
                        `UPDATE usuarios
                         SET nome = $1,
                             patente = $2,
                             interna = $3,
                             senha_hash = $4
                         WHERE id = $5
                         RETURNING id, nome, usuario, patente, interna, ativo`,
                        [
                            nome.trim(),
                            patente.trim(),
                            interna.trim(),
                            senhaHash,
                            id
                        ]
                    );
                } else {
                    atualizacao = await cliente.query(
                        `UPDATE usuarios
                         SET nome = $1,
                             patente = $2,
                             interna = $3
                         WHERE id = $4
                         RETURNING id, nome, usuario, patente, interna, ativo`,
                        [
                            nome.trim(),
                            patente.trim(),
                            interna.trim(),
                            id
                        ]
                    );
                }

                return {
                    status: 200,
                    dados: {
                        mensagem: "Usuário atualizado com sucesso.",
                        usuario: atualizacao.rows[0]
                    }
                };
            });

            return resposta.status(resultado.status).json(resultado.dados);
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
    async (requisicao, resposta) => {
        const id = validarId(requisicao.params.id);
        const { ativo } = requisicao.body || {};

        if (!id) {
            return resposta.status(400).json({
                erro: "ID inválido."
            });
        }

        if (typeof ativo !== "boolean") {
            return resposta.status(400).json({
                erro: "Informe um status válido."
            });
        }

        try {
            const resultado = await executarComTransacao(async cliente => {
                await cliente.query(
                    "SELECT pg_advisory_xact_lock(20261026)"
                );

                const conta = await buscarConta(id, cliente);

                if (!conta) {
                    return {
                        status: 404,
                        dados: { erro: "Usuário não encontrado." }
                    };
                }

                if (
                    conta.usuario === "lucius" ||
                    id === Number(requisicao.usuario.id)
                ) {
                    return {
                        status: 403,
                        dados: {
                            erro: "Essa conta não pode ser desativada ou reativada por aqui."
                        }
                    };
                }

                if (
                    !ativo &&
                    conta.ativo &&
                    conta.interna === "ALTO COMANDO" &&
                    await contarAltosComandosAtivos(cliente) <= 1
                ) {
                    return {
                        status: 400,
                        dados: {
                            erro: "Não é possível desativar o último ALTO COMANDO ativo."
                        }
                    };
                }

                const atualizacao = await cliente.query(
                    `UPDATE usuarios
                     SET ativo = $1
                     WHERE id = $2
                     RETURNING id, nome, usuario, patente, interna, ativo`,
                    [ativo, id]
                );

                return {
                    status: 200,
                    dados: {
                        mensagem: "Status atualizado com sucesso.",
                        usuario: atualizacao.rows[0]
                    }
                };
            });

            return resposta.status(resultado.status).json(resultado.dados);
        } catch (erro) {
            console.error("Erro ao atualizar status:", erro.message);

            return resposta.status(500).json({
                erro: "Não foi possível atualizar o status."
            });
        }
    }
);

aplicativo.delete(
    "/api/usuarios/:id",
    verificarToken,
    somenteAltoComando,
    async (requisicao, resposta) => {
        const id = validarId(requisicao.params.id);

        if (!id) {
            return resposta.status(400).json({
                erro: "ID inválido."
            });
        }

        try {
            const resultado = await executarComTransacao(async cliente => {
                await cliente.query(
                    "SELECT pg_advisory_xact_lock(20261026)"
                );

                const conta = await buscarConta(id, cliente);

                if (!conta) {
                    return {
                        status: 404,
                        dados: { erro: "Usuário não encontrado." }
                    };
                }

                if (
                    conta.usuario === "lucius" ||
                    id === Number(requisicao.usuario.id)
                ) {
                    return {
                        status: 403,
                        dados: {
                            erro: "Essa conta administrativa não pode ser excluída."
                        }
                    };
                }

                if (
                    conta.ativo &&
                    conta.interna === "ALTO COMANDO" &&
                    await contarAltosComandosAtivos(cliente) <= 1
                ) {
                    return {
                        status: 400,
                        dados: {
                            erro: "Não é possível excluir o último ALTO COMANDO ativo."
                        }
                    };
                }

                await cliente.query(
                    "DELETE FROM usuarios WHERE id = $1",
                    [id]
                );

                return {
                    status: 200,
                    dados: {
                        mensagem: "Usuário excluído com sucesso."
                    }
                };
            });

            return resposta.status(resultado.status).json(resultado.dados);
        } catch (erro) {
            console.error("Erro ao excluir usuário:", erro.message);

            return resposta.status(500).json({
                erro: "Não foi possível excluir o usuário."
            });
        }
    }
);

const porta = process.env.PORT || 3001;

aplicativo.listen(porta, () => {
    console.log(`C.O.R.E - Servidor online na porta ${porta}`);
});