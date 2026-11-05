"use client"

import { useEffect, useMemo, useRef } from "react"
import { useFrame } from "@react-three/fiber"
import { Stars } from "@react-three/drei"
import { BackSide, Color, ShaderMaterial, type Group } from "three"

import { useCena } from "@/lib/store"

// Gradiente em três cores: do horizonte para cima (topo) e do horizonte para baixo (base).
// O fragmento termina com a conversão de cor do Three.js, para o que você escolhe no
// seletor aparecer igual na tela (sem o tom de cinema aplicado ao resto da cena).
const VERTICE = /* glsl */ `
  varying vec3 direcao;
  void main() {
    direcao = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`
const FRAGMENTO = /* glsl */ `
  uniform vec3 topo;
  uniform vec3 horizonte;
  uniform vec3 base;
  varying vec3 direcao;
  void main() {
    float h = direcao.y;
    vec3 cor = h >= 0.0
      ? mix(horizonte, topo, pow(h, 0.55))
      : mix(horizonte, base, pow(-h, 0.45));
    gl_FragColor = vec4(cor, 1.0);
    #include <colorspace_fragment>
  }
`

const RAIO = 450 // menor que o alcance das câmeras (600)

// O céu: uma esfera enorme, vista por dentro, que acompanha a câmera (então nunca "chega perto").
export default function Ceu() {
  const topo = useCena((s) => s.ambiente.ceuTopo)
  const horizonte = useCena((s) => s.ambiente.ceuHorizonte)
  const base = useCena((s) => s.ambiente.ceuBase)
  const estrelas = useCena((s) => s.ambiente.estrelas)
  const qualidade = useCena((s) => s.qualidade)

  const grupo = useRef<Group>(null)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: { topo: { value: new Color() }, horizonte: { value: new Color() }, base: { value: new Color() } },
        vertexShader: VERTICE,
        fragmentShader: FRAGMENTO,
        side: BackSide,
        depthWrite: false,
        fog: false,
        toneMapped: false,
      }),
    [],
  )

  useEffect(() => {
    material.uniforms.topo.value.set(topo)
    material.uniforms.horizonte.value.set(horizonte)
    material.uniforms.base.value.set(base)
  }, [material, topo, horizonte, base])

  useEffect(() => () => material.dispose(), [material])

  useFrame(({ camera }) => {
    grupo.current?.position.copy(camera.position)
  })

  return (
    <group ref={grupo}>
      <mesh renderOrder={-1000} frustumCulled={false}>
        <sphereGeometry args={[RAIO, 32, 16]} />
        <primitive object={material} attach="material" />
      </mesh>
      {estrelas && (
        <Stars radius={RAIO * 0.7} depth={60} count={qualidade === "baixa" ? 1500 : 5000} factor={9} saturation={0} fade speed={0.6} />
      )}
    </group>
  )
}
