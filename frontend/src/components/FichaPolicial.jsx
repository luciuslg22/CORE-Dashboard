import { useEffect } from 'react'

function formatarData(valor) {
  if (!valor) return 'Não informada'
  const partes = String(valor).split('-')
  return partes.length === 3 ? partes.reverse().join('/') : String(valor)
}

export default function FichaPolicial({
  oficial,
  oficiais = [],
  acoes = [],
  cursosDisponiveis = [],
  capacitacoesOperacionais = [],
  aoFechar
}) {
  useEffect(() => {
    function fecharTecla(evento) {
      if (evento.key === 'Escape') aoFechar()
    }
    document.addEventListener('keydown', fecharTecla)
    return () => document.removeEventListener('keydown', fecharTecla)
  }, [aoFechar])

  if (!oficial) return null

  const id = String(oficial.id)

  const historico = acoes.filter(acao =>
    (Array.isArray(acao.participantes) &&
      acao.participantes.some(item => String(item) === id)) ||
    String(acao.comandante ?? '') === id ||
    String(acao.responsavelCall ?? '') === id
  ).slice().sort((a, b) => String(b.data || '').localeCompare(String(a.data || '')))

  const vitorias = historico.filter(acao => acao.resultado === 'VITÓRIA').length
  const derrotas = historico.filter(acao => acao.resultado === 'DERROTA').length
  const canceladas = historico.filter(acao => acao.resultado === 'CANCELADA').length
  const comandos = historico.filter(acao => String(acao.comandante ?? '') === id).length
  const calls = historico.filter(acao => String(acao.responsavelCall ?? '') === id).length
  const validas = vitorias + derrotas
  const aproveitamento = validas ? Math.round(vitorias / validas * 100) : 0

  function nomePolicial(valor) {
    if (valor === null || valor === undefined || valor === '') return 'Não informado'
    const encontrado = oficiais.find(item => String(item.id) === String(valor))
    return encontrado ? `${encontrado.id} — ${encontrado.nome}` : `ID ${valor}`
  }

  const estatisticas = [
    ['AÇÕES', historico.length],
    ['VITÓRIAS', vitorias],
    ['DERROTAS', derrotas],
    ['CANCELADAS', canceladas],
    ['COMANDOS', comandos],
    ['CALLS', calls],
    ['APROVEITAMENTO', `${aproveitamento}%`]
  ]

  return (
    <div className="ficha-fundo" onClick={aoFechar}>
      <div
        className="ficha-conteudo"
        role="dialog"
        aria-modal="true"
        aria-label={`Ficha individual de ${oficial.nome}`}
        onClick={evento => evento.stopPropagation()}
      >
        <header className="ficha-cabecalho">
          <div>
            <span className="ficha-legenda">C.O.R.E — FICHA INDIVIDUAL</span>
            <h2>{oficial.nome}</h2>
            <p>ID {oficial.id} • {oficial.patente} • {oficial.interna}</p>
          </div>
          <button type="button" className="ficha-fechar" onClick={aoFechar} aria-label="Fechar ficha">✕</button>
        </header>

        <div className="ficha-corpo">
          <section className="ficha-secao">
            <h3>IDENTIFICAÇÃO</h3>
            <div className="ficha-dados">
              <div><span>ID</span><strong>{oficial.id}</strong></div>
              <div><span>PATENTE</span><strong>{oficial.patente}</strong></div>
              <div><span>INTERNA</span><strong>{oficial.interna}</strong></div>
              <div><span>STATUS</span><strong>{oficial.status}</strong></div>
              <div><span>DATA DE ENTRADA</span><strong>{formatarData(oficial.dataEntrada)}</strong></div>
            </div>
          </section>

          <section className="ficha-secao">
            <h3>CAPACITAÇÕES OPERACIONAIS</h3>
            <div className="ficha-etiquetas">
              {capacitacoesOperacionais.map(curso => (
                <span
                  key={curso}
                  className={oficial.cursos?.[curso] === true ? 'ficha-etiqueta concluido' : 'ficha-etiqueta'}
                >
                  {curso}: {oficial.cursos?.[curso] === true ? 'CONCLUÍDO' : 'PENDENTE'}
                </span>
              ))}
            </div>
          </section>

          <section className="ficha-secao">
            <h3>CURSOS</h3>
            <div className="ficha-etiquetas">
              {cursosDisponiveis.map(curso => (
                <span
                  key={curso}
                  className={oficial.cursos?.[curso] === true ? 'ficha-etiqueta concluido' : 'ficha-etiqueta'}
                >
                  {curso}: {oficial.cursos?.[curso] === true ? '✓' : '—'}
                </span>
              ))}
            </div>
          </section>

          <section className="ficha-secao">
            <h3>ESTATÍSTICAS OPERACIONAIS</h3>
            <div className="ficha-estatisticas">
              {estatisticas.map(([titulo, valor]) => (
                <div className="ficha-estatistica" key={titulo}>
                  <span>{titulo}</span>
                  <strong>{valor}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="ficha-secao">
            <h3>HISTÓRICO DE AÇÕES</h3>
            <div className="tabela-container">
              <table>
                <thead>
                  <tr>
                    <th>DATA</th>
                    <th>OPERAÇÃO</th>
                    <th>RESULTADO</th>
                    <th>COMANDANTE</th>
                    <th>RESPONSÁVEL PELA CALL</th>
                    <th>FUNÇÃO</th>
                  </tr>
                </thead>
                <tbody>
                  {historico.map(acao => {
                    const funcoes = [
                      String(acao.comandante ?? '') === id && 'COMANDANTE',
                      String(acao.responsavelCall ?? '') === id && 'CALL',
                      (acao.participantes || []).some(item => String(item) === id) && 'PARTICIPANTE'
                    ].filter(Boolean)
                    return (
                      <tr key={acao.id}>
                        <td>{formatarData(acao.data)}</td>
                        <td>{acao.nome}</td>
                        <td>{acao.resultado}</td>
                        <td>{nomePolicial(acao.comandante)}</td>
                        <td>{nomePolicial(acao.responsavelCall)}</td>
                        <td>{funcoes.join(' / ')}</td>
                      </tr>
                    )
                  })}
                  {historico.length === 0 && (
                    <tr><td colSpan="6">Nenhuma ação registrada para este policial.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>
    </div>
  )
}
