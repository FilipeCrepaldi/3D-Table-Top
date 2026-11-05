"use client"

import { useEffect, useState } from "react"
import {
  Copy,
  Globe2,
  Image as ImagemIcone,
  Layers,
  Lock,
  Magnet,
  Move3d,
  Package,
  Rotate3d,
  Scale3d,
  Trash2,
  Ungroup,
  Unlock,
  Video,
  X,
  type LucideIcon,
} from "lucide-react"
import { irParaVista, lerVista } from "@/lib/camera"
import { useCena, type ModoTransformacao } from "@/lib/store"
import Ambiente from "./ambiente"
import ArtesPainel from "./artes-painel"
import AudioPainel from "./audio-painel"
import { CamposVec3, paraGraus, paraRadianos } from "./campos"
import CeuPainel from "./ceu-painel"
import Hierarquia from "./hierarquia"
import Iluminacao from "./iluminacao"
import TerrenoPainel from "./terreno-painel"

const FERRAMENTAS: { modo: ModoTransformacao; rotulo: string; tecla: string; icone: LucideIcon }[] = [
  { modo: "translate", rotulo: "Mover", tecla: "W", icone: Move3d },
  { modo: "rotate", rotulo: "Girar", tecla: "E", icone: Rotate3d },
  { modo: "scale", rotulo: "Escalar", tecla: "R", icone: Scale3d },
]

type Aba = "cena" | "mundo" | "midia"
const ABAS: { id: Aba; rotulo: string; icone: LucideIcon }[] = [
  { id: "cena", rotulo: "Cena", icone: Layers },
  { id: "mundo", rotulo: "Mundo", icone: Globe2 },
  { id: "midia", rotulo: "Mídia", icone: ImagemIcone },
]

// Enquadramentos salvos: guarda a posição atual da câmera e volta a ela com uma viagem suave
function PontosDeCamera() {
  const pontos = useCena((s) => s.pontosCamera)
  const { salvarPontoCamera, removerPontoCamera } = useCena.getState()
  const [nome, setNome] = useState("")

  function guardar() {
    const vista = lerVista()
    if (!vista) return
    salvarPontoCamera(nome, vista)
    setNome("")
  }

  return (
    <details>
      <summary>
        <strong>Pontos de câmera</strong> <span className="pilula">{pontos.length}</span>
      </summary>
      <div className="dica" style={{ marginBottom: 8 }}>
        Posicione a câmera, dê um nome e guarde. Na apresentação, um clique leva até lá.
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <input placeholder="Nome (ex.: Balcão)" value={nome} onChange={(e) => setNome(e.target.value)} style={{ flex: 1 }} />
        <button onClick={guardar}>Guardar</button>
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
        {pontos.map((p) => (
          <li key={p.id} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <button className="item" onClick={() => irParaVista(p.vista)}>
              <Video size={14} /> {p.nome}
            </button>
            <button className="icone fantasma" onClick={() => removerPontoCamera(p.id)} title="Excluir ponto">
              <X size={14} />
            </button>
          </li>
        ))}
      </ul>
    </details>
  )
}

