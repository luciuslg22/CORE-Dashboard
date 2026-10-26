import { useState, useEffect } from 'react'
import './App.css'
import Login from './components/Login'
import { supabase } from './supabase'
import RecuperarSenha from './components/RecuperarSenha'
import GerenciarUsuarios from './components/GerenciarUsuarios'

import Relatorios, {
  carregarRelatorios
} from './components/Relatorios'

import Acoes from './components/Acoes'
import RankingOperacional from './components/RankingOperacional'
import FichaPolicial from './components/FichaPolicial'
import Configuracoes from './components/Configuracoes'

const oficiaisIniciais = [
  { id: 436, nome: 'Rhuan Balabala', patente: '1º SARGENTO', interna: 'COMANDO', status: 'ATIVO' },
  { id: 6828, nome: 'Mikhael Dyballa Veesse', patente: 'SOLDADO', interna: 'SUB COMANDO', status: 'ATIVO' },
  { id: 264, nome: "Nice Xeid'aura", patente: 'SOLDADO', interna: 'COORDENADOR', status: 'ATIVO' },
  { id: 286, nome: 'Catatau Geremia', patente: '3º SARGENTO', interna: 'COORDENADOR', status: 'ATIVO' },
  { id: 416, nome: 'Souza Veesse', patente: 'SOLDADO', interna: 'COORDENADOR', status: 'ATIVO' },
  { id: 594, nome: 'Abreu Harden', patente: 'SOLDADO', interna: 'COORDENADOR', status: 'ATIVO' }
]


const capacitacoesOperacionais = ['MODULAÇÃO', 'ABORDAGEM', 'ACOMPANHAMENTO', 'PRISIONAL']

const cursosDisponiveis = [
  'MERG', 'AÇ', 'GA',
  'JO', 'BFP', 'BFS', 'BFC', 'EM',
  'BOB', 'NI', 'PA', 'HR', 'BP',
  'BC'
]


const menus = [
  { icone: '▦', nome: 'Dashboard' },
  { icone: '♟', nome: 'Efetivo' },
  { icone: '▤', nome: 'Cursos' },
  { icone: '▥', nome: 'Relatórios' },
  { icone: '◈', nome: 'Ações' },
  { icone: '⚙', nome: 'Configurações' },
  { icone: '♙', nome: 'Gerenciar Usuários' }
]

const patentes = [
  'RECRUTA',
  'SOLDADO',
  'CABO',
  '3º SARGENTO',
  '2º SARGENTO',
  '1º SARGENTO',
  'SUBTENENTE',
  'TENENTE',
  'CAPITÃO',
  'MAJOR',
  'CORONEL'
]

