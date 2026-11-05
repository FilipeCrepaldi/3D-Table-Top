// Motor de pintura do chão. Só roda no navegador.
//
// A pintura é uma imagem (canvas) de RESOLUCAO x RESOLUCAO pixels que cobre uma área
// quadrada do chão, centrada na origem. O pincel "carimba" círculos nessa imagem; o Three.js
// usa a imagem como textura. Onde não há tinta a imagem é transparente e aparece a cor base.
//
// Como a pintura é salva: depois de cada pincelada, um pouco depois, a imagem vira texto
// (data URL) e vai para o estado da cena. Quando uma cena é carregada, o caminho é o inverso.

import { CanvasTexture, SRGBColorSpace } from "three"
import { MATERIAL_COR, MATERIAL_POR_ID, type MaterialChao } from "./terreno-materiais"
import { useCena } from "./store"

export const RESOLUCAO = 2048
const MAX_DESFAZER = 5
const ATRASO_GRAVAR = 700 // ms depois da última pincelada

export type OpcoesPincel = {
  material: string
  cor: string
  /** Raio em pixels da imagem */
  raio: number
  opacidade: number
  dureza: number
  apagar: boolean
}

let tela: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null
let textura: CanvasTexture | null = null
const padroes = new Map<string, CanvasPattern>()
const historico: ImageData[] = []

let ultimaGravada: string | null = null // a pintura que nós mesmos geramos (para não recarregar à toa)
let sujo = false
let temTinta = false // houve alguma pincelada desde que a imagem foi limpa
let temporizador: ReturnType<typeof setTimeout> | null = null

function iniciar() {
  if (tela) return
  tela = document.createElement("canvas")
  tela.width = RESOLUCAO
  tela.height = RESOLUCAO
  ctx = tela.getContext("2d", { willReadFrequently: false })!
  textura = new CanvasTexture(tela)
  textura.colorSpace = SRGBColorSpace
  textura.anisotropy = 8
}

/** A textura que o Three.js desenha no chão. */
export function obterTextura(): CanvasTexture {
  iniciar()
  return textura!
}

// ---------------------------------------------------------------------------
// Padrões dos materiais
// ---------------------------------------------------------------------------

