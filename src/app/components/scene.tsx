"use client" // Canvas usa WebGL, que só existe no navegador

import { Suspense, useEffect, useMemo, useRef } from "react"
import { Canvas, useFrame, useThree } from "@react-three/fiber"
import {
  Grid,
  OrbitControls,
  OrthographicCamera,
  PerspectiveCamera,
  Sparkles,
} from "@react-three/drei"
import { MOUSE, type Points } from "three"

import { useArtes } from "@/lib/artes"
import { useAudios } from "@/lib/audios"
import { useCena } from "@/lib/store"
import * as pintura from "@/lib/terreno-pintura"
import * as camera from "@/lib/camera"
import { useBiblioteca } from "@/lib/biblioteca"
import { aplicarCena, cenaAtual } from "@/lib/cena-atual"
const { desfazerPincelada } = pintura
import type { Qualidade, TipoParticula } from "@/lib/tipos"
import Apresentacao from "./apresentacao"
import BarraSuperior from "./barra-superior"
import Biblioteca from "./biblioteca"
import Ceu from "./ceu"
import ControlesCamera from "./controles-camera"
import LuzesDaCena from "./luzes-da-cena"
import MotorDeAudio from "./motor-de-audio"
import ObjetosDaCena from "./objetos-da-cena"
import Painel from "./painel"
import TerrenoPintavel from "./terreno-pintavel"

// Atalhos: P alterna a apresentação, W mover, E girar, R escalar, Delete exclui, Ctrl+D duplica,
// Ctrl+G agrupa os objetos marcados, Esc limpa a seleção (ou sai do pincel), Ctrl+Z desfaz a pincelada
function useAtalhos() {
  useEffect(() => {
    function aoPressionar(e: KeyboardEvent) {
      const alvo = e.target as HTMLElement
      if (alvo.tagName === "INPUT" || alvo.tagName === "TEXTAREA" || alvo.tagName === "SELECT") return

      const s = useCena.getState()
      const tecla = e.key.toLowerCase()

      if (tecla === "p") {
        if (s.apresentando) {
          if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
          s.sairApresentacao()
        } else s.iniciarApresentacao()
      } else if (s.apresentando) {
        return // na apresentação só o P funciona
      } else if (tecla === "z" && e.ctrlKey && s.pincel.ativo) {
        e.preventDefault()
        desfazerPincelada()
      } else if (tecla === "escape" && s.pincel.ativo) {
        s.atualizarPincel({ ativo: false }) // o primeiro Esc sai do pincel
      } else if (tecla === "w") s.definirModo("translate")
      else if (tecla === "e") s.definirModo("rotate")
      else if (tecla === "r") s.definirModo("scale")
      else if (tecla === "escape") s.limparSelecao()
      else if (tecla === "delete") {
        // o próprio store ignora o que estiver travado
        if (s.luzSelecionadaId) {
          if (s.luzSelecionadaId !== "sol") s.removerLuzPontual(s.luzSelecionadaId) // o sol não se apaga
        } else if (s.grupoSelecionadoId) s.removerGrupo(s.grupoSelecionadoId)
        else if (s.multiSelecao.length > 0) s.multiSelecao.forEach((id) => s.remover(id))
        else if (s.selecionadoId) s.remover(s.selecionadoId)
      } else if (tecla === "d" && e.ctrlKey) {
        e.preventDefault() // Ctrl+D marca a página como favorito
        if (s.grupoSelecionadoId) s.duplicarGrupo(s.grupoSelecionadoId)
        else if (s.selecionadoId) s.duplicar(s.selecionadoId)
      } else if (tecla === "g" && e.ctrlKey && s.multiSelecao.length > 0) {
        e.preventDefault()
        s.agrupar("")
      }
    }
    window.addEventListener("keydown", aoPressionar)
    return () => window.removeEventListener("keydown", aoPressionar)
  }, [])
}

// Posição inicial das câmeras: [x, y, z]. Y é para cima.
const POSICAO_CAMERA: [number, number, number] = [8, 8, 8]