const internas = [
  'COMANDO',
  'SUB COMANDO',
  'COORDENADOR',
  'EXECUTOR',
  'OPERADOR',
  'MEMBRO',
  'PROBATORIO'
]
function App() {
  const [conectado, setConectado] = useState(false)
  const [usuarioAtual, setUsuarioAtual] = useState(null)
  const [verificandoSessao, setVerificandoSessao] = useState(true)


useEffect(() => {
  let ativo = true

  async function recuperarSessao() {
    try {
      const { data: sessao, error: erroSessao } =
        await supabase.auth.getSession()

      if (erroSessao || !sessao.session) return

      const { data: cadastro, error: erroCadastro } =
        await supabase
          .from('usuarios')
          .select('id, nome, usuario, patente, interna, ativo')
          .eq('auth_id', sessao.session.user.id)
          .single()

      if (!ativo) return

      if (erroCadastro || !cadastro?.ativo) {
        await supabase.auth.signOut()
        return
      }

      setUsuarioAtual(cadastro)
      setConectado(true)
    } catch (erro) {
      console.error('Falha ao recuperar sessão:', erro)
    } finally {
      if (ativo) setVerificandoSessao(false)
    }
  }

  recuperarSessao()

  return () => {
    ativo = false
  }
}, [])

  function entrarAutenticado(usuario) {
  if (!usuario?.id || !usuario.ativo) return

  setUsuarioAtual(usuario)
  setConectado(true)
}

  async function sair() {
  const { error } = await supabase.auth.signOut()

  if (error) {
    alert('Não foi possível encerrar a sessão. Tente novamente.')
    return
  }

  setConectado(false)
  setUsuarioAtual(null)
  setPagina('Dashboard')
}

  const [pagina, setPagina] = useState('Dashboard')
  const [pesquisa, setPesquisa] = useState('')
  const [filtroInterna, setFiltroInterna] = useState('TODAS')
  const [filtroStatus, setFiltroStatus] = useState('TODOS')

  const [relatorios, setRelatorios] = useState(carregarRelatorios)
  const [modoCompacto, setModoCompacto] = useState(() =>
    localStorage.getItem('core_modo_compacto') === 'true'
  )

  useEffect(() => {
    localStorage.setItem('core_modo_compacto', String(modoCompacto))
  }, [modoCompacto])

const [acoes, setAcoes] = useState([])

useEffect(() => {
  if (!conectado) return

  let ativo = true

  async function carregarAcoes() {
    const { data, error } = await supabase
      .from('core_acoes')
      .select('*')
      .order('data', { ascending: false })

    if (error) {
      console.error('Erro ao carregar ações:', error)
      return
    }

    if (!ativo) return

    setAcoes(data || [])
  }

  carregarAcoes()

  const canal = supabase
    .channel('core-acoes-tempo-real')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'core_acoes'
      },
      () => carregarAcoes()
    )
    .subscribe()

  return () => {
    ativo = false
    supabase.removeChannel(canal)
  }
}, [conectado])

const estatisticasAcoes = {
  vitorias: acoes.filter(acao => acao.resultado === 'VITÓRIA').length,
  derrotas: acoes.filter(acao => acao.resultado === 'DERROTA').length,
  canceladas: acoes.filter(acao => acao.resultado === 'CANCELADA').length
}

const totalAcoes = (
  estatisticasAcoes.vitorias +
  estatisticasAcoes.derrotas +
  estatisticasAcoes.canceladas
)

const acoesValidas = (
  estatisticasAcoes.vitorias +
  estatisticasAcoes.derrotas
)

const aproveitamentoAcoes = acoesValidas > 0
  ? Math.round(estatisticasAcoes.vitorias / acoesValidas * 100)
  : 0

const relatoriosAutomaticos = Object.values(
  acoes.reduce((grupos, acao) => {
    const nome = String(acao.nome || '').trim()
    const chave = nome.toLocaleLowerCase('pt-BR')

    if (!nome) return grupos

    if (!grupos[chave]) {
      grupos[chave] = {
        id: `acao-${chave}`,
        nome,
        vitorias: 0,
        derrotas: 0,
        canceladas: 0
      }
    }

    if (acao.resultado === 'VITÓRIA') {
      grupos[chave].vitorias++
    }

    if (acao.resultado === 'DERROTA') {
      grupos[chave].derrotas++
    }

    if (acao.resultado === 'CANCELADA') {
      grupos[chave].canceladas++
    }

    return grupos
  }, {})
)

