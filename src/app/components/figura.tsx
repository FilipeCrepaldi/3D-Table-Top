"use client"

import { Billboard, useTexture } from "@react-three/drei"
import type { ThreeElements } from "@react-three/fiber"
import { DoubleSide } from "three"

import type { Arte } from "@/lib/tipos"
import { LimiteDeErro } from "./modelo"

// Altura da figura na escala 1: um personagem de tamanho humano na cena
// (a porta da taverna tem cerca de 2,4 e a parede, 3,1).
const ALTURA_BASE = 1.8

type FiguraProps = { arte: Arte } & ThreeElements["group"]

function FiguraInterna({ arte, ...props }: FiguraProps) {
  const textura = useTexture(arte.arquivo)
  const altura = ALTURA_BASE
  const largura = (altura * arte.largura) / arte.altura

  return (
    <group {...props}>
      {/* Billboard: gira para olhar a câmera, mas só em torno do eixo vertical,
          então a figura fica sempre em pé. A base fica no chão (y = 0). */}
      <Billboard follow lockX lockZ position={[0, altura / 2, 0]}>
        <mesh>
          <planeGeometry args={[largura, altura]} />
          {/* Sem iluminação: a arte aparece com as cores originais. alphaTest evita
              o contorno claro em volta de figuras recortadas. */}
          <meshBasicMaterial map={textura} transparent alphaTest={0.05} side={DoubleSide} toneMapped={false} />
        </mesh>
      </Billboard>
    </group>
  )
}

// Uma arte 2D "em pé" dentro da cena. Se a imagem falhar ao carregar, some sem quebrar a cena.
export default function Figura(props: FiguraProps) {
  return (
    <LimiteDeErro arquivo={props.arte.arquivo}>
      <FiguraInterna {...props} />
    </LimiteDeErro>
  )
}
