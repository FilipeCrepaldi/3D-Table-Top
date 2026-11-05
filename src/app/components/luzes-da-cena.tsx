"use client"

import { useState } from "react"
import { Line, TransformControls } from "@react-three/drei"
import type { Group } from "three"

import { useCena } from "@/lib/store"
import type { Qualidade, Vec3 } from "@/lib/tipos"

const TAMANHO_SOMBRA: Record<Qualidade, [number, number]> = {
  baixa: [512, 512],
  media: [1024, 1024],
  alta: [2048, 2048],
}

const COR_SOL = "#ffe27a"

// Luzes como objetos da cena: cada uma tem uma bolinha que você clica e arrasta
// (com o gizmo de mover) para definir de onde a luz vem.
//  - Sol: luz direcional; ela aponta da bolinha para o centro da cena;
//  - Luzes pontuais: iluminam em volta de onde estão (vela, lareira, lâmpada).
export default function LuzesDaCena() {
  const luz = useCena((s) => s.luz)
  const qualidade = useCena((s) => s.qualidade)
  const selecionadaId = useCena((s) => s.luzSelecionadaId)
  const encaixe = useCena((s) => s.encaixe)
  const apresentando = useCena((s) => s.apresentando)

  // O Group do Three.js da luz selecionada (preenchido pelo ref abaixo)
  const [alvo, setAlvo] = useState<Group | null>(null)

  // Ao soltar o mouse, copia a posição do Three.js de volta para o estado
  function aoSoltar() {
    if (!alvo || !selecionadaId) return
    const estado = useCena.getState()
    const { x, y, z } = alvo.position
    if (selecionadaId === "sol") {
      // o sol não pode ficar abaixo do chão, nem exatamente no centro (sem direção)
      const posicao: Vec3 = [x, Math.max(y, 1), z]
      estado.atualizarLuz({ solPosicao: posicao })
    } else {
      estado.atualizarLuzPontual(selecionadaId, { posicao: [x, y, z] })
    }
  }

  const clicar = (id: string) => (e: { stopPropagation: () => void }) => {
    if (useCena.getState().pincel.ativo) return // com o pincel ligado, clicar só pinta
    e.stopPropagation()
    useCena.getState().selecionarLuz(id)
  }

  const solSelecionado = selecionadaId === "sol"

  return (
    <>
      <ambientLight color={luz.ambienteCor} intensity={luz.ambienteIntensidade} />

      {/* Sol. A luz fica dentro do grupo, então acompanha a bolinha enquanto você arrasta. */}
      <group ref={solSelecionado ? setAlvo : undefined} position={luz.solPosicao}>
        {/* key: o tamanho do mapa de sombras só muda recriando a luz */}
        <directionalLight
          key={qualidade}
          intensity={luz.solIntensidade}
          castShadow={qualidade !== "baixa"}
          shadow-mapSize={TAMANHO_SOMBRA[qualidade]}
          shadow-camera-left={-15}
          shadow-camera-right={15}
          shadow-camera-top={15}
          shadow-camera-bottom={-15}
          shadow-camera-far={100}
        />
        {!apresentando && (
          <mesh onClick={clicar("sol")}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshBasicMaterial color={COR_SOL} />
          </mesh>
        )}
        {!apresentando && solSelecionado && (
          <mesh scale={1.5} raycast={() => null}>
            <sphereGeometry args={[0.35, 12, 12]} />
            <meshBasicMaterial color="#ffffff" wireframe />
          </mesh>
        )}
      </group>
      {/* Linha tracejada mostrando a direção da luz */}
      {!apresentando && (
        <Line points={[luz.solPosicao, [0, 0, 0]]} color={COR_SOL} dashed dashSize={0.4} gapSize={0.3} lineWidth={1} />
      )}

      {luz.pontuais.map((l) => {
        const selecionada = l.id === selecionadaId
        return (
          <group key={l.id} ref={selecionada ? setAlvo : undefined} position={l.posicao}>
            <pointLight color={l.cor} intensity={l.intensidade} distance={l.alcance} decay={2} />
            {!apresentando && (
              <mesh onClick={clicar(l.id)}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color={l.cor} />
              </mesh>
            )}
            {!apresentando && selecionada && (
              <mesh scale={1.8} raycast={() => null}>
                <sphereGeometry args={[0.14, 12, 12]} />
                <meshBasicMaterial color="#ffffff" wireframe />
              </mesh>
            )}
          </group>
        )
      })}

      {!apresentando && alvo && selecionadaId && (
        <TransformControls
          object={alvo}
          mode="translate" // girar ou escalar não faz sentido para uma luz
          translationSnap={encaixe ? 0.5 : null}
          onMouseUp={aoSoltar}
        />
      )}
    </>
  )
}
