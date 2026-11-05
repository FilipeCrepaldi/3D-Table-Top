"use client"

import type { Vec3 } from "@/lib/tipos"

const EIXOS = ["x", "y", "z"] as const

export const paraGraus = (rad: number) => Math.round(((rad * 180) / Math.PI) * 100) / 100
export const paraRadianos = (graus: number) => (graus * Math.PI) / 180
export const arredondar = (n: number) => Math.round(n * 1000) / 1000

// Três campos numéricos (x, y, z) para editar um Vec3.
// `exibir`/`ler` convertem entre o valor guardado e o mostrado (ex.: radianos <-> graus).
export function CamposVec3({
  titulo,
  valor,
  passo,
  exibir = arredondar,
  ler = (n) => n,
  desabilitado = false,
  aoMudar,
}: {
  titulo: string
  valor: Vec3
  passo: number
  exibir?: (n: number) => number
  ler?: (n: number) => number
  desabilitado?: boolean
  aoMudar: (novo: Vec3) => void
}) {
  function mudarEixo(i: number, texto: string) {
    const n = Number(texto)
    if (texto === "" || Number.isNaN(n)) return
    const novo = [...valor] as Vec3
    novo[i] = ler(n)
    aoMudar(novo)
  }

  return (
    <div style={{ margin: "6px 0" }}>
      <div style={{ opacity: 0.7 }}>{titulo}</div>
      <div style={{ display: "flex", gap: 6 }}>
        {EIXOS.map((eixo, i) => (
          <label key={eixo} style={{ flex: 1 }}>
            {eixo}
            <input
              type="number"
              step={passo}
              disabled={desabilitado}
              value={exibir(valor[i])}
              onChange={(e) => mudarEixo(i, e.target.value)}
              style={{ width: "100%" }}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

// Um campo numérico simples, com rótulo.
export function CampoNumero({
  rotulo,
  valor,
  passo,
  minimo,
  aoMudar,
}: {
  rotulo: string
  valor: number
  passo: number
  minimo?: number
  aoMudar: (n: number) => void
}) {
  return (
    <label style={{ display: "block", margin: "4px 0" }}>
      {rotulo}{" "}
      <input
        type="number"
        step={passo}
        min={minimo}
        value={arredondar(valor)}
        onChange={(e) => {
          const n = Number(e.target.value)
          if (e.target.value !== "" && !Number.isNaN(n)) aoMudar(n)
        }}
        style={{ width: 80 }}
      />
    </label>
  )
}