export default function Painel() {
  // Cada useCena(seletor) assina só o pedaço do estado que o componente usa
  const objetos = useCena((s) => s.objetos)
  const grupos = useCena((s) => s.grupos)
  const selecionadoId = useCena((s) => s.selecionadoId)
  const grupoSelecionadoId = useCena((s) => s.grupoSelecionadoId)
  const luzSelecionadaId = useCena((s) => s.luzSelecionadaId)
  const modo = useCena((s) => s.modo)
  const encaixe = useCena((s) => s.encaixe)
  const { remover, duplicar, atualizar, definirModo, alternarEncaixe } = useCena.getState()
  const { atualizarGrupo, alternarTravaGrupo, alternarTravaObjeto, desagrupar, duplicarGrupo, removerGrupo } =
    useCena.getState()

  const [aba, setAba] = useState<Aba>("cena")

  // Ao selecionar algo, mostra a aba certa
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (selecionadoId || grupoSelecionadoId) setAba("cena")
    else if (luzSelecionadaId) setAba("mundo")
  }, [selecionadoId, grupoSelecionadoId, luzSelecionadaId])

  const selecionado = objetos.find((o) => o.id === selecionadoId)
  const grupo = grupos.find((g) => g.id === grupoSelecionadoId)
  const grupoDoSelecionado = grupos.find((g) => g.id === selecionado?.grupoId)
  const objetoBloqueado = !!selecionado && (selecionado.travado === true || grupoDoSelecionado?.travado === true)

  return (
    <aside className="lateral dir">
      {/* Ferramentas do gizmo: sempre à vista */}
      <div className="faixa-ferramentas">
        {FERRAMENTAS.map((f) => (
          <button
            key={f.modo}
            className={f.modo === modo ? "ativo" : ""}
            onClick={() => definirModo(f.modo)}
            title={`${f.rotulo} (${f.tecla})`}
          >
            <f.icone size={16} /> {f.rotulo}
          </button>
        ))}
        <button
          className={encaixe ? "ativo icone" : "icone"}
          onClick={alternarEncaixe}
          title="Encaixar em passos ao arrastar (0,5 · 15° · 0,1)"
          style={{ marginLeft: "auto" }}
        >
          <Magnet size={16} />
        </button>
      </div>

      <div className="abas">
        {ABAS.map((a) => (
          <button key={a.id} className={aba === a.id ? "ativo" : ""} onClick={() => setAba(a.id)}>
            <a.icone size={15} /> {a.rotulo}
          </button>
        ))}
      </div>

      <div className="rolagem">
        {aba === "cena" && (
          <>
            {grupo && (
              <details open>
                <summary>
                  <Package size={15} /> <strong>Grupo</strong>
                </summary>
                <input
                  value={grupo.nome}
                  disabled={grupo.travado}
                  onChange={(e) => atualizarGrupo(grupo.id, { nome: e.target.value })}
                  style={{ width: "calc(100% - 24px)", marginBottom: 6 }}
                />
                {grupo.travado && (
                  <div className="dica" style={{ color: "var(--destaque)", marginBottom: 6 }}>
                    Grupo travado: não dá para selecionar nem mexer na cena.
                  </div>
                )}
                <CamposVec3
                  titulo="Posição"
                  valor={grupo.posicao}
                  passo={0.5}
                  desabilitado={grupo.travado}
                  aoMudar={(posicao) => atualizarGrupo(grupo.id, { posicao })}
                />
                <CamposVec3
                  titulo="Rotação (graus)"
                  valor={grupo.rotacao}
                  passo={15}
                  exibir={paraGraus}
                  ler={paraRadianos}
                  desabilitado={grupo.travado}
                  aoMudar={(rotacao) => atualizarGrupo(grupo.id, { rotacao })}
                />
                <CamposVec3
                  titulo="Escala"
                  valor={grupo.escala}
                  passo={0.1}
                  desabilitado={grupo.travado}
                  aoMudar={(escala) => atualizarGrupo(grupo.id, { escala })}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button onClick={() => alternarTravaGrupo(grupo.id)}>
                    {grupo.travado ? <Unlock size={15} /> : <Lock size={15} />} {grupo.travado ? "Destravar" : "Travar"}
                  </button>
                  <button onClick={() => desagrupar(grupo.id)} disabled={grupo.travado}>
                    <Ungroup size={15} /> Desagrupar
                  </button>
                  <button className="icone" onClick={() => duplicarGrupo(grupo.id)} title="Duplicar o grupo">
                    <Copy size={15} />
                  </button>
                  <button
                    className="icone perigo"
                    title="Excluir o grupo e tudo dentro dele"
                    onClick={() => {
                      if (window.confirm(`Excluir o grupo "${grupo.nome}" e todos os objetos dele?`)) {
                        removerGrupo(grupo.id)
                      }
                    }}
                    disabled={grupo.travado}
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </details>
            )}

            {selecionado && (
              <details open>
                <summary>
                  <strong>{selecionado.nome}</strong>
                  {grupoDoSelecionado && <span className="pilula">{grupoDoSelecionado.nome}</span>}
                </summary>
                <CamposVec3
                  titulo="Posição"
                  valor={selecionado.posicao}
                  passo={0.5}
                  desabilitado={objetoBloqueado}
                  aoMudar={(posicao) => atualizar(selecionado.id, { posicao })}
                />
                <CamposVec3
                  titulo="Rotação (graus)"
                  valor={selecionado.rotacao}
                  passo={15}
                  exibir={paraGraus}
                  ler={paraRadianos}
                  desabilitado={objetoBloqueado}
                  aoMudar={(rotacao) => atualizar(selecionado.id, { rotacao })}
                />
                <CamposVec3
                  titulo="Escala"
                  valor={selecionado.escala}
                  passo={0.1}
                  desabilitado={objetoBloqueado}
                  aoMudar={(escala) => atualizar(selecionado.id, { escala })}
                />
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  <button onClick={() => alternarTravaObjeto(selecionado.id)}>
                    {selecionado.travado ? <Unlock size={15} /> : <Lock size={15} />}{" "}
                    {selecionado.travado ? "Destravar" : "Travar"}
                  </button>
                  <button className="icone" onClick={() => duplicar(selecionado.id)} title="Duplicar (Ctrl+D)">
                    <Copy size={15} />
                  </button>
                  <button
                    className="icone perigo"
                    onClick={() => remover(selecionado.id)}
                    disabled={objetoBloqueado}
                    title="Excluir (Del)"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </details>
            )}

            <Hierarquia />
          </>
        )}

        {aba === "mundo" && (
          <>
            <TerrenoPainel />
            <CeuPainel />
            <Iluminacao />
            <Ambiente />
            <PontosDeCamera />
          </>
        )}

        {aba === "midia" && (
          <>
            <ArtesPainel />
            <AudioPainel />
          </>
        )}
      </div>
    </aside>
  )
}
