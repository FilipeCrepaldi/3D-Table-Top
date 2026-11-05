"use client"

import { useState } from "react"
import { QUANTIDADE_PADRAO } from "@/lib/ambiente"
import { useCena } from "@/lib/store"
import type { Qualidade, TipoParticula } from "@/lib/tipos"
import { CampoNumero } from "./campos"

const PARTICULAS: { valor: TipoParticula; rotulo: string }[] = [
  { valor: "nenhuma", rotulo: "Nenhuma" },
  { valor: "poeira", rotulo: "Poeira" },
  { valor: "chuva", rotulo: "Chuva" },
  { valor: "neve", rotulo: "Neve" },
]

const QUALIDADES: { valor: Qualidade; rotulo: string }[] = [
  { valor: "baixa", rotulo: "Baixa (sem sombras)" },
  { valor: "media", rotulo: "Média" },
  { valor: "alta", rotulo: "Alta" },
]

// Névoa, partículas, estados da cena e ajustes de desempenho.
export default function Ambiente() {
  const ambiente = useCena((s) => s.ambiente)
  const estados = useCena((s) => s.estados)
  const qualidade = useCena((s) => s.qualidade)
  const mostrarFps = useCena((s) => s.mostrarFps)
  const { atualizarAmbiente, salvarEstado, aplicarEstado, removerEstado, definirQualidade, alternarFps } =
    useCena.getState()

  const [nomeEstado, setNomeEstado] = useState("")

  return (
    <>
      <details>
        <summary>
          <strong>Atmosfera</strong>
        </summary>

        <div style={{ margin: "8px 0" }}>
          <label>
            <input
              type="checkbox"
              checked={ambiente.nevoaAtiva}
              onChange={(e) => atualizarAmbiente({ nevoaAtiva: e.target.checked })}
            />{" "}
            Névoa
          </label>
          {ambiente.nevoaAtiva && (
            <div style={{ marginLeft: 20 }}>
              <label>
                Cor{" "}
                <input
                  type="color"
                  value={ambiente.nevoaCor}
                  onChange={(e) => atualizarAmbiente({ nevoaCor: e.target.value })}
                />
              </label>
              <CampoNumero
                rotulo="Densidade"
                valor={ambiente.nevoaDensidade}
                passo={0.01}
                minimo={0}
                aoMudar={(n) => atualizarAmbiente({ nevoaDensidade: n })}
              />
            </div>
          )}
        </div>

        <div style={{ margin: "8px 0" }}>
          <label>
            Partículas{" "}
            <select
              value={ambiente.particulas}
              onChange={(e) => {
                const tipo = e.target.value as TipoParticula
                atualizarAmbiente({ particulas: tipo, particulasQuantidade: QUANTIDADE_PADRAO[tipo] })
              }}
            >
              {PARTICULAS.map((p) => (
                <option key={p.valor} value={p.valor}>
                  {p.rotulo}
                </option>
              ))}
            </select>
          </label>
          {ambiente.particulas !== "nenhuma" && (
            <CampoNumero
              rotulo="Quantidade"
              valor={ambiente.particulasQuantidade}
              passo={50}
              minimo={0}
              aoMudar={(n) => atualizarAmbiente({ particulasQuantidade: Math.round(n) })}
            />
          )}
        </div>
      </details>

      <details style={{ marginTop: 8 }}>
        <summary>
          <strong>Estados da cena ({estados.length})</strong>
        </summary>
        <div style={{ opacity: 0.7, margin: "6px 0" }}>
          Guarda a iluminação e a atmosfera atuais (ex.: Dia, Noite, Tempestade) para alternar rápido.
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <input
            placeholder="Nome (ex.: Noite)"
            value={nomeEstado}
            onChange={(e) => setNomeEstado(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            onClick={() => {
              salvarEstado(nomeEstado)
              setNomeEstado("")
            }}
          >
            Guardar
          </button>
        </div>
        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
          {estados.map((e) => (
            <li key={e.id} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
              <button onClick={() => aplicarEstado(e.id)} style={{ flex: 1, textAlign: "left" }}>
                {e.nome}
              </button>
              <button onClick={() => removerEstado(e.id)} title="Excluir estado">
                ✕
              </button>
            </li>
          ))}
        </ul>
      </details>

      <details style={{ marginTop: 8 }}>
        <summary>
          <strong>Desempenho</strong>
        </summary>
        <div style={{ margin: "8px 0" }}>
          <label>
            Qualidade{" "}
            <select value={qualidade} onChange={(e) => definirQualidade(e.target.value as Qualidade)}>
              {QUALIDADES.map((q) => (
                <option key={q.valor} value={q.valor}>
                  {q.rotulo}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          <input type="checkbox" checked={mostrarFps} onChange={alternarFps} /> Mostrar FPS
        </label>
      </details>
    </>
  )
}
