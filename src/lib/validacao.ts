import { ambienteBase, terrenoAntigo } from "./ambiente"
import { luzBase } from "./luz"
import type {
  CenaSalva,
  ConfigAmbiente,
  ConfigLuz,
  EstadoDaCena,
  GrupoCena,
  LuzPontual,
  ModoCamera,
  EstadoTrilha,
  ObjetoCena,
  PontoCamera,
  Terreno,
  TrilhaCena,
  Vec3,
  VistaCamera,
} from "./tipos"

const VERSAO_ATUAL = 1

// ---------- Validação ----------
// Todo dado que vem de fora (arquivo .json ou banco de dados) passa por aqui antes de
// entrar no estado. Devolve a cena já limpa, ou uma mensagem de erro.

const ehNumero = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v)
const ehTexto = (v: unknown): v is string => typeof v === "string"
const ehVec3 = (v: unknown): v is Vec3 => Array.isArray(v) && v.length === 3 && v.every(ehNumero)
const ehObjeto = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null && !Array.isArray(v)

function validarObjeto(o: unknown): ObjetoCena | null {
  if (!ehObjeto(o)) return null
  if (!ehTexto(o.id) || !ehTexto(o.nome) || !ehTexto(o.assetId)) return null
  if (!ehVec3(o.posicao) || !ehVec3(o.rotacao) || !ehVec3(o.escala)) return null
  return {
    id: o.id,
    nome: o.nome,
    assetId: o.assetId,
    grupoId: ehTexto(o.grupoId) ? o.grupoId : undefined,
    travado: o.travado === true ? true : undefined,
    oculto: o.oculto === true ? true : undefined,
    posicao: o.posicao,
    rotacao: o.rotacao,
    escala: o.escala,
  }
}

function validarGrupo(g: unknown): GrupoCena | null {
  if (!ehObjeto(g) || !ehTexto(g.id) || !ehTexto(g.nome)) return null
  if (!ehVec3(g.posicao) || !ehVec3(g.rotacao) || !ehVec3(g.escala)) return null
  return { id: g.id, nome: g.nome, travado: g.travado === true, oculto: g.oculto === true ? true : undefined, posicao: g.posicao, rotacao: g.rotacao, escala: g.escala }
}

function validarLuzPontual(l: unknown): LuzPontual | null {
  if (!ehObjeto(l)) return null
  if (!ehTexto(l.id) || !ehTexto(l.nome) || !ehTexto(l.cor)) return null
  if (!ehVec3(l.posicao) || !ehNumero(l.intensidade) || !ehNumero(l.alcance)) return null
  return { id: l.id, nome: l.nome, cor: l.cor, posicao: l.posicao, intensidade: l.intensidade, alcance: l.alcance }
}

function validarLuz(l: unknown): ConfigLuz {
  const padrao = luzBase()
  if (!ehObjeto(l)) return padrao
  return {
    ambienteCor: ehTexto(l.ambienteCor) ? l.ambienteCor : padrao.ambienteCor,
    ambienteIntensidade: ehNumero(l.ambienteIntensidade) ? l.ambienteIntensidade : padrao.ambienteIntensidade,
    solIntensidade: ehNumero(l.solIntensidade) ? l.solIntensidade : padrao.solIntensidade,
    solPosicao: ehVec3(l.solPosicao) ? l.solPosicao : padrao.solPosicao,
    pontuais: Array.isArray(l.pontuais)
      ? l.pontuais.map(validarLuzPontual).filter((x): x is LuzPontual => x !== null)
      : [],
  }
}

function validarAmbiente(a: unknown): ConfigAmbiente {
  const padrao = ambienteBase()
  if (!ehObjeto(a)) return padrao
  const particulas = ["nenhuma", "poeira", "chuva", "neve"].includes(a.particulas as string)
    ? (a.particulas as ConfigAmbiente["particulas"])
    : padrao.particulas
  return {
    nevoaAtiva: typeof a.nevoaAtiva === "boolean" ? a.nevoaAtiva : padrao.nevoaAtiva,
    nevoaCor: ehTexto(a.nevoaCor) ? a.nevoaCor : padrao.nevoaCor,
    nevoaDensidade: ehNumero(a.nevoaDensidade) ? a.nevoaDensidade : padrao.nevoaDensidade,
    particulas,
    particulasQuantidade: ehNumero(a.particulasQuantidade) ? a.particulasQuantidade : padrao.particulasQuantidade,
    ceuTopo: ehTexto(a.ceuTopo) ? a.ceuTopo : padrao.ceuTopo,
    ceuHorizonte: ehTexto(a.ceuHorizonte) ? a.ceuHorizonte : padrao.ceuHorizonte,
    ceuBase: ehTexto(a.ceuBase) ? a.ceuBase : padrao.ceuBase,
    estrelas: typeof a.estrelas === "boolean" ? a.estrelas : padrao.estrelas,
  }
}

const LIMITE_PINTURA = 20 * 1024 * 1024 // a pintura é uma imagem em texto; mais que isso não é coisa nossa

