"use client"

import { Component, useMemo, type ReactNode } from "react"
import { useGLTF } from "@react-three/drei"
import type { ThreeElements } from "@react-three/fiber"
import type { Mesh } from "three"
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js"

type ModeloProps = {
  /** URL do modelo: caminho a partir de /public ou blob: de um arquivo importado */
  arquivo: string
} & ThreeElements["group"] // aceita position, rotation, scale etc.

// Se um modelo falhar ao carregar (arquivo corrompido, por exemplo), o erro
// fica contido aqui: aquele objeto some, mas o resto da cena continua.
export class LimiteDeErro extends Component<{ arquivo: string; children: ReactNode }, { erro: boolean }> {
  state = { erro: false }

  static getDerivedStateFromError() {
    return { erro: true }
  }

  componentDidCatch(erro: Error) {
    console.warn(`Falha ao carregar o modelo ${this.props.arquivo}`, erro)
  }

  render() {
    return this.state.erro ? null : this.props.children
  }
}

// Carrega um modelo glTF/GLB e o desenha na cena.
function ModeloInterno({ arquivo, ...props }: ModeloProps) {
  // useGLTF baixa o arquivo uma vez e guarda em cache (suspende até carregar)
  const { scene } = useGLTF(arquivo)

  // O cache devolve sempre a mesma cena; clonamos para poder usar o mesmo
  // modelo várias vezes (várias cadeiras, por exemplo) em posições diferentes.
  const copiaDoModelo = useMemo(() => {
    // SkeletonUtils.clone também religa o esqueleto de modelos animados.
    // Com scene.clone() esses modelos ficam presos na posição original.
    const copia = clone(scene)
    copia.traverse((obj) => {
      const mesh = obj as Mesh
      if (mesh.isMesh) {
        mesh.castShadow = true
        mesh.receiveShadow = true
      }
    })
    return copia
  }, [scene])

  return (
    <group {...props}>
      <primitive object={copiaDoModelo} />
    </group>
  )
}

export default function Modelo(props: ModeloProps) {
  return (
    <LimiteDeErro arquivo={props.arquivo}>
      <ModeloInterno {...props} />
    </LimiteDeErro>
  )
}