// Ajustes por nível de qualidade
const RESOLUCAO: Record<Qualidade, number | [number, number]> = {
  baixa: 1,
  media: [1, 1.5],
  alta: [1, 2],
}
const FATOR_PARTICULAS: Record<Qualidade, number> = { baixa: 0.3, media: 1, alta: 1.5 }

// Chuva e neve: pontos que caem e voltam ao topo quando chegam ao chão
const AREA = 24 // largura e profundidade da região com partículas
const ALTURA = 10

function Precipitacao({ tipo, quantidade }: { tipo: "chuva" | "neve"; quantidade: number }) {
  const ref = useRef<Points>(null)

  const posicoes = useMemo(() => {
    const a = new Float32Array(quantidade * 3)
    for (let i = 0; i < quantidade; i++) {
      a[i * 3] = (Math.random() - 0.5) * AREA
      a[i * 3 + 1] = Math.random() * ALTURA
      a[i * 3 + 2] = (Math.random() - 0.5) * AREA
    }
    return a
  }, [quantidade])

  useFrame(({ clock }, delta) => {
    const atributo = ref.current?.geometry.getAttribute("position")
    if (!atributo) return
    const p = atributo.array as Float32Array
    const velocidade = tipo === "chuva" ? 14 : 1.2
    const t = clock.elapsedTime
    for (let i = 0; i < quantidade; i++) {
      p[i * 3 + 1] -= velocidade * delta
      if (tipo === "neve") p[i * 3] += Math.sin(t + i) * 0.4 * delta // balanço lateral
      if (p[i * 3 + 1] < 0) p[i * 3 + 1] = ALTURA
    }
    atributo.needsUpdate = true
  })

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[posicoes, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={tipo === "chuva" ? "#9fc3ff" : "#ffffff"}
        size={tipo === "chuva" ? 0.05 : 0.09}
        transparent
        opacity={tipo === "chuva" ? 0.6 : 0.9}
        depthWrite={false}
      />
    </points>
  )
}

// Névoa e partículas da cena, lidas do estado
function Atmosfera() {
  const ambiente = useCena((s) => s.ambiente)
  const qualidade = useCena((s) => s.qualidade)
  const quantidade = Math.round(ambiente.particulasQuantidade * FATOR_PARTICULAS[qualidade])
  const tipo: TipoParticula = ambiente.particulas

  return (
    <>
      {/* O céu cobre o fundo; esta cor só aparece se a névoa estiver ligada e densa demais */}
      <color attach="background" args={[ambiente.nevoaAtiva ? ambiente.nevoaCor : ambiente.ceuHorizonte]} />
      <Ceu />
      {ambiente.nevoaAtiva && <fogExp2 attach="fog" args={[ambiente.nevoaCor, ambiente.nevoaDensidade]} />}

      {tipo === "poeira" && (
        <Sparkles count={quantidade} scale={[AREA / 2, 4, AREA / 3]} position={[0, 2.5, 0]} size={3} speed={0.3} opacity={0.6} />
      )}
      {(tipo === "chuva" || tipo === "neve") && (
        <Precipitacao key={`${tipo}-${quantidade}`} tipo={tipo} quantidade={quantidade} />
      )}
    </>
  )
}

// Mede FPS, chamadas de desenho e triângulos, 2 vezes por segundo (só se estiver visível)
function MedidorFps() {
  const gl = useThree((s) => s.gl)
  const acumulado = useRef({ tempo: 0, quadros: 0 })

  useFrame((_, delta) => {
    if (!useCena.getState().mostrarFps) return
    const a = acumulado.current
    a.tempo += delta
    a.quadros++
    if (a.tempo >= 0.5) {
      useCena.setState({
        fps: Math.round(a.quadros / a.tempo),
        chamadas: gl.info.render.calls,
        triangulos: gl.info.render.triangles,
      })
      a.tempo = 0
      a.quadros = 0
    }
  })

  return null
}

function PainelFps() {
  const mostrar = useCena((s) => s.mostrarFps)
  const fps = useCena((s) => s.fps)
  const chamadas = useCena((s) => s.chamadas)
  const triangulos = useCena((s) => s.triangulos)
  if (!mostrar) return null

  return (
    <div className="medidor" style={{ color: fps >= 30 ? "var(--ok)" : "var(--perigo)" }}>
      {fps} FPS · {chamadas} chamadas · {(triangulos / 1000).toFixed(1)}k triângulos
    </div>
  )
}

