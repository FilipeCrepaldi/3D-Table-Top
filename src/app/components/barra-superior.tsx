"use client"

import { Camera, Dices, Grid3x3, Play, Video } from "lucide-react"
import { useCena } from "@/lib/store"
import BarraCenas from "./barra-cenas"

// Barra do topo: nome do aplicativo, cenas, câmera e o botão de apresentar.
export default function BarraSuperior() {
  const modoCamera = useCena((s) => s.modoCamera)
  const mostrarGrade = useCena((s) => s.mostrarGrade)
  const { definirModoCamera, alternarGrade, iniciarApresentacao } = useCena.getState()

  const isometrica = modoCamera === "isometrica"

  return (
    <header className="topo">
      <div className="logo">
        <Dices size={20} /> Tabletop 3D
      </div>

      <div className="separador" />
      <BarraCenas />
      <div className="espaco" />

      <div className="grupo-botoes">
        <button
          onClick={() => definirModoCamera(isometrica ? "perspectiva" : "isometrica")}
          title="Alternar entre a câmera isométrica (maquete) e a em perspectiva"
        >
          {isometrica ? <Video size={15} /> : <Camera size={15} />} {isometrica ? "Isométrica" : "Perspectiva"}
        </button>
        <button className={mostrarGrade ? "ativo icone" : "icone"} onClick={alternarGrade} title="Mostrar ou esconder a grade">
          <Grid3x3 size={16} />
        </button>
        <button className="primario" onClick={iniciarApresentacao} title="Modo de apresentação (P)">
          <Play size={15} /> Apresentar
        </button>
      </div>
    </header>
  )
}