// Sorteio com semente: o material fica sempre igual, em qualquer computador
function sorteio(semente: number) {
  let a = semente >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function criarPadrao(material: MaterialChao): CanvasPattern {
  const lado = 256
  const c = document.createElement("canvas")
  c.width = lado
  c.height = lado
  const g = c.getContext("2d")!
  const r = sorteio(material.id.length * 9973 + material.id.charCodeAt(0))

  g.fillStyle = material.cor
  g.fillRect(0, 0, lado, lado)

  const cor = () => material.variacoes[Math.floor(r() * material.variacoes.length)]
  // desenha cada mancha também deslocada pelas bordas, para o padrão repetir sem emenda
  const repetir = (x: number, y: number, f: (x: number, y: number) => void) => {
    for (const dx of [-lado, 0, lado]) for (const dy of [-lado, 0, lado]) f(x + dx, y + dy)
  }

  if (material.estilo === "grama") {
    // tufos: riscos curtos para cima, em tons de verde
    g.lineCap = "round"
    for (let i = 0; i < 900; i++) {
      const x = r() * lado
      const y = r() * lado
      const alt = 3 + r() * 6
      const inclinacao = (r() - 0.5) * 3
      g.strokeStyle = cor()
      g.lineWidth = 1 + r()
      repetir(x, y, (px, py) => {
        g.beginPath()
        g.moveTo(px, py)
        g.lineTo(px + inclinacao, py - alt)
        g.stroke()
      })
    }
  } else if (material.estilo === "pedra") {
    // pedrinhas: elipses de vários tamanhos com um contorno escuro
    for (let i = 0; i < 260; i++) {
      const x = r() * lado
      const y = r() * lado
      const rx = 2 + r() * 7
      const ry = rx * (0.6 + r() * 0.4)
      g.fillStyle = cor()
      g.strokeStyle = "rgba(0,0,0,0.25)"
      g.lineWidth = 1
      repetir(x, y, (px, py) => {
        g.beginPath()
        g.ellipse(px, py, rx, ry, r() * 3, 0, Math.PI * 2)
        g.fill()
        g.stroke()
      })
    }
  } else if (material.estilo === "granulado") {
    // grãos: pontinhos de tons próximos
    for (let i = 0; i < 2600; i++) {
      const x = r() * lado
      const y = r() * lado
      const raio = 0.8 + r() * 2.2
      g.fillStyle = cor()
      g.globalAlpha = 0.35 + r() * 0.4
      repetir(x, y, (px, py) => {
        g.beginPath()
        g.arc(px, py, raio, 0, Math.PI * 2)
        g.fill()
      })
    }
    g.globalAlpha = 1
  }

  return ctx!.createPattern(c, "repeat")!
}

function preenchimento(opcoes: Pick<OpcoesPincel, "material" | "cor">): string | CanvasPattern {
  if (opcoes.material === MATERIAL_COR) return opcoes.cor
  const material = MATERIAL_POR_ID.get(opcoes.material)
  if (!material) return opcoes.cor
  let padrao = padroes.get(material.id)
  if (!padrao) {
    padrao = criarPadrao(material)
    padroes.set(material.id, padrao)
  }
  return padrao
}

/** Imagem pequena do material, para mostrar nos botões da tela. */
export function miniaturaDoMaterial(id: string, lado = 40): string {
  iniciar()
  const material = MATERIAL_POR_ID.get(id)
  if (!material) return ""
  const c = document.createElement("canvas")
  c.width = lado
  c.height = lado
  const g = c.getContext("2d")!
  g.fillStyle = preenchimento({ material: id, cor: material.cor })
  g.fillRect(0, 0, lado, lado)
  return c.toDataURL()
}

// ---------------------------------------------------------------------------
// Pincel
// ---------------------------------------------------------------------------

let carimbo: HTMLCanvasElement | null = null

function carimbar(cx: number, cy: number, o: OpcoesPincel) {
  const diametro = Math.max(2, Math.ceil(o.raio * 2))
  if (!carimbo) carimbo = document.createElement("canvas")
  if (carimbo.width < diametro || carimbo.height < diametro) {
    carimbo.width = diametro
    carimbo.height = diametro
  }
  const s = carimbo.getContext("2d")!
  s.clearRect(0, 0, carimbo.width, carimbo.height)

  const x0 = cx - o.raio
  const y0 = cy - o.raio
  if (o.apagar) {
    s.fillStyle = "#000"
    s.fillRect(0, 0, diametro, diametro)
  } else {
    // o padrão fica preso às coordenadas da pintura, então não "anda" junto com o pincel
    s.save()
    s.translate(-x0, -y0)
    s.fillStyle = preenchimento(o)
    s.fillRect(x0, y0, diametro, diametro)
    s.restore()
  }

  // máscara redonda com borda macia (quanto menor a dureza, mais macia)
  s.globalCompositeOperation = "destination-in"
  const g = s.createRadialGradient(o.raio, o.raio, 0, o.raio, o.raio, o.raio)
  g.addColorStop(0, "rgba(0,0,0,1)")
  g.addColorStop(Math.min(0.99, Math.max(0, o.dureza)), "rgba(0,0,0,1)")
  g.addColorStop(1, "rgba(0,0,0,0)")
  s.fillStyle = g
  s.fillRect(0, 0, diametro, diametro)
  s.globalCompositeOperation = "source-over"

  ctx!.save()
  ctx!.globalAlpha = o.opacidade
  ctx!.globalCompositeOperation = o.apagar ? "destination-out" : "source-over"
  ctx!.drawImage(carimbo, 0, 0, diametro, diametro, x0, y0, diametro, diametro)
  ctx!.restore()
}

/** Converte um ponto do mundo (x, z) para pixel da imagem. */
export function mundoParaPixel(x: number, z: number, tamanho: number): [number, number] {
  return [(x / tamanho + 0.5) * RESOLUCAO, (z / tamanho + 0.5) * RESOLUCAO]
}

/** Quantos pixels da imagem vale 1 unidade do mundo. */
export function pixelsPorUnidade(tamanho: number) {
  return RESOLUCAO / tamanho
}

/** Começa uma pincelada: guarda o estado anterior para o desfazer e carimba o primeiro ponto. */
export function iniciarPincelada(x: number, y: number, o: OpcoesPincel) {
  iniciar()
  historico.push(ctx!.getImageData(0, 0, RESOLUCAO, RESOLUCAO))
  if (historico.length > MAX_DESFAZER) historico.shift()
  carimbar(x, y, o)
  if (!o.apagar) temTinta = true
  textura!.needsUpdate = true
}

/** Continua a pincelada: carimba ao longo do traço, sem deixar buracos entre os pontos. */
export function continuarPincelada(de: [number, number], para: [number, number], o: OpcoesPincel) {
  const dx = para[0] - de[0]
  const dy = para[1] - de[1]
  const distancia = Math.hypot(dx, dy)
  const passo = Math.max(1, o.raio * 0.25)
  const quantidade = Math.max(1, Math.ceil(distancia / passo))
  for (let i = 1; i <= quantidade; i++) {
    carimbar(de[0] + (dx * i) / quantidade, de[1] + (dy * i) / quantidade, o)
  }
  textura!.needsUpdate = true
}

/** Termina a pincelada e agenda a gravação no estado da cena. */
export function terminarPincelada() {
  sujo = true
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(sincronizar, ATRASO_GRAVAR)
}

export function desfazerPincelada(): boolean {
  const anterior = historico.pop()
  if (!anterior || !ctx) return false
  ctx.putImageData(anterior, 0, 0)
  textura!.needsUpdate = true
  sujo = true
  if (temporizador) clearTimeout(temporizador)
  temporizador = setTimeout(sincronizar, ATRASO_GRAVAR)
  return true
}

/** Cobre toda a área com o material (ou cor) escolhido. */
export function preencherTudo(o: Pick<OpcoesPincel, "material" | "cor">) {
  iniciar()
  historico.push(ctx!.getImageData(0, 0, RESOLUCAO, RESOLUCAO))
  if (historico.length > MAX_DESFAZER) historico.shift()
  ctx!.save()
  ctx!.globalCompositeOperation = "source-over"
  ctx!.fillStyle = preenchimento(o)
  ctx!.fillRect(0, 0, RESOLUCAO, RESOLUCAO)
  ctx!.restore()
  temTinta = true
  textura!.needsUpdate = true
  terminarPincelada()
}

/** Apaga toda a pintura (volta a aparecer só a cor base). */
export function limparPintura() {
  iniciar()
  historico.push(ctx!.getImageData(0, 0, RESOLUCAO, RESOLUCAO))
  if (historico.length > MAX_DESFAZER) historico.shift()
  ctx!.clearRect(0, 0, RESOLUCAO, RESOLUCAO)
  temTinta = false
  textura!.needsUpdate = true
  terminarPincelada()
}

// ---------------------------------------------------------------------------
// Ligação com o estado da cena
// ---------------------------------------------------------------------------

/** Transforma a pintura em texto e a entrega ao estado da cena. Devolve o texto (ou null se vazio). */
export function sincronizar(): string | null {
  if (temporizador) {
    clearTimeout(temporizador)
    temporizador = null
  }
  if (!tela || !sujo) return useCena.getState().terreno.pintura
  sujo = false

  // WebP é bem menor que PNG para esse tipo de imagem; se o navegador não souber, sai PNG
  const imagem = temTinta ? tela.toDataURL("image/webp", 0.88) : null
  ultimaGravada = imagem
  useCena.getState().definirTerreno({ pintura: imagem })
  return imagem
}

/** Carrega uma pintura vinda do estado (ao abrir uma cena). Ignora a que nós mesmos geramos. */
export function carregarPintura(dataUrl: string | null) {
  if (dataUrl === ultimaGravada && tela && !sujo) return
  iniciar()
  ultimaGravada = dataUrl
  sujo = false
  temTinta = dataUrl !== null
  historico.length = 0
  ctx!.clearRect(0, 0, RESOLUCAO, RESOLUCAO)
  textura!.needsUpdate = true
  if (!dataUrl) return

  const img = new Image()
  img.onload = () => {
    // se outra cena foi carregada enquanto a imagem baixava, não sobrescreve
    if (ultimaGravada !== dataUrl) return
    ctx!.clearRect(0, 0, RESOLUCAO, RESOLUCAO)
    ctx!.drawImage(img, 0, 0, RESOLUCAO, RESOLUCAO)
    textura!.needsUpdate = true
  }
  img.src = dataUrl
}
