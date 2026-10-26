require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada no .env");
}

const bancoPostgres = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function testarConexao() {
    const resultado = await bancoPostgres.query("SELECT NOW() AS horario");
    console.log("C.O.R.E - PostgreSQL conectado com sucesso!");
    return resultado.rows[0];
}

module.exports = {
    bancoPostgres,
    testarConexao
};