const relatoriosExibidos = [
  ...relatorios,
  ...relatoriosAutomaticos
]

  const [oficiais, setOficiais] = useState(() => {
    try {
      const salvos = localStorage.getItem('core_oficiais')
      const dados = salvos ? JSON.parse(salvos) : oficiaisIniciais

      return Array.isArray(dados) ? dados : oficiaisIniciais
    } catch {
      return oficiaisIniciais
    }
  })

  useEffect(() => {
  if (!conectado) return

  let ativo = true

  async function carregarEfetivo() {
    const { data, error } = await supabase
      .from('core_oficiais')
      .select('*')
      .order('id')

    if (error) {
      console.error('Erro ao carregar efetivo:', error.message)
      return
    }

    if (!ativo) return

    setOficiais((data || []).map(item => ({
      id: Number(item.id),
      nome: item.nome,
      patente: item.patente,
      interna: item.interna,
      status: item.status,
      dataEntrada: item.data_entrada || '',
      cursos: item.cursos || {}
    })))
  }

  carregarEfetivo()

  const canal = supabase
    .channel('core-efetivo')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'core_oficiais'
      },
      () => carregarEfetivo()
    )
    .subscribe()

  return () => {
    ativo = false
    supabase.removeChannel(canal)
  }
}, [conectado])

  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState(null)
  const [idFichaAberta, setIdFichaAberta] = useState(null)

  const [formulario, setFormulario] = useState({
    id: '',
    nome: '',
    patente: 'SOLDADO',
    interna: 'OPERADOR',
    status: 'ATIVO',
    dataEntrada: ''
  })

  useEffect(() => {
    if (!conectado) return

    let ativo = true

    function mapearOficialBanco(item) {
      return {
        id: Number(item.id),
        nome: item.nome,
        patente: item.patente,
        interna: item.interna,
        status: item.status,
        dataEntrada: item.data_entrada || '',
        cursos: item.cursos || {}
      }
    }

    async function carregarEfetivo() {
      const { data, error } = await supabase
        .from('core_oficiais')
        .select('*')
        .order('id')

      if (error) {
        console.error('Erro ao carregar efetivo:', error)
        return
      }

      if (!ativo) return

      if (data.length > 0) {
        setOficiais(data.map(mapearOficialBanco))
        return
      }

      const registros = oficiais.map(item => ({
        id: Number(item.id),
        nome: item.nome,
        patente: item.patente,
        interna: item.interna,
        status: item.status,
        data_entrada: item.dataEntrada || null,
        cursos: item.cursos || {}
      }))

      if (registros.length === 0) return

      const { data: importados, error: erroImportacao } = await supabase
        .from('core_oficiais')
        .upsert(registros, { onConflict: 'id' })
        .select('*')

      if (erroImportacao) {
        console.error('Erro ao importar efetivo local:', erroImportacao)
        alert('Não foi possível importar o efetivo para o banco compartilhado.')
        return
      }

      if (ativo && importados) {
        setOficiais(importados.map(mapearOficialBanco))
      }
    }

    carregarEfetivo()

    const canal = supabase
      .channel('core-efetivo-compartilhado')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'core_oficiais' },
        () => carregarEfetivo()
      )
      .subscribe()

    return () => {
      ativo = false
      supabase.removeChannel(canal)
    }
  }, [conectado])

  const normalizarInterna = valor => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()

  const ordemInternas = internas.map(normalizarInterna)

  const filtrados = oficiais
    .filter(oficial => {
      const correspondePesquisa = `${oficial.nome} ${oficial.id} ${oficial.interna} ${oficial.patente}`
        .toLocaleLowerCase('pt-BR')
        .includes(pesquisa.trim().toLocaleLowerCase('pt-BR'))

      if (pagina !== 'Efetivo') return correspondePesquisa

      const correspondeInterna = filtroInterna === 'TODAS' ||
        normalizarInterna(oficial.interna) === normalizarInterna(filtroInterna)
      const correspondeStatus = filtroStatus === 'TODOS' || oficial.status === filtroStatus

      return correspondePesquisa && correspondeInterna && correspondeStatus
    })
    .sort((primeiro, segundo) => {
      const posicaoPrimeiro = ordemInternas.indexOf(normalizarInterna(primeiro.interna))
      const posicaoSegundo = ordemInternas.indexOf(normalizarInterna(segundo.interna))
      const ordemPrimeiro = posicaoPrimeiro === -1 ? ordemInternas.length : posicaoPrimeiro
      const ordemSegundo = posicaoSegundo === -1 ? ordemInternas.length : posicaoSegundo

      return ordemPrimeiro - ordemSegundo || Number(primeiro.id) - Number(segundo.id)
    })

  const resumoInternas = internas.map(interna => ({
    interna,
    quantidade: oficiais.filter(oficial =>
      normalizarInterna(oficial.interna) === normalizarInterna(interna)
    ).length
  }))

  const totalAtivos = oficiais.filter(
    oficial => oficial.status === 'ATIVO'
  ).length

  const totalInativos = oficiais.filter(
    oficial => oficial.status === 'INATIVO'
  ).length

