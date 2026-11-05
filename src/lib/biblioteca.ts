import { create } from "zustand"
import type { Asset } from "./tipos"

const TAMANHO_MAXIMO = 50 * 1024 * 1024 // 50 MB

/** O que o usuário informa ao importar um modelo. */
export type DadosImportacao = {
  autor: string
  licenca: string
  tipo: string
  estilo: string
}

type EstadoBiblioteca = {
  assets: Asset[]
  carregando: boolean
  erro: string | null

  /** Lê os assets do banco de dados (via /api/assets). */
  iniciar: () => Promise<void>
  /** Importa um GLB. Devolve a mensagem de erro, ou null se deu certo. */
  importar: (arquivo: File, dados: DadosImportacao) => Promise<string | null>
}

let iniciado = false

export const useBiblioteca = create<EstadoBiblioteca>((set, get) => ({
  assets: [],
  carregando: false,
  erro: null,

  iniciar: async () => {
    if (iniciado) return // o React em modo dev chama os efeitos duas vezes
    iniciado = true
    set({ carregando: true, erro: null })
    try {
      const resposta = await fetch("/api/assets", { cache: "no-store" })
      if (!resposta.ok) throw new Error(`falha ao ler o banco (erro ${resposta.status})`)
      set({ assets: (await resposta.json()) as Asset[], carregando: false })
    } catch (e) {
      iniciado = false
      set({ carregando: false, erro: e instanceof Error ? e.message : "Erro ao carregar" })
    }
  },

  importar: async (arquivo, dados) => {
    // Checagem rápida aqui para dar resposta imediata; o servidor valida de novo.
    if (!arquivo.name.toLowerCase().endsWith(".glb")) return "O arquivo precisa ser .glb."
    if (arquivo.size > TAMANHO_MAXIMO) return "Arquivo maior que 50 MB."

    const form = new FormData()
    form.append("arquivo", arquivo)
    form.append("autor", dados.autor)
    form.append("licenca", dados.licenca)
    form.append("tipo", dados.tipo)
    form.append("estilo", dados.estilo)

    try {
      const resposta = await fetch("/api/assets", { method: "POST", body: form })
      const corpo = (await resposta.json()) as Asset | { erro: string }
      if (!resposta.ok) return "erro" in corpo ? corpo.erro : `Erro ${resposta.status}`
      set({ assets: [...get().assets, corpo as Asset] })
      return null
    } catch {
      return "Não foi possível falar com o servidor."
    }
  },
}))
