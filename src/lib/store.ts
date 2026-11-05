import { create } from "zustand"
import { ambienteBase, terrenoBase } from "./ambiente"
import { luzBase, novaLuzPontual } from "./luz"
import { aplicarGrupo } from "./matematica"
import { luzesDaTaverna, taverna } from "./taverna"
import type {
  AlteracaoObjeto,
  ConfigAmbiente,
  ConfigLuz,
  EstadoDaCena,
  GrupoCena,
  LuzPontual,
  ModoCamera,
  ObjetoCena,
  PontoCamera,
  Qualidade,
  Terreno,
  TrilhaCena,
  Vec3,
  VistaCamera,
} from "./tipos"

export type ModoTransformacao = "translate" | "rotate" | "scale"

/** Tudo que uma cena guarda (o que é salvo e carregado). */
export type DadosDaCena = {
  nome: string
  objetos: ObjetoCena[]
  grupos: GrupoCena[]
  pontosCamera: PontoCamera[]
  /** Ids das artes mostradas como cartão na apresentação */
  cartoes: string[]
  /** Sons da cena (música, ambiente), com volume e repetição */
  trilhas: TrilhaCena[]
  modoCamera: ModoCamera
  luz: ConfigLuz
  ambiente: ConfigAmbiente
  terreno: Terreno
  estados: EstadoDaCena[]
}

/** Ferramenta de pintura do chão (preferência do aplicativo, não é salva). */
export type Pincel = {
  ativo: boolean
  apagar: boolean
  /** id de um material (grama, terra...) ou "cor" para a cor lisa abaixo */
  material: string
  cor: string
  /** Raio em unidades do mundo */
  raio: number
  /** 0 a 1 */
  opacidade: number
  /** 0 (bordas bem macias) a 1 (bordas firmes) */
  dureza: number
}

type EstadoCena = DadosDaCena & {
  /** Objeto selecionado (para mover, girar, escalar), ou null */
  selecionadoId: string | null
  /** Grupo selecionado, ou null. Nunca é usado junto com selecionadoId. */
  grupoSelecionadoId: string | null
  /** Luz selecionada: o id de uma luz pontual, ou "sol". Nunca junto com objeto/grupo. */
  luzSelecionadaId: string | null
  /** Objetos marcados para agrupar (Shift+clique ou caixinhas da lista) */
  multiSelecao: string[]
  /** Ferramenta ativa do gizmo (nomes do Drei) */
  modo: ModoTransformacao
  /** Encaixar em passos fixos ao arrastar */
  encaixe: boolean

  pincel: Pincel
  mostrarGrade: boolean
  /** Volume geral (0 a 1), por cima do volume de cada trilha. Preferência, não é salvo. */
  volumeGeral: number
  /** Modo de apresentação: esconde as ferramentas de edição (não é salvo) */
  apresentando: boolean

  /** Desempenho (preferência do aplicativo, não faz parte da cena) */
  qualidade: Qualidade
  mostrarFps: boolean
  fps: number
  chamadas: number
  triangulos: number

  definirModo: (modo: ModoTransformacao) => void
  alternarEncaixe: () => void

  adicionar: (assetId: string, nome: string, posicao?: Vec3, escala?: number) => void
  remover: (id: string) => void
  atualizar: (id: string, alteracao: AlteracaoObjeto) => void
  duplicar: (id: string) => void

  selecionar: (id: string | null) => void
  selecionarGrupo: (id: string | null) => void
  selecionarLuz: (id: string | null) => void
  alternarMulti: (id: string) => void
  definirMulti: (ids: string[]) => void
  limparSelecao: () => void

  agrupar: (nome: string) => void
  desagrupar: (grupoId: string) => void
  atualizarGrupo: (id: string, alteracao: Partial<Omit<GrupoCena, "id" | "travado">>) => void
  alternarTravaGrupo: (id: string) => void
  alternarTravaObjeto: (id: string) => void
  removerGrupo: (id: string) => void
  duplicarGrupo: (id: string) => void

  alternarOculto: (id: string) => void
  alternarOcultoGrupo: (id: string) => void

  definirTerreno: (alteracao: Partial<Terreno>) => void
  atualizarPincel: (alteracao: Partial<Pincel>) => void
  alternarGrade: () => void
  adicionarTrilha: (audioId: string) => void
  atualizarTrilha: (id: string, alteracao: Partial<Omit<TrilhaCena, "id">>) => void
  removerTrilha: (id: string) => void
  definirVolumeGeral: (volume: number) => void
  alternarCartao: (arteId: string) => void
  salvarPontoCamera: (nome: string, vista: VistaCamera) => void
  removerPontoCamera: (id: string) => void
  iniciarApresentacao: () => void
  sairApresentacao: () => void

  definirNome: (nome: string) => void
  definirModoCamera: (modo: ModoCamera) => void
  atualizarLuz: (alteracao: Partial<Omit<ConfigLuz, "pontuais">>) => void
  adicionarLuzPontual: () => void
  atualizarLuzPontual: (id: string, alteracao: Partial<Omit<LuzPontual, "id">>) => void
  removerLuzPontual: (id: string) => void
  atualizarAmbiente: (alteracao: Partial<ConfigAmbiente>) => void
  /** Guarda a luz e a atmosfera atuais como um estado (substitui o de mesmo nome). */
  salvarEstado: (nome: string) => void
  aplicarEstado: (id: string) => void
  removerEstado: (id: string) => void
  definirQualidade: (qualidade: Qualidade) => void
  alternarFps: () => void
  /** Troca a cena inteira (usado ao carregar). */
  substituirCena: (dados: DadosDaCena) => void
}