async function alterarStatus(id) {
  const oficial = oficiais.find(
    item => Number(item.id) === Number(id)
  )

  if (!oficial) return

  const novoStatus = oficial.status === 'ATIVO'
    ? 'INATIVO'
    : 'ATIVO'

  const { error } = await supabase
    .from('core_oficiais')
    .update({ status: novoStatus })
    .eq('id', id)

  if (error) {
    console.error('Erro ao alterar status:', error)
    alert('Não foi possível alterar o status: ' + error.message)
    return
  }

  setOficiais(anteriores =>
    anteriores.map(item =>
      Number(item.id) === Number(id)
        ? { ...item, status: novoStatus }
        : item
    )
  )
}

async function alterarCurso(id, curso) {
  const oficial = oficiais.find(
    item => Number(item.id) === Number(id)
  )

  if (!oficial) return

  const cursos = {
    ...(oficial.cursos || {}),
    [curso]: !(oficial.cursos || {})[curso]
  }

  const { error } = await supabase
    .from('core_oficiais')
    .update({ cursos })
    .eq('id', id)

  if (error) {
    console.error('Erro ao salvar curso:', error)
    alert('Não foi possível salvar a alteração do curso: ' + error.message)
    return
  }

  setOficiais(anteriores =>
    anteriores.map(item =>
      Number(item.id) === Number(id)
        ? { ...item, cursos }
        : item
    )
  )
}

  function abrirCadastro() {
    setEditando(null)

    setFormulario({
      id: '',
      nome: '',
      patente: 'SOLDADO',
      interna: 'OPERADOR',
      status: 'ATIVO',
      dataEntrada: new Date().toLocaleDateString('en-CA')
    })

    setModalAberto(true)
  }

  function abrirEdicao(oficial) {
    setEditando(oficial.id)
    setFormulario({ ...oficial })
    setModalAberto(true)
  }

  function fecharModal() {
    setModalAberto(false)
    setEditando(null)
  }

  function alterarFormulario(campo, valor) {
    setFormulario(anterior => ({
      ...anterior,
      [campo]: valor
    }))
  }

  async function salvarPolicial(evento) {
  evento.preventDefault()

  const id = Number(formulario.id)
  const nome = formulario.nome.trim()

  if (!Number.isSafeInteger(id) || id <= 0) {
    alert('Informe um ID válido.')
    return
  }

  if (!nome) {
    alert('Informe o nome do policial.')
    return
  }

  const idExistente = oficiais.some(
    oficial =>
      Number(oficial.id) === id &&
      Number(oficial.id) !== Number(editando)
  )

  if (idExistente) {
    alert('Já existe um policial cadastrado com este ID.')
    return
  }

  const anterior = oficiais.find(
    oficial => Number(oficial.id) === Number(editando)
  )

async function salvarPolicial(evento) {
  evento.preventDefault()

  const id = Number(formulario.id)
  const nome = formulario.nome.trim()

  if (!Number.isSafeInteger(id) || id <= 0) {
    alert('Informe um ID válido.')
    return
  }

  if (!nome) {
    alert('Informe o nome do policial.')
    return
  }

  const idExistente = oficiais.some(
    oficial =>
      Number(oficial.id) === id &&
      Number(oficial.id) !== Number(editando)
  )

  if (idExistente) {
    alert('Já existe um policial cadastrado com este ID.')
    return
  }

  const anterior = oficiais.find(
    oficial => Number(oficial.id) === Number(editando)
  )

  const dados = {
    id,
    nome,
    patente: formulario.patente,
    interna: formulario.interna,
    status: formulario.status,
    data_entrada: formulario.dataEntrada || null,
    cursos: anterior?.cursos || formulario.cursos || {}
  }

  const { data, error } = await supabase
    .from('core_oficiais')
    .upsert(dados, { onConflict: 'id' })
    .select('*')
    .single()

  if (error) {
    console.error('Erro ao salvar policial:', error)
    alert('Não foi possível salvar: ' + error.message)
    return
  }

  const oficialSalvo = {
    id: Number(data.id),
    nome: data.nome,
    patente: data.patente,
    interna: data.interna,
    status: data.status,
    dataEntrada: data.data_entrada || '',
    cursos: data.cursos || {}
  }

  setOficiais(anteriores =>
    anteriores.some(item => Number(item.id) === id)
      ? anteriores.map(item =>
          Number(item.id) === id ? oficialSalvo : item
        )
      : [...anteriores, oficialSalvo]
  )

  fecharModal()
}

    const dados = {
      id,
      nome,
      patente: formulario.patente,
      interna: formulario.interna,
      status: formulario.status,
      data_entrada: formulario.dataEntrada || null,
      cursos: formulario.cursos || {}
    }

    const { data, error } = await supabase
      .from('core_oficiais')
      .upsert(dados, { onConflict: 'id' })
      .select('*')
      .single()

    if (error) {
      console.error('Erro ao salvar policial:', error)
      alert('Não foi possível salvar o policial no banco compartilhado.')
      return
    }

    const oficialSalvo = {
      id: Number(data.id),
      nome: data.nome,
      patente: data.patente,
      interna: data.interna,
      status: data.status,
      dataEntrada: data.data_entrada || '',
      cursos: data.cursos || {}
    }

    setOficiais(anteriores => {
      const existe = anteriores.some(item => Number(item.id) === id)
      return existe
        ? anteriores.map(item => Number(item.id) === id ? oficialSalvo : item)
        : [...anteriores, oficialSalvo]
    })

    fecharModal()
  }

