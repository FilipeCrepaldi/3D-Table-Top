"use client"

import { useCena } from "@/lib/store"
import { PRESETS_DE_CEU } from "@/lib/ambiente"

// Escolha do céu: presets prontos ou cores à mão.
export default function CeuPainel() {
  const ambiente = useCena((s) => s.ambiente)
  const { atualizarAmbiente } = useCena.getState()

  const usarPreset = (id: string) => {
    const p = PRESETS_DE_CEU.find((x) => x.id === id)
    if (p) atualizarAmbiente({ ceuTopo: p.topo, ceuHorizonte: p.horizonte, ceuBase: p.base, estrelas: p.estrelas })
  }

  return (
    <details open>
      <summary>
        <strong>Céu</strong>
      </summary>

      <div className="amostras" style={{ margin: "4px 0 8px" }}>
        {PRESETS_DE_CEU.map((p) => {
          const ativo = p.topo === ambiente.ceuTopo && p.horizonte === ambiente.ceuHorizonte && p.base === ambiente.ceuBase
          return (
            <button key={p.id} className={ativo ? "ativo" : ""} onClick={() => usarPreset(p.id)} title={p.nome}>
              <span className="quadro" style={{ backgroundImage: `linear-gradient(${p.topo}, ${p.horizonte} 70%, ${p.base})` }} />
              {p.nome}
            </button>
          )
        })}
      </div>

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
        <label>
          Alto <input type="color" value={ambiente.ceuTopo} onChange={(e) => atualizarAmbiente({ ceuTopo: e.target.value })} />
        </label>
        <label>
          Horizonte <input type="color" value={ambiente.ceuHorizonte} onChange={(e) => atualizarAmbiente({ ceuHorizonte: e.target.value })} />
        </label>
        <label>
          Abaixo <input type="color" value={ambiente.ceuBase} onChange={(e) => atualizarAmbiente({ ceuBase: e.target.value })} />
        </label>
      </div>

      <label style={{ display: "block", marginTop: 8 }}>
        <input type="checkbox" checked={ambiente.estrelas} onChange={(e) => atualizarAmbiente({ estrelas: e.target.checked })} /> Estrelas
      </label>

      <div style={{ marginTop: 8 }}>
        <button onClick={() => atualizarAmbiente({ nevoaCor: ambiente.ceuHorizonte })} title="Faz a névoa combinar com o horizonte">
          Névoa na cor do horizonte
        </button>
      </div>
      <div className="dica" style={{ marginTop: 6 }}>
        O céu não muda a iluminação: ajuste o sol e a luz ambiente (ou use os Estados, ex.: Noite).
      </div>
    </details>
  )
}