function validarTerreno(t: unknown): Terreno {
  const padrao = terrenoAntigo()
  if (!ehObjeto(t)) return padrao
  const pintura =
    ehTexto(t.pintura) && t.pintura.startsWith("data:image/") && t.pintura.length < LIMITE_PINTURA ? t.pintura : null
  return {
    corBase: ehTexto(t.corBase) ? t.corBase : padrao.corBase,
    pintura,
    tamanho: ehNumero(t.tamanho) && t.tamanho >= 8 && t.tamanho <= 512 ? t.tamanho : padrao.tamanho,
  }
}

function validarTrilha(t: unknown): TrilhaCena | null {
  if (!ehObjeto(t) || !ehTexto(t.id) || !ehTexto(t.audioId)) return null
  return {
    id: t.id,
    audioId: t.audioId,
    volume: ehNumero(t.volume) ? Math.min(1, Math.max(0, t.volume)) : 0.7,
    repetir: t.repetir !== false,
    tocando: t.tocando === true,
  }
}

function validarEstadoTrilha(t: unknown): EstadoTrilha | null {
  if (!ehObjeto(t) || !ehTexto(t.trilhaId)) return null
  return {
    trilhaId: t.trilhaId,
    tocando: t.tocando === true,
    volume: ehNumero(t.volume) ? Math.min(1, Math.max(0, t.volume)) : 0.7,
  }
}

function validarEstado(e: unknown): EstadoDaCena | null {
  if (!ehObjeto(e) || !ehTexto(e.id) || !ehTexto(e.nome)) return null
  return {
    id: e.id,
    nome: e.nome,
    luz: validarLuz(e.luz),
    ambiente: validarAmbiente(e.ambiente),
    trilhas: Array.isArray(e.trilhas)
      ? e.trilhas.map(validarEstadoTrilha).filter((x): x is EstadoTrilha => x !== null)
      : [],
  }
}

function validarModo(m: unknown): ModoCamera {
  return m === "perspectiva" ? "perspectiva" : "isometrica"
}

function validarVista(v: unknown): VistaCamera | null {
  if (!ehObjeto(v) || !ehVec3(v.posicao) || !ehVec3(v.alvo) || !ehNumero(v.zoom)) return null
  return { modo: validarModo(v.modo), posicao: v.posicao, alvo: v.alvo, zoom: v.zoom }
}

function validarPonto(p: unknown): PontoCamera | null {
  if (!ehObjeto(p) || !ehTexto(p.id) || !ehTexto(p.nome)) return null
  const vista = validarVista(p.vista)
  return vista ? { id: p.id, nome: p.nome, vista } : null
}

export function validarCena(dado: unknown): CenaSalva | string {
  if (!ehObjeto(dado)) return "Formato inesperado: não parece uma cena do Tabletop 3D."
  if (!ehNumero(dado.versao)) return "Arquivo sem número de versão: não parece uma cena do Tabletop 3D."
  if (dado.versao > VERSAO_ATUAL) {
    return `Cena da versão ${dado.versao}, mais nova que a suportada (${VERSAO_ATUAL}). Atualize o aplicativo.`
  }
  // Versões antigas seriam convertidas aqui, uma de cada vez, até chegar na atual.

  if (!Array.isArray(dado.objetos)) return "A cena não tem a lista de objetos."
  const objetos = dado.objetos.map(validarObjeto)
  const invalidos = objetos.filter((o) => o === null).length
  if (invalidos > 0) return `${invalidos} objeto(s) da cena estão corrompidos.`

  const grupos = Array.isArray(dado.grupos)
    ? dado.grupos.map(validarGrupo).filter((x): x is GrupoCena => x !== null)
    : []
  const idsDeGrupos = new Set(grupos.map((g) => g.id))
  // objeto que aponta para um grupo inexistente fica solto na cena
  const objetosValidos = (objetos as ObjetoCena[]).map((o) =>
    o.grupoId && !idsDeGrupos.has(o.grupoId) ? { ...o, grupoId: undefined } : o,
  )

  return {
    versao: VERSAO_ATUAL,
    id: ehTexto(dado.id) ? dado.id : crypto.randomUUID(),
    nome: ehTexto(dado.nome) && dado.nome.trim() ? dado.nome : "Cena importada",
    salvoEm: ehTexto(dado.salvoEm) ? dado.salvoEm : new Date().toISOString(),
    objetos: objetosValidos,
    grupos,
    pontosCamera: Array.isArray(dado.pontosCamera)
      ? dado.pontosCamera.map(validarPonto).filter((x): x is PontoCamera => x !== null)
      : [],
    cartoes: Array.isArray(dado.cartoes) ? dado.cartoes.filter(ehTexto) : [],
    trilhas: Array.isArray(dado.trilhas)
      ? dado.trilhas.map(validarTrilha).filter((x): x is TrilhaCena => x !== null)
      : [],
    modoCamera: validarModo(dado.modoCamera),
    vista: validarVista(dado.vista),
    luz: validarLuz(dado.luz),
    ambiente: validarAmbiente(dado.ambiente),
    terreno: validarTerreno(dado.terreno),
    estados: Array.isArray(dado.estados)
      ? dado.estados.map(validarEstado).filter((x): x is EstadoDaCena => x !== null)
      : [],
  }
}