async function excluirPolicial(oficial) {
  const confirmado = window.confirm(
    `Deseja realmente excluir o policial ${oficial.nome} (ID ${oficial.id})?`
  )

  if (!confirmado) return

  const { error } = await supabase
    .from('core_oficiais')
    .delete()
    .eq('id', oficial.id)

  if (error) {
    console.error('Erro ao excluir policial:', error)
    alert('Não foi possível excluir: ' + error.message)
    return
  }

  setOficiais(anteriores =>
    anteriores.filter(
      item => Number(item.id) !== Number(oficial.id)
    )
  )
}

  const indicadores = [
    ['EFETIVO TOTAL', oficiais.length, '♟'],
    ['EM ATIVIDADE', totalAtivos, '↗'],
    ['INATIVOS', totalInativos, '↘'],
    ['APROVEITAMENTO', `${aproveitamentoAcoes}%`, '▥'],
    ['VITÓRIAS', estatisticasAcoes.vitorias, '★'],
    ['DERROTAS', estatisticasAcoes.derrotas, '✕'],
    ['TOTAL DE AÇÕES', totalAcoes, '▤']
  ]

  if (verificandoSessao) {
    return <div role="status" style={{ padding: 24 }}>Verificando sessão do C.O.R.E...</div>
  }

  if (!conectado) {
    return <Login aoEntrar={entrarAutenticado} />
  }

  return (
   <div className={`sistema ${modoCompacto ? 'core-compacto' : ''}`}>
  <aside className="menu-lateral">
    <div className="marca">
      <div className="simbolo">
        <img
          src={`${import.meta.env.BASE_URL}logo-core.webp`}
          alt="Logo C.O.R.E"
          className="logo-core-lateral"
        />
      </div>
      <h2>C.O.R.E</h2>
      <p>COORDENADORIA DE RECURSOS ESPECIAIS</p>
    </div>

        <nav>
          {menus.filter(item => item.nome !== 'Gerenciar Usuários' || usuarioAtual?.interna === 'ALTO COMANDO').map(item => (
            <button
              key={item.nome}
              className={
                pagina === item.nome
                  ? 'menu-item ativo'
                  : 'menu-item'
              }
              onClick={() => setPagina(item.nome)}
            >
              <span>{item.icone}</span>
              {item.nome}
            </button>
          ))}
        </nav>

        <div className="menu-rodape">
          COORDENADORIA DE RECURSOS ESPECIAIS
          <small>SISTEMA C.O.R.E v1.0</small>
        </div>
      </aside>

      <main className="conteudo">
        <header className="cabecalho">
          <div>
            <p>COORDENADORIA DE RECURSOS ESPECIAIS</p>
            <h1>C.O.R.E</h1>
            <span>♦️ • Quem teme ser vencido tem a certeza da derrota.</span>
          </div>

          <div className="usuario">
            <div className="avatar">C</div>

            <div>
              <strong>{usuarioAtual?.nome || 'Usuário'}</strong>
              <small>{usuarioAtual?.patente} • {usuarioAtual?.interna}</small>
              <button type="button" onClick={sair} style={{ display: 'block', marginTop: 8, background: '#b91c1c', color: '#fff', border: 0, borderRadius: 6, padding: '6px 10px', cursor: 'pointer' }}>SAIR DO SISTEMA</button>
            </div>
          </div>
        </header>

        <section className="indicadores">
          {indicadores.map((indicador, i) => (
            <div className="indicador" key={i}>
              <span className="indicador-icone">
                {indicador[2]}
              </span>

              <div>
                <h2>{indicador[1]}</h2>
                <p>{indicador[0]}</p>
              </div>
            </div>
          ))}
        </section>

        {pagina !== 'Relatórios' && pagina !== 'Configurações' && pagina !== 'Gerenciar Usuários' && <section className="painel">
          <div className="painel-topo">
            <h3>▦ {pagina === 'Dashboard' ? 'REGISTRO OPERACIONAL' : pagina.toUpperCase()}</h3>
            {(pagina === 'Dashboard' || pagina === 'Efetivo' || pagina === 'Cursos') && (
              <div className="ferramentas">
                <input
                  placeholder="Pesquisar nome, ID ou interna..."
                  value={pesquisa}
                  onChange={e => setPesquisa(e.target.value)}
                />
                {(pagina === 'Dashboard' || pagina === 'Efetivo') && (
                  <button className="botao-adicionar" onClick={abrirCadastro}>
                    + Adicionar Policial
                  </button>
                )}
              </div>
            )}
          </div>

          {pagina === 'Efetivo' && (
            <div className="resumo-efetivo">
              {resumoInternas.map(item => (
                <div className="resumo-interna" key={item.interna}>
                  <span className="resumo-interna-titulo">{item.interna === 'PROBATORIO' ? 'PROBATÓRIO' : item.interna}</span>
                  <strong className="resumo-interna-numero">{item.quantidade}</strong>
                </div>
              ))}
            </div>
          )}

          {pagina === 'Efetivo' && (
            <div className="filtros-efetivo">
              <div className="filtro-efetivo-campo">
                <label htmlFor="filtro-interna">FILTRAR POR INTERNA</label>
                <select
                  id="filtro-interna"
                  value={filtroInterna}
                  onChange={evento => setFiltroInterna(evento.target.value)}
                >
                  <option value="TODAS">TODAS AS INTERNAS</option>
                  {internas.map(interna => (
                    <option key={interna} value={interna}>
                      {interna === 'PROBATORIO' ? 'PROBATÓRIO' : interna}
                    </option>
                  ))}
                </select>
              </div>
              <div className="filtro-efetivo-campo">
                <label htmlFor="filtro-status">FILTRAR POR STATUS</label>
                <select
                  id="filtro-status"
                  value={filtroStatus}
                  onChange={evento => setFiltroStatus(evento.target.value)}
                >
                  <option value="TODOS">TODOS OS STATUS</option>
                  <option value="ATIVO">ATIVOS</option>
                  <option value="INATIVO">INATIVOS</option>
                </select>
              </div>
              <div className="filtros-efetivo-acoes">
                <span>{filtrados.length} policial(is) encontrado(s)</span>
                <button
                  type="button"
                  onClick={() => {
                    setFiltroInterna('TODAS')
                    setFiltroStatus('TODOS')
                    setPesquisa('')
                  }}
                >
                  LIMPAR FILTROS
                </button>
              </div>
            </div>
          )}

          {(pagina === 'Dashboard' || pagina === 'Efetivo') ? (
            <div className="tabela-container">
              <table>
                <thead>
                  <tr>
                    <th>ID</th><th>PATENTE</th><th>INTERNA</th><th>NOME</th>
                    {capacitacoesOperacionais.map(curso => <th key={curso}>{curso}</th>)}
                    <th>DATA DE ENTRADA</th><th>STATUS</th><th>AÇÕES</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(oficial => (
                    <tr key={oficial.id}>
                      <td>{oficial.id}</td>
                      <td>{oficial.patente}</td>
                      <td>{oficial.interna}</td>
                      <td>
                        {pagina === 'Efetivo' ? (
                          <button
                            type="button"
                            className="nome-policial-ficha"
                            title="Abrir ficha individual"
                            onClick={() => setIdFichaAberta(oficial.id)}
                          >
                            {oficial.nome}
                          </button>
                        ) : oficial.nome}
                      </td>
                      {capacitacoesOperacionais.map(curso => (
                        <td key={curso}>
                          <input
                            type="checkbox"
                            checked={oficial.cursos?.[curso] === true}
                            onChange={() => alterarCurso(oficial.id, curso)}
                          />
                        </td>
                      ))}
                      <td>{oficial.dataEntrada ? oficial.dataEntrada.split('-').reverse().join('/') : '—'}</td>
                      <td>
                        <button
                          className={oficial.status === 'ATIVO' ? 'status ativo-status' : 'status inativo-status'}
                          onClick={() => alterarStatus(oficial.id)}
                        >
                          {oficial.status}
                        </button>
                      </td>
                      <td>
                        <div className="acoes-tabela">
                          <button className="botao-editar" title="Editar policial" onClick={() => abrirEdicao(oficial)}>✎</button>
                          <button className="botao-excluir" title="Excluir policial" onClick={() => excluirPolicial(oficial)}>✕</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr><td colSpan={capacitacoesOperacionais.length + 7}>Nenhum policial encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : pagina === 'Cursos' ? (
            <div className="tabela-container">
              <table className="tabela-cursos">
                <thead>
                  <tr>
                    <th>ID</th><th>NOME</th><th>INTERNA</th>
                    {cursosDisponiveis.map(curso => <th key={curso}>{curso}</th>)}
                    <th>CONCLUÍDOS</th>
                  </tr>
                </thead>
                <tbody>
                  {filtrados.map(oficial => (
                    <tr key={oficial.id}>
                      <td>{oficial.id}</td>
                      <td>{oficial.nome}</td>
                      <td>{oficial.interna}</td>
                      {cursosDisponiveis.map(curso => (
                        <td key={curso}>
                          <input
                            type="checkbox"
                            checked={oficial.cursos?.[curso] === true}
                            onChange={() => alterarCurso(oficial.id, curso)}
                          />
                        </td>
                      ))}
                      <td><span className="contador-cursos">{contarCursos(oficial)} / {cursosDisponiveis.length}</span></td>
                    </tr>
                  ))}
                  {filtrados.length === 0 && (
                    <tr><td colSpan={cursosDisponiveis.length + 4}>Nenhum policial encontrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : pagina === 'Ações' ? (
  <Acoes
  oficiais={oficiais}
  acoes={acoes}
  setAcoes={setAcoes}
/>
) : (
  <div className="pagina-futura">
    {pagina === 'Relatórios' ? 'Gerencie os relatórios na tabela abaixo.' : `O módulo ${pagina} será desenvolvido nas próximas etapas.`}</div>
          )}
        </section>}

        {pagina === 'Gerenciar Usuários' && usuarioAtual?.interna === 'ALTO COMANDO' && (
          <GerenciarUsuarios usuarioAtual={usuarioAtual} />
        )}

        {pagina === 'Configurações' && (
          <Configuracoes
            oficiais={oficiais}
            acoes={acoes}
            relatorios={relatorios}
            setOficiais={setOficiais}
            setAcoes={setAcoes}
            setRelatorios={setRelatorios}
            modoCompacto={modoCompacto}
            setModoCompacto={setModoCompacto}
            cursosDisponiveis={cursosDisponiveis}
          />
        )}

        {pagina === 'Dashboard' && (
          <RankingOperacional oficiais={oficiais} acoes={acoes} />
        )}

        {(pagina === 'Dashboard' || pagina === 'Relatórios') && (
            <Relatorios
              automaticos={relatoriosAutomaticos}
              completo={pagina === 'Relatórios'}
            />
        )}

        <footer>
          C.O.R.E © 2026 — COORDENADORIA DE RECURSOS ESPECIAIS
        </footer>

        {idFichaAberta !== null && (
          <FichaPolicial
            oficial={oficiais.find(item => item.id === idFichaAberta)}
            oficiais={oficiais}
            acoes={acoes}
            cursosDisponiveis={cursosDisponiveis}
            capacitacoesOperacionais={capacitacoesOperacionais}
            aoFechar={() => setIdFichaAberta(null)}
          />
        )}

        {modalAberto && (
          <div
            className="modal-fundo"
            onClick={fecharModal}
          >
            <div
              className="modal-conteudo"
              onClick={evento => evento.stopPropagation()}
            >
              <div className="modal-cabecalho">
                <div>
                  <h2>
                    {editando !== null
                      ? 'EDITAR POLICIAL'
                      : 'ADICIONAR POLICIAL'}
                  </h2>

                  <p>
                    COORDENADORIA DE RECURSOS ESPECIAIS — C.O.R.E
                  </p>
                </div>

                <button
                  type="button"
                  onClick={fecharModal}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={salvarPolicial}>
                <label htmlFor="policial-id">
                  ID DO POLICIAL
                </label>

                <input
                  id="policial-id"
                  type="number"
                  min="1"
                  required
                  value={formulario.id}
                  onChange={e =>
                    alterarFormulario('id', e.target.value)
                  }
                />

                <label htmlFor="policial-nome">
                  NOME DO POLICIAL
                </label>

                <input
                  id="policial-nome"
                  required
                  value={formulario.nome}
                  onChange={e =>
                    alterarFormulario('nome', e.target.value)
                  }
                />

                <label htmlFor="policial-patente">
                  PATENTE
                </label>

                <select
                  id="policial-patente"
                  value={formulario.patente}
                  onChange={e =>
                    alterarFormulario('patente', e.target.value)
                  }
                >
                  {patentes.map(patente => (
                    <option key={patente} value={patente}>
                      {patente}
                    </option>
                  ))}
                </select>

                <label htmlFor="policial-interna">
                  INTERNA
                </label>

                <select
                  id="policial-interna"
                  value={formulario.interna}
                  onChange={e =>
                    alterarFormulario('interna', e.target.value)
                  }
                >
                  {internas.map(interna => (
                    <option key={interna} value={interna}>
                      {interna}
                    </option>
                  ))}
                </select>

                <label htmlFor="policial-data-entrada">
                  DATA DE ENTRADA NA UNIDADE
                </label>

                <input
                  id="policial-data-entrada"
                  type="date"
                  value={formulario.dataEntrada || ''}
                  onChange={e => alterarFormulario('dataEntrada', e.target.value)}
                />

                <label htmlFor="policial-status">
                  STATUS
                </label>

                <select
                  id="policial-status"
                  value={formulario.status}
                  onChange={e =>
                    alterarFormulario('status', e.target.value)
                  }
                >
                  <option value="ATIVO">ATIVO</option>
                  <option value="INATIVO">INATIVO</option>
                </select>

                <div className="modal-botoes">
                  <button
                    type="button"
                    className="botao-cancelar"
                    onClick={fecharModal}
                  >
                    CANCELAR
                  </button>

                  <button
                    type="submit"
                    className="botao-salvar"
                  >
                    {editando !== null
                      ? 'SALVAR ALTERAÇÕES'
                      : 'CADASTRAR POLICIAL'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
export default App
  