const SEM_SELECAO = {
  selecionadoId: null,
  grupoSelecionadoId: null,
  luzSelecionadaId: null as string | null,
  multiSelecao: [] as string[],
}

// "medieval/Prop_Crate" -> "Prop Crate"
function nomeDoAsset(assetId: string): string {
  return (assetId.split("/").pop() ?? assetId).replace(/_/g, " ")
}

function novoObjeto(assetId: string, posicao: Vec3 = [0, 0, 0], nome?: string, escala = 1): ObjetoCena {
  return {
    id: crypto.randomUUID(),
    nome: nome ?? nomeDoAsset(assetId),
    assetId,
    posicao,
    rotacao: [0, 0, 0],
    escala: [escala, escala, escala],
  }
}

/** Um objeto está bloqueado se ele mesmo ou o grupo dele estiver travado. */
function estaBloqueado(o: ObjetoCena, grupos: GrupoCena[]): boolean {
  return o.travado === true || grupos.some((g) => g.id === o.grupoId && g.travado)
}

/** Remove grupos que ficaram sem nenhum objeto. */
function semGruposVazios(grupos: GrupoCena[], objetos: ObjetoCena[]): GrupoCena[] {
  const usados = new Set(objetos.map((o) => o.grupoId))
  return grupos.filter((g) => usados.has(g.id))
}

