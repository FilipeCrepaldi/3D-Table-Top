"use client"

import { useEffect, useState } from "react"
import { Brush, Eraser, Grid3x3, PaintBucket, Trash2, Undo2 } from "lucide-react"

import { useCena } from "@/lib/store"
import { MATERIAIS_CHAO, MATERIAL_COR } from "@/lib/terreno-materiais"
import { desfazerPincelada, limparPintura, miniaturaDoMaterial, preencherTudo } from "@/lib/terreno-pintura"
import { CampoNumero } from "./campos"

// Controles para pintar o chão: material, tamanho e maciez do pincel, borracha, preencher.
export default function TerrenoPainel() {
  const pincel = useCena((s) => s.pincel)
  const terreno = useCena((s) => s.terreno)
  const mostrarGrade = useCena((s) => s.mostrarGrade)
  const { atualizarPincel, definirTerreno, alternarGrade, limparSelecao } = useCena.getState()

  // Miniaturas dos materiais (geradas no navegador, então só depois que a página abre)
  const [miniaturas, setMiniaturas] = useState<Record<string, string>>({})
  useEffect(() => {
    setMiniaturas(Object.fromEntries(MATERIAIS_CHAO.map((m) => [m.id, miniaturaDoMaterial(m.id)])))
  }, [])

  function alternarPincel() {
    if (!pincel.ativo) limparSelecao() // para não deixar um objeto selecionado com o gizmo aparecendo
    atualizarPincel({ ativo: !pincel.ativo })
  }

  return (
    <details open>
      <summary>
        <strong>Chão</strong>
      </summary>

      <button className={pincel.ativo ? "ativo" : ""} onClick={alternarPincel} style={{ width: "100%", margin: "4px 0 8px" }}>
        <Brush size={16} /> {pincel.ativo ? "Pincel ligado — clique para sair (Esc)" : "Pintar o chão"}
      </button>

      {pincel.ativo && (
        <>
          <div className="dica" style={{ marginBottom: 8 }}>
            Botão esquerdo pinta. Botão direito gira a câmera. Ctrl+Z desfaz a pincelada.
          </div>

          <div className="amostras">
            {MATERIAIS_CHAO.map((m) => (
              <button
                key={m.id}
                className={!pincel.apagar && pincel.material === m.id ? "ativo" : ""}
                onClick={() => atualizarPincel({ material: m.id, apagar: false })}
                title={m.nome}
              >
                <span className="quadro" style={{ backgroundColor: m.cor, backgroundImage: miniaturas[m.id] ? `url(${miniaturas[m.id]})` : undefined }} />
                {m.nome}
              </button>
            ))}
            <button
              className={!pincel.apagar && pincel.material === MATERIAL_COR ? "ativo" : ""}
              onClick={() => atualizarPincel({ material: MATERIAL_COR, apagar: false })}
              title="Cor lisa"
            >
              <span className="quadro" style={{ backgroundColor: pincel.cor }} />
              Cor
            </button>
            <button
              className={pincel.apagar ? "ativo" : ""}
              onClick={() => atualizarPincel({ apagar: !pincel.apagar })}
              title="Borracha: apaga a tinta e mostra a cor base"
            >
              <span className="quadro" style={{ display: "grid", placeItems: "center", background: "#10131a" }}>
                <Eraser size={16} />
              </span>
              Borracha
            </button>
          </div>

          {pincel.material === MATERIAL_COR && !pincel.apagar && (
            <label style={{ display: "block", margin: "8px 0 0" }}>
              Cor do pincel <input type="color" value={pincel.cor} onChange={(e) => atualizarPincel({ cor: e.target.value })} />
            </label>
          )}

          <div style={{ marginTop: 10 }}>
            <label style={{ display: "block" }}>
              Tamanho: {pincel.raio.toFixed(1)}
              <input type="range" min={0.3} max={12} step={0.1} value={pincel.raio} onChange={(e) => atualizarPincel({ raio: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ display: "block" }}>
              Opacidade: {Math.round(pincel.opacidade * 100)}%
              <input type="range" min={0.1} max={1} step={0.05} value={pincel.opacidade} onChange={(e) => atualizarPincel({ opacidade: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
            <label style={{ display: "block" }}>
              Borda: {pincel.dureza < 0.34 ? "macia" : pincel.dureza < 0.67 ? "média" : "firme"}
              <input type="range" min={0} max={0.95} step={0.05} value={pincel.dureza} onChange={(e) => atualizarPincel({ dureza: Number(e.target.value) })} style={{ width: "100%" }} />
            </label>
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            <button onClick={() => desfazerPincelada()} title="Ctrl+Z">
              <Undo2 size={15} /> Desfazer
            </button>
            <button
              onClick={() => preencherTudo({ material: pincel.material, cor: pincel.cor })}
              title="Cobre toda a área com o material escolhido"
              disabled={pincel.apagar}
            >
              <PaintBucket size={15} /> Preencher tudo
            </button>
            <button
              className="perigo"
              onClick={() => {
                if (window.confirm("Apagar toda a pintura do chão?")) limparPintura()
              }}
            >
              <Trash2 size={15} /> Limpar
            </button>
          </div>
        </>
      )}

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12, flexWrap: "wrap" }}>
        <label>
          Cor base <input type="color" value={terreno.corBase} onChange={(e) => definirTerreno({ corBase: e.target.value })} />
        </label>
        <button className={mostrarGrade ? "ativo" : ""} onClick={alternarGrade} title="Mostrar ou esconder a grade">
          <Grid3x3 size={15} /> Grade
        </button>
      </div>
      <div style={{ marginTop: 8 }}>
        <CampoNumero
          rotulo="Área pintável (lado)"
          valor={terreno.tamanho}
          passo={8}
          minimo={16}
          aoMudar={(n) => definirTerreno({ tamanho: Math.min(256, Math.max(16, Math.round(n))) })}
        />
        <div className="dica">Fora dessa área o chão fica na cor base. Mudar o tamanho estica a pintura.</div>
      </div>
    </details>
  )
}
