import { useState } from 'react'

const categorias = [
  { chave: 'participacoes', nome: 'PARTICIPAÇÕES' },
  { chave: 'comandos', nome: 'COMANDOS' },
  { chave: 'calls', nome: 'CALLS ASSUMIDAS' },
  { chave: 'vitorias', nome: 'VITÓRIAS' },
  { chave: 'aproveitamento', nome: 'APROVEITAMENTO' }
]

export default function RankingOperacional({ oficiais = [], acoes = [] }) {
  const [categoria, setCategoria] = useState('participacoes')

  const ranking = oficiais.map(oficial => {
    const id = String(oficial.id)

    const historico = acoes.filter(acao => {
      const participante = (acao.participantes || []).some(
        participanteId => String(participanteId) === id
      )
      return participante ||
        String(acao.comandante ?? '') === id ||
        String(acao.responsavelCall ?? '') === id
    })

    const vitorias = historico.filter(acao => acao.resultado === 'VITÓRIA').length
    const derrotas = historico.filter(acao => acao.resultado === 'DERROTA').length
    const canceladas = historico.filter(acao => acao.resultado === 'CANCELADA').length
    const comandos = historico.filter(acao => String(acao.comandante ?? '') === id).length
    const calls = historico.filter(acao => String(acao.responsavelCall ?? '') === id).length
    const validas = vitorias + derrotas

    return {
      id: oficial.id,
      nome: oficial.nome,
      interna: oficial.interna,
      participacoes: historico.length,
      comandos,
      calls,
      vitorias,
      derrotas,
      canceladas,
      aproveitamento: validas ? Math.round(vitorias / validas * 100) : 0
    }
  }).sort((a, b) =>
    b[categoria] - a[categoria] ||
    b.participacoes - a.participacoes ||
    a.nome.localeCompare(b.nome, 'pt-BR')
  )

  return (
    <section className="painel" style={{ marginTop: 20 }}>
      <div className="painel-topo" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3>★ RANKING OPERACIONAL</h3>
        <select
          aria-label="Classificar ranking por"
          value={categoria}
          onChange={evento => setCategoria(evento.target.value)}
          style={{
            background: '#181818',
            color: '#fff',
            border: '1px solid #454545',
            borderRadius: 6,
            padding: '9px 12px'
          }}
        >
          {categorias.map(item => (
            <option key={item.chave} value={item.chave}>{item.nome}</option>
          ))}
        </select>
      </div>

      <div className="tabela-container">
        <table>
          <thead>
            <tr>
              <th>POSIÇÃO</th>
              <th>ID</th>
              <th>POLICIAL</th>
              <th>INTERNA</th>
              <th>PARTICIPAÇÕES</th>
              <th>COMANDOS</th>
              <th>CALLS</th>
              <th>VITÓRIAS</th>
              <th>APROVEITAMENTO</th>
            </tr>
          </thead>
          <tbody>
            {ranking.map((policial, indice) => (
              <tr key={policial.id}>
                <td>{indice + 1}º</td>
                <td>{policial.id}</td>
                <td>{policial.nome}</td>
                <td>{policial.interna}</td>
                <td>{policial.participacoes}</td>
                <td>{policial.comandos}</td>
                <td>{policial.calls}</td>
                <td>{policial.vitorias}</td>
                <td>{policial.aproveitamento}%</td>
              </tr>
            ))}
            {ranking.length === 0 && (
              <tr><td colSpan="9">Nenhum policial cadastrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <p style={{ padding: '12px 20px', fontSize: 12, opacity: 0.75 }}>
        O ranking considera as ações registradas. Comandantes e responsáveis pela CALL
        contam como participantes da operação, sem duplicar a participação.
        Ações canceladas não entram no cálculo de aproveitamento.
      </p>
    </section>
  )
}
