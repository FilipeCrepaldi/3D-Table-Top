import type { ConfigAmbiente, Terreno, TipoParticula } from "./tipos"

/** Cores do céu: de cima, no horizonte e "embaixo" (o que se vê abaixo do horizonte). */
export type PresetDeCeu = {
  id: string
  nome: string
  topo: string
  horizonte: string
  base: string
  estrelas: boolean
}

export const PRESETS_DE_CEU: PresetDeCeu[] = [
  { id: "dia", nome: "Dia", topo: "#3b7fd6", horizonte: "#bfe1f6", base: "#8fa8b4", estrelas: false },
  { id: "amanhecer", nome: "Amanhecer", topo: "#5b74b8", horizonte: "#ffc8a0", base: "#8a7a86", estrelas: false },
  { id: "entardecer", nome: "Entardecer", topo: "#3a3f7c", horizonte: "#ff9a5c", base: "#4b3856", estrelas: false },
  { id: "noite", nome: "Noite", topo: "#04060e", horizonte: "#1c2347", base: "#0a0c16", estrelas: true },
  { id: "nublado", nome: "Nublado", topo: "#8b939d", horizonte: "#cbd1d8", base: "#9aa1a9", estrelas: false },
  { id: "tempestade", nome: "Tempestade", topo: "#262b34", horizonte: "#59616d", base: "#323841", estrelas: false },
]

/** Atmosfera padrão: céu de dia, sem névoa e sem partículas. */
export function ambienteBase(): ConfigAmbiente {
  const dia = PRESETS_DE_CEU[0]
  return {
    nevoaAtiva: false,
    nevoaCor: "#8a8f99",
    nevoaDensidade: 0.04,
    particulas: "nenhuma",
    particulasQuantidade: 800,
    ceuTopo: dia.topo,
    ceuHorizonte: dia.horizonte,
    ceuBase: dia.base,
    estrelas: dia.estrelas,
  }
}

/** Chão padrão das cenas novas: grama escura, sem pintura. */
export function terrenoBase(): Terreno {
  return { corBase: "#4b5d3a", pintura: null, tamanho: 64 }
}

/** Chão das cenas salvas antes de existir pintura: o cinza de sempre. */
export function terrenoAntigo(): Terreno {
  return { corBase: "#3a3a3a", pintura: null, tamanho: 64 }
}

/** Quantidade sugerida ao escolher cada tipo de partícula. */
export const QUANTIDADE_PADRAO: Record<TipoParticula, number> = {
  nenhuma: 0,
  poeira: 80,
  chuva: 2000,
  neve: 800,
}
