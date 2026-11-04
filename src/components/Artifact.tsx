import type { Artifact as ArtifactT } from '../data/org'

const KIND: Record<ArtifactT['kind'], string> = {
  doc: 'Document',
  table: 'Table',
  list: 'List',
  diff: 'Diff',
}

export function ArtifactCard({ art }: { art: ArtifactT }) {
  return (
    <article className="artifact">
      <header className="art-hd">
        <div className="art-title-row">
          <span className={`art-kind k-${art.kind}`}>{KIND[art.kind]}</span>
          <h4>{art.title}</h4>
        </div>
        <span className="art-meta">{art.meta}</span>
      </header>

      {art.kind === 'doc' && (
        <div className="art-body">
          {art.body?.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      )}

      {art.kind === 'table' && (
        <div className="art-table-wrap">
          <table className="art-table">
            <thead>
              <tr>
                {art.columns?.map((c) => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {art.rows?.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td key={j}>{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {art.kind === 'list' && (
        <ul className="art-list">
          {art.items?.map((it, i) => (
            <li key={i}>
              <span className="li-label">{it.label}</span>
              {it.sub && <span className="li-sub">{it.sub}</span>}
            </li>
          ))}
        </ul>
      )}

      {art.kind === 'diff' && (
        <pre className="art-diff">
          {art.diff?.map((l, i) => (
            <div key={i} className={`dl ${l.sign === '+' ? 'add' : l.sign === '-' ? 'del' : ''}`}>
              <span className="dl-sign">{l.sign}</span>
              <span className="dl-text">{l.text}</span>
            </div>
          ))}
        </pre>
      )}
    </article>
  )
}