export const useCena = create<EstadoCena>((set) => ({
  nome: "Taverna",
  objetos: taverna(),
  grupos: [],
  pontosCamera: [],
  cartoes: [],
  trilhas: [],
  modoCamera: "isometrica",
  luz: { ...luzBase(), pontuais: luzesDaTaverna() },
  ambiente: ambienteBase(),
  terreno: terrenoBase(),
  estados: [],

  ...SEM_SELECAO,
  modo: "translate",
  encaixe: false,

  pincel: { ativo: false, apagar: false, material: "grama", cor: "#c8a46a", raio: 2, opacidade: 0.9, dureza: 0.5 },
  mostrarGrade: true,
  volumeGeral: 1,
  apresentando: false,

  qualidade: "media",
  mostrarFps: false,
  fps: 0,
  chamadas: 0,
  triangulos: 0,

  definirModo: (modo) => set({ modo }),
  alternarEncaixe: () => set((s) => ({ encaixe: !s.encaixe })),

  adicionar: (assetId, nome, posicao, escala) =>
    set((s) => {
      const objeto = novoObjeto(assetId, posicao, nome, escala)
      return { objetos: [...s.objetos, objeto], ...SEM_SELECAO, selecionadoId: objeto.id }
    }),

  remover: (id) =>
    set((s) => {
      const objeto = s.objetos.find((o) => o.id === id)
      if (!objeto || estaBloqueado(objeto, s.grupos)) return s
      const objetos = s.objetos.filter((o) => o.id !== id)
      return {
        objetos,
        grupos: semGruposVazios(s.grupos, objetos),
        selecionadoId: s.selecionadoId === id ? null : s.selecionadoId,
        multiSelecao: s.multiSelecao.filter((m) => m !== id),
      }
    }),

  atualizar: (id, alteracao) =>
    set((s) => {
      const objeto = s.objetos.find((o) => o.id === id)
      if (!objeto || estaBloqueado(objeto, s.grupos)) return s
      return { objetos: s.objetos.map((o) => (o.id === id ? { ...o, ...alteracao } : o)) }
    }),

  duplicar: (id) =>
    set((s) => {
      const original = s.objetos.find((o) => o.id === id)
      if (!original) return s
      const copia: ObjetoCena = {
        ...original,
        id: crypto.randomUUID(),
        travado: undefined,
        // desloca um pouco para a cópia não ficar escondida atrás do original
        posicao: [original.posicao[0] + 0.5, original.posicao[1], original.posicao[2] + 0.5],
      }
      return { objetos: [...s.objetos, copia], ...SEM_SELECAO, selecionadoId: copia.id }
    }),

  // ----- Seleção -----

  selecionar: (id) => set({ ...SEM_SELECAO, selecionadoId: id }),
  selecionarGrupo: (id) => set({ ...SEM_SELECAO, grupoSelecionadoId: id }),
  selecionarLuz: (id) => set({ ...SEM_SELECAO, luzSelecionadaId: id }),

  alternarMulti: (id) =>
    set((s) => ({
      ...SEM_SELECAO,
      multiSelecao: s.multiSelecao.includes(id)
        ? s.multiSelecao.filter((m) => m !== id)
        : [...s.multiSelecao, id],
    })),

  definirMulti: (ids) => set({ ...SEM_SELECAO, multiSelecao: ids }),
  limparSelecao: () => set({ ...SEM_SELECAO }),

  // ----- Grupos -----

  agrupar: (nome) =>
    set((s) => {
      const marcados = new Set(s.multiSelecao)
      const membros = s.objetos.filter((o) => marcados.has(o.id) && !o.grupoId && !o.travado)
      if (membros.length === 0) return s

      // O ponto de giro do grupo fica no centro da área ocupada, no chão
      const xs = membros.map((o) => o.posicao[0])
      const zs = membros.map((o) => o.posicao[2])
      const cx = (Math.min(...xs) + Math.max(...xs)) / 2
      const cz = (Math.min(...zs) + Math.max(...zs)) / 2

      const grupo: GrupoCena = {
        id: crypto.randomUUID(),
        nome: nome.trim() || `Grupo ${s.grupos.length + 1}`,
        travado: false,
        posicao: [cx, 0, cz],
        rotacao: [0, 0, 0],
        escala: [1, 1, 1],
      }
      const ids = new Set(membros.map((o) => o.id))
      const objetos = s.objetos.map((o) =>
        ids.has(o.id)
          ? { ...o, grupoId: grupo.id, posicao: [o.posicao[0] - cx, o.posicao[1], o.posicao[2] - cz] as Vec3 }
          : o,
      )
      return { objetos, grupos: [...s.grupos, grupo], ...SEM_SELECAO, grupoSelecionadoId: grupo.id }
    }),

  // Devolve os objetos ao mundo, calculando a posição final de cada um
  desagrupar: (grupoId) =>
    set((s) => {
      const grupo = s.grupos.find((g) => g.id === grupoId)
      if (!grupo || grupo.travado) return s
      const objetos = s.objetos.map((o) =>
        o.grupoId === grupoId ? { ...o, ...aplicarGrupo(grupo, o), grupoId: undefined } : o,
      )
      return { objetos, grupos: s.grupos.filter((g) => g.id !== grupoId), ...SEM_SELECAO }
    }),

  atualizarGrupo: (id, alteracao) =>
    set((s) => {
      const grupo = s.grupos.find((g) => g.id === id)
      if (!grupo || grupo.travado) return s
      return { grupos: s.grupos.map((g) => (g.id === id ? { ...g, ...alteracao } : g)) }
    }),

  alternarTravaGrupo: (id) =>
    set((s) => ({
      grupos: s.grupos.map((g) => (g.id === id ? { ...g, travado: !g.travado } : g)),
    })),

  alternarTravaObjeto: (id) =>
    set((s) => ({
      objetos: s.objetos.map((o) => (o.id === id ? { ...o, travado: o.travado ? undefined : true } : o)),
    })),

  removerGrupo: (id) =>
    set((s) => {
      const grupo = s.grupos.find((g) => g.id === id)
      if (!grupo || grupo.travado) return s
      return {
        objetos: s.objetos.filter((o) => o.grupoId !== id),
        grupos: s.grupos.filter((g) => g.id !== id),
        ...SEM_SELECAO,
      }
    }),

  duplicarGrupo: (id) =>
    set((s) => {
      const original = s.grupos.find((g) => g.id === id)
      if (!original) return s
      const copia: GrupoCena = {
        ...original,
        id: crypto.randomUUID(),
        nome: `${original.nome} (cópia)`,
        travado: false,
        posicao: [original.posicao[0] + 1, original.posicao[1], original.posicao[2] + 1],
      }
      const membros = s.objetos
        .filter((o) => o.grupoId === id)
        .map((o): ObjetoCena => ({ ...o, id: crypto.randomUUID(), grupoId: copia.id, travado: undefined }))
      return {
        objetos: [...s.objetos, ...membros],
        grupos: [...s.grupos, copia],
        ...SEM_SELECAO,
        grupoSelecionadoId: copia.id,
      }
    }),

  // ----- Revelar e ocultar -----

  alternarOculto: (id) =>
    set((s) => ({
      objetos: s.objetos.map((o) => (o.id === id ? { ...o, oculto: o.oculto ? undefined : true } : o)),
    })),

  alternarOcultoGrupo: (id) =>
    set((s) => ({
      grupos: s.grupos.map((g) => (g.id === id ? { ...g, oculto: g.oculto ? undefined : true } : g)),
    })),

  // ----- Chão e pincel -----

  definirTerreno: (alteracao) => set((s) => ({ terreno: { ...s.terreno, ...alteracao } })),
  atualizarPincel: (alteracao) => set((s) => ({ pincel: { ...s.pincel, ...alteracao } })),
  alternarGrade: () => set((s) => ({ mostrarGrade: !s.mostrarGrade })),

  // ----- Áudio -----

  adicionarTrilha: (audioId) =>
    set((s) => ({
      trilhas: [...s.trilhas, { id: crypto.randomUUID(), audioId, volume: 0.7, repetir: true, tocando: false }],
    })),

  atualizarTrilha: (id, alteracao) =>
    set((s) => ({ trilhas: s.trilhas.map((t) => (t.id === id ? { ...t, ...alteracao } : t)) })),

  removerTrilha: (id) => set((s) => ({ trilhas: s.trilhas.filter((t) => t.id !== id) })),

  definirVolumeGeral: (volume) => set({ volumeGeral: Math.min(1, Math.max(0, volume)) }),

  // ----- Pontos de câmera, cartões e apresentação -----

  alternarCartao: (arteId) =>
    set((s) => ({
      cartoes: s.cartoes.includes(arteId) ? s.cartoes.filter((c) => c !== arteId) : [...s.cartoes, arteId],
    })),

  salvarPontoCamera: (nome, vista) =>
    set((s) => {
      const nomeFinal = nome.trim() || `Ponto ${s.pontosCamera.length + 1}`
      const ponto: PontoCamera = { id: crypto.randomUUID(), nome: nomeFinal, vista }
      return { pontosCamera: [...s.pontosCamera.filter((p) => p.nome !== nomeFinal), ponto] }
    }),

  removerPontoCamera: (id) => set((s) => ({ pontosCamera: s.pontosCamera.filter((p) => p.id !== id) })),

  iniciarApresentacao: () => set({ apresentando: true, ...SEM_SELECAO }),
  sairApresentacao: () => set({ apresentando: false }),

  // ----- Cena, luz, atmosfera -----

  definirNome: (nome) => set({ nome }),
  definirModoCamera: (modoCamera) => set({ modoCamera }),

  atualizarLuz: (alteracao) => set((s) => ({ luz: { ...s.luz, ...alteracao } })),

  // A luz nova já nasce selecionada, com o gizmo para arrastar até o lugar certo
  adicionarLuzPontual: () =>
    set((s) => {
      const nova = novaLuzPontual([0, 2.5, 0], `Luz ${s.luz.pontuais.length + 1}`)
      return { luz: { ...s.luz, pontuais: [...s.luz.pontuais, nova] }, ...SEM_SELECAO, luzSelecionadaId: nova.id }
    }),

  atualizarLuzPontual: (id, alteracao) =>
    set((s) => ({
      luz: {
        ...s.luz,
        pontuais: s.luz.pontuais.map((l) => (l.id === id ? { ...l, ...alteracao } : l)),
      },
    })),

  removerLuzPontual: (id) =>
    set((s) => ({
      luz: { ...s.luz, pontuais: s.luz.pontuais.filter((l) => l.id !== id) },
      luzSelecionadaId: s.luzSelecionadaId === id ? null : s.luzSelecionadaId,
    })),

  atualizarAmbiente: (alteracao) => set((s) => ({ ambiente: { ...s.ambiente, ...alteracao } })),

  salvarEstado: (nome) =>
    set((s) => {
      const nomeFinal = nome.trim() || `Estado ${s.estados.length + 1}`
      const estado: EstadoDaCena = {
        id: crypto.randomUUID(),
        nome: nomeFinal,
        luz: structuredClone(s.luz),
        ambiente: { ...s.ambiente },
        trilhas: s.trilhas.map((t) => ({ trilhaId: t.id, tocando: t.tocando, volume: t.volume })),
      }
      return { estados: [...s.estados.filter((e) => e.nome !== nomeFinal), estado] }
    }),

  aplicarEstado: (id) =>
    set((s) => {
      const estado = s.estados.find((e) => e.id === id)
      if (!estado) return s
      // Cada trilha da cena segue o estado: liga/desliga e ajusta o volume. Trilha que o
      // estado não conhece (criada depois dele) fica em silêncio.
      const trilhas = s.trilhas.map((t) => {
        const guardada = estado.trilhas.find((e) => e.trilhaId === t.id)
        return guardada ? { ...t, tocando: guardada.tocando, volume: guardada.volume } : { ...t, tocando: false }
      })
      return { luz: structuredClone(estado.luz), ambiente: { ...estado.ambiente }, trilhas }
    }),

  removerEstado: (id) => set((s) => ({ estados: s.estados.filter((e) => e.id !== id) })),

  definirQualidade: (qualidade) => set({ qualidade }),
  alternarFps: () => set((s) => ({ mostrarFps: !s.mostrarFps })),

  substituirCena: (dados) => set({ ...dados, ...SEM_SELECAO }),
}))
