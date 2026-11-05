"use client"

import { useEffect, useMemo, useRef } from "react"
import type { ThreeEvent } from "@react-three/fiber"
import type { Mesh } from "three"

import { useCena } from "@/lib/store"
import {
  carregarPintura,
  continuarPincelada,
  iniciarPincelada,
  mundoParaPixel,
  obterTextura,
  pixelsPorUnidade,
  terminarPincelada,
} from "@/lib/terreno-pintura"

// O chão da cena. Duas camadas:
//  - uma base grande, na cor escolhida, que vai até o horizonte;
//  - uma folha pintável por cima (a textura do motor de pintura), com a área do tamanho do terreno.
// Com o pincel ligado, arrastar o botão esquerdo sobre a folha pinta; o direito gira a câmera.
export default function TerrenoPintavel() {
  const corBase = useCena((s) => s.terreno.corBase)
  const tamanho = useCena((s) => s.terreno.tamanho)
  const pintura = useCena((s) => s.terreno.pintura)
  const pincel = useCena((s) => s.pincel)
  const apresentando = useCena((s) => s.apresentando)

  const textura = useMemo(() => obterTextura(), [])
  const ativo = pincel.ativo && !apresentando

  // Quando uma cena é carregada, a pintura salva vai para a imagem
  useEffect(() => {
    carregarPintura(pintura)
  }, [pintura])

  const ultimo = useRef<[number, number] | null>(null)
  const anel = useRef<Mesh>(null)

  const opcoes = () => ({
    material: pincel.material,
    cor: pincel.cor,
    raio: pincel.raio * pixelsPorUnidade(tamanho),
    opacidade: pincel.opacidade,
    dureza: pincel.dureza,
    apagar: pincel.apagar,
  })

  function aoApertar(e: ThreeEvent<PointerEvent>) {
    if (e.nativeEvent.button !== 0) return // só o botão esquerdo pinta
    e.stopPropagation()
    ;(e.target as Element).setPointerCapture(e.pointerId) // continua pintando mesmo que o mouse saia da folha
    const ponto = mundoParaPixel(e.point.x, e.point.z, tamanho)
    ultimo.current = ponto
    iniciarPincelada(ponto[0], ponto[1], opcoes())
  }

  function aoMover(e: ThreeEvent<PointerEvent>) {
    if (anel.current) {
      anel.current.visible = true
      anel.current.position.set(e.point.x, -0.02, e.point.z)
    }
    if (!ultimo.current) return
    const ponto = mundoParaPixel(e.point.x, e.point.z, tamanho)
    continuarPincelada(ultimo.current, ponto, opcoes())
    ultimo.current = ponto
  }

  function aoSoltar(e: ThreeEvent<PointerEvent>) {
    if (!ultimo.current) return
    ultimo.current = null
    ;(e.target as Element).releasePointerCapture?.(e.pointerId)
    terminarPincelada()
  }

  return (
    <>
      {/* Base: o plano nasce em pé, então giramos -90° no eixo X. Fica abaixo da grade (-0.03)
          e dos pisos para as superfícies não brigarem pelo mesmo ponto. */}
      <mesh position={[0, -0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[800, 800]} />
        <meshStandardMaterial color={corBase} roughness={1} />
      </mesh>

      {/* Folha pintável */}
      <mesh
        position={[0, -0.045, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onPointerDown={ativo ? aoApertar : undefined}
        onPointerMove={ativo ? aoMover : undefined}
        onPointerUp={ativo ? aoSoltar : undefined}
        // Só reage ao mouse com o pincel ligado. Se tivesse qualquer evento sempre ligado,
        // o chão "pegaria" os cliques e clicar no vazio deixaria de limpar a seleção.
        onPointerLeave={
          ativo
            ? () => {
                if (anel.current && !ultimo.current) anel.current.visible = false
              }
            : undefined
        }
      >
        <planeGeometry args={[tamanho, tamanho]} />
        <meshStandardMaterial map={textura} transparent depthWrite={false} roughness={1} />
      </mesh>

      {/* Círculo que mostra o tamanho do pincel */}
      {ativo && (
        <mesh ref={anel} rotation={[-Math.PI / 2, 0, 0]} scale={[pincel.raio, pincel.raio, 1]} visible={false} renderOrder={20} raycast={() => null}>
          <ringGeometry args={[0.96, 1, 64]} />
          <meshBasicMaterial color={pincel.apagar ? "#ff6b6b" : "#ffffff"} transparent opacity={0.85} depthTest={false} />
        </mesh>
      )}
    </>
  )
}