// Botões do mouse: normalmente o esquerdo gira a câmera; com o pincel ligado ele pinta,
// então a câmera passa para o direito (girar) e o do meio (arrastar).
const BOTOES_NORMAL = { LEFT: MOUSE.ROTATE, MIDDLE: MOUSE.DOLLY, RIGHT: MOUSE.PAN }
const BOTOES_PINCEL = { LEFT: -1 as unknown as MOUSE, MIDDLE: MOUSE.PAN, RIGHT: MOUSE.ROTATE }

export default function Scene() {
  const modo = useCena((s) => s.modoCamera)
  const qualidade = useCena((s) => s.qualidade)
  const apresentando = useCena((s) => s.apresentando)
  const mostrarGrade = useCena((s) => s.mostrarGrade)
  const pincelAtivo = useCena((s) => s.pincel.ativo)
  useAtalhos()

  useEffect(() => {
    useArtes.getState().iniciar()
    useAudios.getState().iniciar()

    // Gancho para testes e para montar cenas por script: abra a página com ?debug.
    // Entrega as mesmas ações que a interface usa; não muda nada se não houver ?debug.
    if (new URLSearchParams(window.location.search).has("debug")) {
      Object.assign(window, { __tabletop: { useCena, useBiblioteca, pintura, camera, aplicarCena, cenaAtual } })
    }
  }, [])

  return (
    <div className={`app${apresentando ? " apresentando" : ""}`}>
      {!apresentando && <BarraSuperior />}
      {!apresentando && (
        <aside className="lateral esq">
          <Biblioteca />
        </aside>
      )}

      <main className="palco">
        {/* onPointerMissed: clique em área vazia remove a seleção */}
        <Canvas
          shadows={qualidade !== "baixa"}
          dpr={RESOLUCAO[qualidade]}
          onPointerMissed={() => useCena.getState().limparSelecao()}
        >
          {/* Só uma câmera é "default" por vez; trocar o modo troca a câmera.
              Na ortográfica o near é negativo: o que está "atrás" do plano da câmera ainda aparece;
              sem isso, ao afastar muito o zoom, a parte de baixo do chão era cortada. */}
          {modo === "isometrica" ? (
            <OrthographicCamera makeDefault position={POSICAO_CAMERA} zoom={60} near={-400} far={600} />
          ) : (
            <PerspectiveCamera makeDefault position={POSICAO_CAMERA} fov={50} near={0.2} far={600} />
          )}

          {/* makeDefault: o gizmo desliga a câmera enquanto você arrasta */}
          <OrbitControls
            makeDefault
            target={[0, 0, 0]}
            maxPolarAngle={Math.PI / 2 - 0.05} // não deixa passar por baixo do piso
            enableZoom={false} // o zoom é feito por ControlesCamera (suave e com limites próprios)
            minDistance={0.1}
            maxDistance={500}
            mouseButtons={pincelAtivo ? BOTOES_PINCEL : BOTOES_NORMAL}
          />

          <ControlesCamera />

          {/* Luzes: sem elas, materiais "standard" ficam pretos */}
          <LuzesDaCena />
          <Atmosfera />
          <MedidorFps />

          <TerrenoPintavel />
          {!apresentando && mostrarGrade && (
            <Grid
              infiniteGrid
              position={[0, -0.03, 0]}
              cellColor="#666"
              sectionColor="#999"
              // Na isométrica a câmera fica perto da origem e vê muito longe: a grade vai bem longe.
              // Na perspectiva, a grade some mais cedo para não "chiar" perto do horizonte.
              fadeDistance={modo === "isometrica" ? 500 : 90}
              fadeStrength={modo === "isometrica" ? 1 : 2}
            />
          )}

          {/* Modelos demandam carregar arquivos; Suspense cuida da espera */}
          <Suspense fallback={null}>
            <ObjetosDaCena />
          </Suspense>
        </Canvas>

        {apresentando && <Apresentacao />}
        <PainelFps />
        <MotorDeAudio />
      </main>

      {!apresentando && <Painel />}
    </div>
  )
}
