// Materiais do pincel de chão. São só dados (sem tocar em Canvas), para a tela e o motor
// de pintura usarem a mesma lista.

export type EstiloDeTextura = "liso" | "granulado" | "grama" | "pedra"

export type MaterialChao = {
  id: string
  nome: string
  /** Cor principal */
  cor: string
  /** Cores usadas nas manchas que dão aspecto de material */
  variacoes: string[]
  estilo: EstiloDeTextura
}

export const MATERIAIS_CHAO: MaterialChao[] = [
  { id: "grama", nome: "Grama", cor: "#4e7a38", variacoes: ["#3d6a2b", "#62914a", "#74a259"], estilo: "grama" },
  { id: "terra", nome: "Terra", cor: "#7b5b3a", variacoes: ["#664a2e", "#8c6a46", "#58412a"], estilo: "granulado" },
  { id: "areia", nome: "Areia", cor: "#d0ba8a", variacoes: ["#c2aa78", "#dcc99c", "#e6d6ae"], estilo: "granulado" },
  { id: "neve", nome: "Neve", cor: "#eef3f8", variacoes: ["#dfe8f1", "#ffffff", "#d0dce8"], estilo: "granulado" },
  { id: "pedra", nome: "Pedra", cor: "#7d8088", variacoes: ["#6a6d75", "#8f929a", "#585b62"], estilo: "pedra" },
  { id: "lama", nome: "Lama", cor: "#4b3b2c", variacoes: ["#3d3024", "#5a4736", "#33281e"], estilo: "granulado" },
  { id: "cascalho", nome: "Cascalho", cor: "#9a9488", variacoes: ["#807a6e", "#aaa498", "#6d685e"], estilo: "pedra" },
  { id: "musgo", nome: "Musgo", cor: "#44603a", variacoes: ["#35502d", "#557a47", "#2c4426"], estilo: "grama" },
]

/** Id especial: pincel de cor lisa escolhida no seletor. */
export const MATERIAL_COR = "cor"

export const MATERIAL_POR_ID = new Map(MATERIAIS_CHAO.map((m) => [m.id, m]))
