import { useState } from 'react'

export default function Configuracoes({
  oficiais,
  acoes,
  relatorios,
  setOficiais,
  setAcoes,
  setRelatorios,
  modoCompacto,
  setModoCompacto,
  cursosDisponiveis
}) {
  const [mensagem, setMensagem] = useState('')

  function limparDados(tipo) {
    const textos = {
      acoes: 'todas as operações registradas, incluindo o relatório automático e as estatísticas operacionais',
      cursos: 'todos os cursos e capacitações marcados nos policiais',
      relatorios: 'os relatórios manuais antigos armazenados no navegador',
      tudo: 'TODOS os policiais, ações e relatórios armazenados neste navegador'
    }
    if (!window.confirm(`ATENÇÃO\n\nDeseja apagar ${textos[tipo]}?\n\nEssa ação não pode ser desfeita sem um backup.`)) return

    if (tipo === 'acoes' || tipo === 'tudo') setAcoes([])
    if (tipo === 'relatorios' || tipo === 'tudo') setRelatorios([])
    if (tipo === 'cursos') {
      setOficiais(anteriores => anteriores.map(oficial => ({ ...oficial, cursos: {} })))
    }
    if (tipo === 'tudo') setOficiais([])
    setMensagem('Limpeza concluída. Os dados selecionados foram removidos.')
  }

  return (
    <section className="core-configuracoes">
      <div className="core-config-titulo">
        <div>
          <h2><span>⚙</span> CONFIGURAÇÕES</h2>
          <p>Gerencie as configurações e os dados do sistema C.O.R.E.</p>
        </div>
        <span className="core-config-versao">VERSÃO 1.0.0</span>
      </div>

      {mensagem && (
        <div className="core-config-mensagem" role="status">
          <span>{mensagem}</span>
          <button type="button" onClick={() => setMensagem('')} aria-label="Fechar aviso">✕</button>
        </div>
      )}

      <div className="core-config-grid">
        <article className="core-config-card core-config-info">
          <h3><span>ⓘ</span> INFORMAÇÕES DO SISTEMA</h3>
          <div className="core-config-identidade">
            <div className="core-config-emblema"><img src="/logo-core.webp" alt="Logo C.O.R.E" className="logo-core-config" /></div>
            <div>
              <strong>C.O.R.E</strong>
              <p>COORDENADORIA DE RECURSOS ESPECIAIS</p>
              <div>▦ Departamento de Polícia Host</div>
              <div>▤ Versão 1.0.0</div>
              <div>◷ Armazenado no Banco de Dados</div>
            </div>
          </div>
        </article>

        <article className="core-config-card core-config-limpeza">
          <h3><span>♜</span> LIMPAR DADOS</h3>
          <p>Remova registros específicos. Faça um backup antes.</p>
          <div className="core-config-limpeza-lista">
            <button type="button" onClick={() => limparDados('acoes')}>▤ <strong>Limpar Ações</strong><small>Remove operações e estatísticas</small></button>
            <button type="button" onClick={() => limparDados('cursos')}>▧ <strong>Limpar Cursos</strong><small>Desmarca cursos e capacitações</small></button>
            <button type="button" onClick={() => limparDados('relatorios')}>▥ <strong>Limpar Relatórios Antigos</strong><small>Remove apenas registros manuais antigos</small></button>
            <button type="button" onClick={() => limparDados('tudo')}>♜ <strong>Limpar Todo o Sistema</strong><small>Apaga policiais, ações e relatórios</small></button>
          </div>
        </article>

        <article className="core-config-card core-config-preferencias">
          <h3><span>⚙</span> PREFERÊNCIAS</h3>
          <p>Ajuste a apresentação do sistema.</p>
          <div className="core-config-preferencia">
            <div><strong>Tema do Sistema</strong><small>Escuro (padrão C.O.R.E)</small></div>
            <span className="core-config-fixo">ESCURO</span>
          </div>
          <div className="core-config-preferencia">
            <div><strong>Idioma</strong><small>Português (Brasil)</small></div>
            <span className="core-config-fixo">PT-BR</span>
          </div>
          <label className="core-config-preferencia core-config-alternancia">
            <div><strong>Modo compacto</strong><small>Reduz os espaços nas tabelas e painéis</small></div>
            <input type="checkbox" checked={modoCompacto} onChange={evento => setModoCompacto(evento.target.checked)} />
          </label>
        </article>
      </div>
    </section>
  )
}
