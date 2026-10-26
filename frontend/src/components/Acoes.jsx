import { useState } from 'react'

function dataAtual() {
  const hoje = new Date()
  const local = new Date(hoje.getTime() - hoje.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const formularioInicial = () => ({
  nome: '',
  comandante: '',
  responsavelCall: '',
  participantes: [],
  resultado: 'VITÓRIA',
  data: dataAtual()
})

export default function Acoes({ oficiais = [], acoes = [], setAcoes }) {
  const [formulario, setFormulario] = useState(formularioInicial)
  const [pesquisa, setPesquisa] = useState('')
  const [policialSelecionado, setPolicialSelecionado] = useState('')

  function alterarCampo(campo, valor) {
    setFormulario(anterior => ({ ...anterior, [campo]: valor }))
  }

  function alternarParticipante(id) {
    setFormulario(anterior => {
      const participantes = anterior.participantes.map(String)
      const chave = String(id)
      return {
        ...anterior,
        participantes: participantes.includes(chave)
          ? participantes.filter(item => item !== chave)
          : [...participantes, chave]
      }
    })
  }

  function cadastrarAcao(evento) {
    evento.preventDefault()

    if (!formulario.nome.trim() || !formulario.comandante || !formulario.responsavelCall) {
      alert('Informe a operação, o comandante e o responsável pela CALL.')
      return
    }

    const novaAcao = {
      ...formulario,
      id: crypto.randomUUID(),
      nome: formulario.nome.trim(),
      comandante: String(formulario.comandante),
      responsavelCall: String(formulario.responsavelCall),
      participantes: [...new Set(formulario.participantes.map(String))]
    }

    setAcoes(anteriores => [novaAcao, ...anteriores])
    setFormulario(formularioInicial())
  }

  function excluirAcao(id) {
    if (!window.confirm('Deseja excluir esta ação?')) return
    setAcoes(anteriores => anteriores.filter(acao => acao.id !== id))
  }

  function alterarCallExistente(id, responsavelCall) {
    setAcoes(anteriores => anteriores.map(acao =>
      acao.id === id ? { ...acao, responsavelCall } : acao
    ))
  }

  function nomePolicial(id) {
    if (id === '' || id === null || id === undefined) return 'Não informado'
    const policial = oficiais.find(o => String(o.id) === String(id))
    return policial ? `${policial.id} — ${policial.nome}` : `ID ${id}`
  }

  function participou(acao, id) {
    const chave = String(id)
    return (
      (Array.isArray(acao.participantes) &&
        acao.participantes.some(item => String(item) === chave)) ||
      String(acao.comandante) === chave ||
      String(acao.responsavelCall ?? '') === chave
    )
  }

  const encontrados = pesquisa.trim()
    ? oficiais.filter(oficial =>
        `${oficial.id} ${oficial.nome} ${oficial.interna}`
          .toLocaleLowerCase('pt-BR')
          .includes(pesquisa.trim().toLocaleLowerCase('pt-BR'))
      )
    : []

  const selecionado = oficiais.find(
    oficial => String(oficial.id) === String(policialSelecionado)
  )

  const historicoPolicial = selecionado
    ? acoes.filter(acao => participou(acao, selecionado.id))
    : []

  const comandadas = historicoPolicial.filter(
    acao => String(acao.comandante) === String(policialSelecionado)
  ).length

  const calls = historicoPolicial.filter(
    acao => String(acao.responsavelCall ?? '') === String(policialSelecionado)
  ).length

  const vitorias = historicoPolicial.filter(acao => acao.resultado === 'VITÓRIA').length
  const derrotas = historicoPolicial.filter(acao => acao.resultado === 'DERROTA').length
  const canceladas = historicoPolicial.filter(acao => acao.resultado === 'CANCELADA').length

  return (
    <div className="modulo-acoes">
      <section className="painel">
        <div className="painel-topo">
          <h3>◈ REGISTRAR NOVA AÇÃO</h3>
        </div>

        <form className="formulario-acoes" onSubmit={cadastrarAcao}>
          <div className="campo-acoes">
            <label>OPERAÇÃO</label>
            <input
              placeholder="Ex.: Banco Fleeca Praia"
              value={formulario.nome}
              onChange={e => alterarCampo('nome', e.target.value)}
              required
            />
          </div>

          <div className="campo-acoes">
            <label>COMANDANTE</label>
            <select
              value={formulario.comandante}
              onChange={e => alterarCampo('comandante', e.target.value)}
              required
            >
              <option value="">Selecione um policial</option>
              {oficiais.map(oficial => (
                <option key={oficial.id} value={String(oficial.id)}>
                  {oficial.id} — {oficial.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-acoes">
            <label>RESPONSÁVEL PELA CALL</label>
            <select
              value={formulario.responsavelCall}
              onChange={e => alterarCampo('responsavelCall', e.target.value)}
              required
            >
              <option value="">Selecione um policial</option>
              {oficiais.map(oficial => (
                <option key={oficial.id} value={String(oficial.id)}>
                  {oficial.id} — {oficial.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="campo-acoes">
            <label>RESULTADO</label>
            <select
              value={formulario.resultado}
              onChange={e => alterarCampo('resultado', e.target.value)}
            >
              <option value="VITÓRIA">VITÓRIA</option>
              <option value="DERROTA">DERROTA</option>
              <option value="CANCELADA">CANCELADA</option>
            </select>
          </div>

          <div className="campo-acoes">
            <label>DATA</label>
            <input
              type="date"
              value={formulario.data}
              onChange={e => alterarCampo('data', e.target.value)}
              required
            />
          </div>

          <div className="campo-acoes participantes-campo">
            <label>PARTICIPANTES</label>
            <div className="lista-participantes">
              {oficiais.map(oficial => (
                <label key={oficial.id} className="participante-item">
                  <input
                    type="checkbox"
                    checked={formulario.participantes.some(
                      id => String(id) === String(oficial.id)
                    )}
                    onChange={() => alternarParticipante(oficial.id)}
                  />
                  {oficial.id} — {oficial.nome}
                </label>
              ))}
            </div>
          </div>

          <button type="submit" className="botao-adicionar">
            + REGISTRAR AÇÃO
          </button>
        </form>
      </section>

      <section className="painel">
        <div className="painel-topo">
          <h3>⌕ CONSULTAR AÇÕES POR POLICIAL</h3>
        </div>

        <div className="campo-acoes" style={{ padding: '16px 24px' }}>
          <label>PESQUISAR POR NOME, ID OU INTERNA</label>
          <input
            placeholder="Digite o nome, ID ou interna do policial..."
            value={pesquisa}
            onChange={e => {
              setPesquisa(e.target.value)
              setPolicialSelecionado('')
            }}
          />

          {pesquisa.trim() && (
            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {encontrados.map(oficial => (
                <button
                  type="button"
                  key={oficial.id}
                  className="botao-editar"
                  onClick={() => setPolicialSelecionado(String(oficial.id))}
                  style={{ padding: '10px 14px', width: 'auto', height: 'auto' }}
                >
                  {oficial.id} — {oficial.nome} ({oficial.interna})
                </button>
              ))}
              {encontrados.length === 0 && <p>Nenhum policial encontrado.</p>}
            </div>
          )}
        </div>

        {selecionado && (
          <div style={{ padding: '0 24px 24px' }}>
            <h3>{selecionado.id} — {selecionado.nome}</h3>
            <p>INTERNA: {selecionado.interna}</p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', margin: '18px 0' }}>
              {[
                ['TOTAL DE AÇÕES', historicoPolicial.length],
                ['VITÓRIAS', vitorias],
                ['DERROTAS', derrotas],
                ['CANCELADAS', canceladas],
                ['VEZES COMANDANTE', comandadas],
                ['VEZES NA CALL', calls]
              ].map(([titulo, valor]) => (
                <div
                  key={titulo}
                  style={{
                    border: '1px solid #353535',
                    borderRadius: 8,
                    padding: '14px 18px',
                    minWidth: 135,
                    background: '#151515'
                  }}
                >
                  <div style={{ fontSize: 12, color: '#aaa' }}>{titulo}</div>
                  <strong style={{ fontSize: 23 }}>{valor}</strong>
                </div>
              ))}
            </div>

            <div className="tabela-container">
              <table>
                <thead>
                  <tr>
                    <th>DATA</th>
                    <th>OPERAÇÃO</th>
                    <th>RESULTADO</th>
                    <th>COMANDANTE</th>
                    <th>RESPONSÁVEL PELA CALL</th>
                    <th>FUNÇÃO DO POLICIAL</th>
                  </tr>
                </thead>
                <tbody>
                  {historicoPolicial.map(acao => {
                    const funcoes = [
                      String(acao.comandante) === String(selecionado.id) && 'COMANDANTE',
                      String(acao.responsavelCall ?? '') === String(selecionado.id) && 'CALL',
                      (acao.participantes || []).some(
                        id => String(id) === String(selecionado.id)
                      ) && 'PARTICIPANTE'
                    ].filter(Boolean)

                    return (
                      <tr key={acao.id}>
                        <td>{acao.data}</td>
                        <td>{acao.nome}</td>
                        <td>{acao.resultado}</td>
                        <td>{nomePolicial(acao.comandante)}</td>
                        <td>{nomePolicial(acao.responsavelCall)}</td>
                        <td>{funcoes.join(' / ')}</td>
                      </tr>
                    )
                  })}
                  {historicoPolicial.length === 0 && (
                    <tr><td colSpan="6">Nenhuma ação encontrada para este policial.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="painel">
        <div className="painel-topo">
          <h3>▤ HISTÓRICO DE AÇÕES</h3>
        </div>

        <div className="tabela-container">
          <table>
            <thead>
              <tr>
                <th>DATA</th>
                <th>OPERAÇÃO</th>
                <th>COMANDANTE</th>
                <th>RESPONSÁVEL PELA CALL</th>
                <th>PARTICIPANTES</th>
                <th>RESULTADO</th>
                <th>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {acoes.map(acao => (
                <tr key={acao.id}>
                  <td>{acao.data}</td>
                  <td>{acao.nome}</td>
                  <td>{nomePolicial(acao.comandante)}</td>
                  <td>
                    {acao.responsavelCall === undefined || acao.responsavelCall === ''
                      ? (
                        <select
                          aria-label={`Responsável pela CALL de ${acao.nome}`}
                          value=""
                          onChange={e => alterarCallExistente(acao.id, e.target.value)}
                        >
                          <option value="">Não informado</option>
                          {oficiais.map(oficial => (
                            <option key={oficial.id} value={String(oficial.id)}>
                              {oficial.id} — {oficial.nome}
                            </option>
                          ))}
                        </select>
                      )
                      : nomePolicial(acao.responsavelCall)}
                  </td>
                  <td>
                    {(acao.participantes || []).map(nomePolicial).join(', ') || 'Nenhum'}
                  </td>
                  <td>{acao.resultado}</td>
                  <td>
                    <button
                      type="button"
                      className="botao-excluir"
                      onClick={() => excluirAcao(acao.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
              {acoes.length === 0 && (
                <tr><td colSpan="7">Nenhuma ação registrada.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
