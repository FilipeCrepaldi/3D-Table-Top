import { useBiblioteca } from "./biblioteca"
import { definirVista, lerVista } from "./camera"
import { sincronizar } from "./terreno-pintura"
import { useCena } from "./store"
import type { CenaSalva } from "./tipos"

// Ponte entre o estado da cena e o formato salvo (usada pela barra de cenas e pelo painel do mestre).

/** Monta o que será salvo a partir do estado atual. */
export function cenaAtual(): CenaSalva {
  sincronizar() // garante que a pintura do chão mais recente está no estado
  const s = useCena.getState()
  return {
    versao: 1,
    id: crypto.randomUUID(),
    nome: s.nome.trim() || "Sem nome",
    salvoEm: new Date().toISOString(),
    objetos: s.objetos,
    grupos: s.grupos,
    pontosCamera: s.pontosCamera,
    cartoes: s.cartoes,
    trilhas: s.trilhas,
    modoCamera: s.modoCamera,
    vista: lerVista(),
    luz: s.luz,
    ambiente: s.ambiente,
    terreno: s.terreno,
    estados: s.estados,
  }
}

/** Coloca uma cena carregada no estado e devolve uma mensagem (avisa se faltar algum asset). */
export function aplicarCena(cena: CenaSalva): string {
  useCena.getState().substituirCena({
    nome: cena.nome,
    objetos: cena.objetos,
    grupos: cena.grupos,
    pontosCamera: cena.pontosCamera,
    cartoes: cena.cartoes,
    trilhas: cena.trilhas,
    modoCamera: cena.modoCamera,
    luz: cena.luz,
    ambiente: cena.ambiente,
    terreno: cena.terreno,
    estados: cena.estados,
  })
  if (cena.vista) definirVista(cena.vista)

  const assets = useBiblioteca.getState().assets
  if (assets.length === 0) return `"${cena.nome}" aberta.`
  const existentes = new Set(assets.map((a) => a.id))
  const ausentes = new Set(cena.objetos.map((o) => o.assetId).filter((id) => !existentes.has(id)))
  return ausentes.size === 0
    ? `"${cena.nome}" aberta.`
    : `"${cena.nome}" aberta, mas ${ausentes.size} modelo(s) não estão na biblioteca e não aparecem.`
}
