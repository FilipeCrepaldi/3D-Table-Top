"use client"

import { useEffect, useRef } from "react"
import { useFrame, useThree } from "@react-three/fiber"
import { Vector3, type OrthographicCamera } from "three"

import {
  aplicarVistaViva,
  capturarVista,
  definirVista,
  modoDe,
  registrarAnimador,
  registrarAplicador,
  temVistaCapturada,
} from "@/lib/camera"
import { useCena } from "@/lib/store"
import type { VistaCamera } from "@/lib/tipos"

// O que usamos dos OrbitControls (o Drei não exporta o tipo da classe)
export type Controles = {
  target: Vector3
  update: () => unknown
  addEventListener: (tipo: "change" | "start", fn: () => void) => void
  removeEventListener: (tipo: "change" | "start", fn: () => void) => void
}

// Limites de zoom. Na câmera isométrica o zoom é um número (maior = mais perto);
// na perspectiva é a distância até o ponto de foco (menor = mais perto).
export const ZOOM_ISO = { min: 8, max: 400 }
export const DISTANCIA_PERSPECTIVA = { min: 0.8, max: 150 }

// Quão rápido o zoom "alcança" o destino. Maior = mais seco, menor = mais macio.
const SUAVIDADE = 12

const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n))
const deCamera = new Vector3()

// Duração da viagem entre pontos de câmera, em segundos
const DURACAO_TRANSICAO = 1.3
const suavizar = (t: number) => t * t * (3 - 2 * t) // começa e termina devagar

type Transicao = { de: VistaCamera; para: VistaCamera; t: number }

// Cuida da câmera:
//  1. guarda a posição (para salvar e para trocar de câmera sem perder o foco);
//  2. faz o zoom da roda do mouse suave: cada giro define um destino e a câmera
//     desliza até ele, em vez de pular de passo em passo.
export default function ControlesCamera() {
  const camera = useThree((s) => s.camera)
  const gl = useThree((s) => s.gl)
  const controles = useThree((s) => s.controls) as unknown as Controles | null

  // alvo: valor para onde o zoom está indo; ativo: ainda está deslizando
  const zoom = useRef({ alvo: 1, ativo: false })
  // viagem em andamento até um ponto de câmera, ou null
  const transicao = useRef<Transicao | null>(null)

  useEffect(() => {
    if (!controles) return

    const aoMudar = () => capturarVista(camera, controles.target)
    controles.addEventListener("change", aoMudar)

    if (temVistaCapturada()) aplicarVistaViva(camera, controles) // trocou de câmera
    else aoMudar() // primeira vez: registra a posição inicial

    const desregistrar = registrarAplicador(() => {
      zoom.current.ativo = false // a vista carregada manda
      transicao.current = null
      aplicarVistaViva(camera, controles)
    })

    // Viagem suave até uma vista. Se o tipo de câmera é outro, troca de uma vez.
    const desregistrarAnimador = registrarAnimador((destino) => {
      if (destino.modo !== modoDe(camera)) {
        useCena.getState().definirModoCamera(destino.modo)
        definirVista(destino)
        return
      }
      zoom.current.ativo = false
      transicao.current = {
        de: {
          modo: destino.modo,
          posicao: camera.position.toArray() as VistaCamera["posicao"],
          alvo: controles.target.toArray() as VistaCamera["alvo"],
          zoom: (camera as OrthographicCamera).zoom,
        },
        para: destino,
        t: 0,
      }
    })

    // Se você mexer na câmera durante a viagem, a viagem para
    const cancelar = () => {
      transicao.current = null
    }
    controles.addEventListener("start", cancelar)

    return () => {
      controles.removeEventListener("change", aoMudar)
      controles.removeEventListener("start", cancelar)
      desregistrar()
      desregistrarAnimador()
    }
  }, [camera, controles])

  // Roda do mouse
  useEffect(() => {
    if (!controles) return
    const elemento = gl.domElement
    const isometrica = modoDe(camera) === "isometrica"

    function aoRolar(e: WheelEvent) {
      e.preventDefault()
      transicao.current = null
      const z = zoom.current
      if (!z.ativo) {
        // começa a partir de onde a câmera está agora
        z.alvo = isometrica
          ? (camera as OrthographicCamera).zoom
          : camera.position.distanceTo(controles!.target)
      }
      // normaliza mouse comum (pixels), roda por linhas (Firefox) e trackpad
      const bruto = e.deltaMode === 1 ? e.deltaY * 33 : e.deltaMode === 2 ? e.deltaY * 400 : e.deltaY
      const passo = Math.exp(-limitar(bruto, -300, 300) * 0.002) // rolar para baixo afasta
      z.alvo = isometrica
        ? limitar(z.alvo * passo, ZOOM_ISO.min, ZOOM_ISO.max)
        : limitar(z.alvo / passo, DISTANCIA_PERSPECTIVA.min, DISTANCIA_PERSPECTIVA.max)
      z.ativo = true
    }

    elemento.addEventListener("wheel", aoRolar, { passive: false })
    return () => elemento.removeEventListener("wheel", aoRolar)
  }, [camera, gl, controles])

  // A cada quadro: anda na viagem entre pontos, ou aproxima o zoom do destino
  useFrame((_, delta) => {
    const tr = transicao.current
    if (tr && controles) {
      tr.t = Math.min(1, tr.t + delta / DURACAO_TRANSICAO)
      const k = suavizar(tr.t)
      const lerp = (a: number, b: number) => a + (b - a) * k
      camera.position.set(
        lerp(tr.de.posicao[0], tr.para.posicao[0]),
        lerp(tr.de.posicao[1], tr.para.posicao[1]),
        lerp(tr.de.posicao[2], tr.para.posicao[2]),
      )
      controles.target.set(
        lerp(tr.de.alvo[0], tr.para.alvo[0]),
        lerp(tr.de.alvo[1], tr.para.alvo[1]),
        lerp(tr.de.alvo[2], tr.para.alvo[2]),
      )
      if (modoDe(camera) === "isometrica") {
        // o zoom percebido é proporcional, então a mistura é feita em escala logarítmica
        const ortografica = camera as OrthographicCamera
        ortografica.zoom = Math.exp(lerp(Math.log(tr.de.zoom), Math.log(tr.para.zoom)))
        ortografica.updateProjectionMatrix()
      }
      capturarVista(camera, controles.target)
      if (tr.t >= 1) transicao.current = null
      return
    }

    const z = zoom.current
    if (!z.ativo || !controles) return
    const k = 1 - Math.exp(-delta * SUAVIDADE)

    if (modoDe(camera) === "isometrica") {
      const ortografica = camera as OrthographicCamera
      ortografica.zoom += (z.alvo - ortografica.zoom) * k
      ortografica.updateProjectionMatrix()
      if (Math.abs(z.alvo - ortografica.zoom) < ortografica.zoom * 0.002) z.ativo = false
    } else {
      deCamera.copy(camera.position).sub(controles.target)
      const atual = deCamera.length()
      const nova = atual + (z.alvo - atual) * k
      camera.position.copy(controles.target).add(deCamera.setLength(nova))
      if (Math.abs(z.alvo - nova) < nova * 0.002) z.ativo = false
    }
    capturarVista(camera, controles.target)
  })

  return null
}
