import { create } from "zustand"
import type { Audio } from "./tipos"

const TAMANHO_MAXIMO = 40 * 1024 * 1024 // 40 MB

type EstadoAudios = {
  audios: Audio[]
  carregando: boolean
  erro: string | null

  /** Lê os sons do banco de dados (via /api/audios). */
  iniciar: () => Promise<void>
  /** Importa um som. Devolve a mensagem de erro, ou null se deu certo. */
  importar: (arquivo: File, nome: string) => Promise<string | null>
  remover: (id: string) => Promise<void>
}

let iniciado = false

export const useAudios = create<EstadoAudios>((set, get) => ({
  audios: [],
  carregando: false,
  erro: null,

  iniciar: async () => {
    if (iniciado) return // o React em modo dev chama os efeitos duas vezes
    iniciado = true
    set({ carregando: true, erro: null })
    try {
      const resposta = await fetch("/api/audios", { cache: "no-store" })
      if (!resposta.ok) throw new Error(`falha ao ler os sons (erro ${resposta.status})`)
      set({ audios: (await resposta.json()) as Audio[], carregando: false })
    } catch (e) {
      iniciado = false
      set({ carregando: false, erro: e instanceof Error ? e.message : "Erro ao carregar" })
    }
  },

  importar: async (arquivo, nome) => {
    if (arquivo.size > TAMANHO_MAXIMO) return "Arquivo maior que 40 MB."

    const form = new FormData()
    form.append("arquivo", arquivo)
    form.append("nome", nome)

    try {
      const resposta = await fetch("/api/audios", { method: "POST", body: form })
      const corpo = (await resposta.json()) as Audio | { erro: string }
      if (!resposta.ok) return "erro" in corpo ? corpo.erro : `Erro ${resposta.status}`
      set({ audios: [...get().audios, corpo as Audio].sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR")) })
      return null
    } catch {
      return "Não foi possível falar com o servidor."
    }
  },

  remover: async (id) => {
    await fetch(`/api/audios/${encodeURIComponent(id)}`, { method: "DELETE" })
    set({ audios: get().audios.filter((a) => a.id !== id) })
  },
}))
