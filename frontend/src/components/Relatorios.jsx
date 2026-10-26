export function carregarRelatorios() {
  try {
    const salvos = localStorage.getItem('core_relatorios')
    const dados = salvos ? JSON.parse(salvos) : []
    return Array.isArray(dados) ? dados : []
  } catch {
    return []
  }
}

export function calcularEstatisticas(relatorios) {
  const totais = relatorios.reduce((soma, acao) => {
    soma.vitorias += Number(acao.vitorias) || 0
    soma.derrotas += Number(acao.derrotas) || 0
    soma.canceladas += Number(acao.canceladas) || 0
    return soma
  }, { vitorias: 0, derrotas: 0, canceladas: 0 })

  totais.total = totais.vitorias + totais.derrotas + totais.canceladas
  const validas = totais.vitorias + totais.derrotas
  totais.aproveitamento = validas
    ? Math.round(totais.vitorias / validas * 100)
    : 0
  return totais
}

export default function Relatorios({ automaticos = [], completo = false }) {
  const dados = automaticos
    .filter(acao => String(acao.nome || '').trim())
    .slice()
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const totais = calcularEstatisticas(dados)

  return (
    <section className="painel relatorio relatorio-core">
      <div className="painel-topo">
        <div>
          <h3>▥ RELATÓRIO INTERNO</h3>
          <p className="relatorio-core-subtitulo">
            Estatísticas sincronizadas automaticamente com as operações registradas em Ações.
          </p>
        </div>
        <span className="relatorio-core-selo">● AUTOMÁTICO</span>
      </div>

      <div className="relatorio-core-resumo">
        {[
          ['OPERAÇÕES', totais.total],
          ['VITÓRIAS', totais.vitorias],
          ['DERROTAS', totais.derrotas],
          ['CANCELADAS', totais.canceladas],
          ['APROVEITAMENTO', `${totais.aproveitamento}%`]
        ].map(([rotulo, valor]) => (
          <div className="relatorio-core-cartao" key={rotulo}>
            <span>{rotulo}</span>
            <strong>{valor}</strong>
          </div>
        ))}
      </div>

      <div className="tabela-container">
        <table className="relatorio-core-tabela">
          <thead>
            <tr>
              <th>AÇÃO</th>
              <th>VITÓRIAS</th>
              <th>DERROTAS</th>
              <th>CANCELADAS</th>
              <th>TOTAL</th>
              <th>% VITÓRIAS</th>
            </tr>
          </thead>
          <tbody>
            {dados.map(acao => {
              const vitorias = Number(acao.vitorias) || 0
              const derrotas = Number(acao.derrotas) || 0
              const canceladas = Number(acao.canceladas) || 0
              const total = vitorias + derrotas + canceladas
              const validas = vitorias + derrotas
              const percentual = validas ? Math.round(vitorias / validas * 100) : 0

              return (
                <tr key={acao.id}>
                  <td className="relatorio-core-nome">{acao.nome}</td>
                  <td>{vitorias}</td>
                  <td>{derrotas}</td>
                  <td>{canceladas}</td>
                  <td>{total}</td>
                  <td><span className="relatorio-core-percentual">{percentual}%</span></td>
                </tr>
              )
            })}
            {dados.length === 0 && (
              <tr>
                <td colSpan={6} className="relatorio-core-vazio">
                  Nenhuma operação registrada. Cadastre uma ação para gerar o primeiro relatório automaticamente.
                </td>
              </tr>
            )}
            <tr className="relatorio-total">
              <td>TOTAL GERAL</td>
              <td>{totais.vitorias}</td>
              <td>{totais.derrotas}</td>
              <td>{totais.canceladas}</td>
              <td>{totais.total}</td>
              <td>{totais.aproveitamento}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  )
}
