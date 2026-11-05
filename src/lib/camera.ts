import type { Camera, OrthographicCamera, Vector3 } from "three"
import type { ModoCamera, VistaCamera } from "./tipos"

// Ponte entre o estado (que não conhece o Three.js) e a câmera real.
// `viva` guarda sempre a última posição conhecida da câmera. Ela serve para:
//  - salvar a vista junto com a cena;
//  - manter o ponto de foco ao alternar entre isométrica e perspectiva;
//  - restaurar a vista ao carregar uma cena.

type Controles = { target: Vector3; update: () => unknown }

const viva: VistaCamera = { modo: "isometrica", posicao: [0, 0, 0], alvo: [0, 0, 0], zoom: 1 }
let temViva = false
let aplicando = false
let aplicador: (() => void) | null = null

export function modoDe(camera: Camera): ModoCamera {
  return (camera as OrthographicCamera).isOrthographicCamera ? "isometrica" : "perspectiva"
}

export function temVistaCapturada() {
  return temViva
}

/** Registra a posição atual da câmera (chamado quando os controles mudam). */
export function capturarVista(camera: Camera, alvo: Vector3) {
  if (aplicando) return // ignora o "change" disparado por nós mesmos
  viva.modo = modoDe(camera)
  camera.position.toArray(viva.posicao)
  alvo.toArray(viva.alvo)
  viva.zoom = (camera as OrthographicCamera).zoom
  temViva = true
}

/** Cópia da vista atual, ou null se a câmera nunca foi capturada. */
export function lerVista(): VistaCamera | null {
  return temViva ? { ...viva, posicao: [...viva.posicao], alvo: [...viva.alvo] } : null
}

/** Define a vista (ao carregar uma cena) e aplica na câmera atual. */
export function definirVista(v: VistaCamera) {
  viva.modo = v.modo
  viva.posicao = [...v.posicao]
  viva.alvo = [...v.alvo]
  viva.zoom = v.zoom
  temViva = true
  aplicador?.()
}

/** Move a câmera e os controles para a vista guardada. */
export function aplicarVistaViva(camera: Camera, controles: Controles) {
  if (!temViva) return
  aplicando = true
  camera.position.set(...viva.posicao)
  controles.target.set(...viva.alvo)
  // zoom só vale para o mesmo tipo de câmera (distâncias não se comparam entre os dois)
  if (modoDe(camera) === viva.modo) {
    ;(camera as OrthographicCamera).zoom = viva.zoom
    ;(camera as OrthographicCamera).updateProjectionMatrix()
  }
  controles.update()
  aplicando = false
}

/** O CameraRig registra aqui como aplicar a vista na câmera que está ativa. */
export function registrarAplicador(fn: () => void) {
  aplicador = fn
  return () => {
    if (aplicador === fn) aplicador = null
  }
}

let animador: ((v: VistaCamera) => void) | null = null

/** O ControlesCamera registra aqui como animar a câmera até uma vista. */
export function registrarAnimador(fn: (v: VistaCamera) => void) {
  animador = fn
  return () => {
    if (animador === fn) animador = null
  }
}

/** Leva a câmera até a vista com uma transição suave (ou direto, se não houver como animar). */
export function irParaVista(v: VistaCamera) {
  if (animador) animador(v)
  else definirVista(v)
}
