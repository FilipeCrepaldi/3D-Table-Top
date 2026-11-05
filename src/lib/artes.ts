import { create } from "zustand"
import { prepararImagem } from "./imagem"
import type { Arte } from "./tipos"

type EstadoArtes = {
  artes: Arte[]
  carregando: boolean
  erro: string | null

  /** Lê as artes do banco de dados (via /api/artes). */
  iniciar: () => Promise<void>
  /** Importa uma imagem. Devolve a mensagem de erro, ou null se deu certo. */
  importar: (arquivo: File, nome: string, descricao: string) => Promise<string | null>
  atualizar: (id: string, alteracao: { nome?: string; descricao?: string }) => Promise<void>
  remover: (id: string) => Promise<void>
}

let iniciado = false

export const useArtes = create<EstadoArtes>((set, get) => ({
  artes: [],
  carregando: false,
  erro: null,

  iniciar: async () => {
    if (iniciado) return // o React em modo dev chama os efeitos duas vezes
    iniciado = true
    set({ carregando: true, erro: null })
    try {
      const resposta = await fetch("/api/artes", { cache: "no-store" })
      if (!resposta.ok) throw new Error(`falha ao ler as artes (erro ${resposta.status})`)
      set({ artes: (await resposta.json()) as Arte[], carregando: false })
    } catch (e) {
      iniciado = false
      set({ carregando: false, erro: e instanceof Error ? e.message : "Erro ao carregar" })
    }
  },

  importar: async (arquivo, nome, descricao) => {
    const png = await prepararImagem(arquivo)
    if (typeof png === "string") return png

    const form = new FormData()
    form.append("arquivo", png, "arte.png")
    form.append("nome", nome.trim() || arquivo.name.replace(/\.[^.]+$/, ""))
    form.append("descricao", descricao)

    try {
      const resposta = await fetch("/api/artes", { method: "POST", body: form })
      const corpo = (await resposta.json()) as Arte | { erro: string }
      if (!resposta.ok) return "erro" in corpo ? corpo.erro : `Erro ${resposta.status}`
      set({ artes: [...get().artes, corpo as Arte].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) })
      return null
    } catch {
      return "Não foi possível falar com o servidor."
    }
  },

  atualizar: async (id, alteracao) => {
    const resposta = await fetch(`/api/artes/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(alteracao),
    })
    if (!resposta.ok) return
    const nova = (await resposta.json()) as Arte
    set({ artes: get().artes.map((a) => (a.id === id ? nova : a)) })
  },

  remover: async (id) => {
    await fetch(`/api/artes/${encodeURIComponent(id)}`, { method: "DELETE" })
    set({ artes: get().artes.filter((a) => a.id !== id) })
  },
}))
