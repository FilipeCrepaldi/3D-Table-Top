"use client"

import { useEffect, useMemo, useState } from "react"
import { ControlesTrilha, VolumeGeral } from "./audio-painel"
import Cartoes from "./cartoes"
import { Maximize, Pencil, SlidersHorizontal } from "lucide-react"
import { QUANTIDADE_PADRAO } from "@/lib/ambiente"
import { useArtes } from "@/lib/artes"
import { irParaVista } from "@/lib/camera"
import { aplicarCena } from "@/lib/cena-atual"
import { listarCenas } from "@/lib/salvamento"
import { useCena } from "@/lib/store"
import type { CenaSalva, TipoParticula } from "@/lib/tipos"


const normalizar = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

async function alternarTelaCheia() {
  if (document.fullscreenElement) await document.exitFullscreen()
  else await document.documentElement.requestFullscreen()
}

// Painel do mestre: tudo que se usa durante a sessão, sem as ferramentas de edição.
function PainelDoMestre() {
  const nomeCena = useCena((s) => s.nome)
  const estados = useCena((s) => s.estados)
  const pontos = useCena((s) => s.pontosCamera)
  const modoCamera = useCena((s) => s.modoCamera)
  const ambiente = useCena((s) => s.ambiente)
  const objetos = useCena((s) => s.objetos)
  const grupos = useCena((s) => s.grupos)
  const artes = useArtes((s) => s.artes)
  const cartoes = useCena((s) => s.cartoes)
  const trilhas = useCena((s) => s.trilhas)
  const { aplicarEstado, atualizarAmbiente, definirModoCamera, alternarOculto, alternarOcultoGrupo, alternarCartao } =
    useCena.getState()

  const [cenas, setCenas] = useState<CenaSalva[]>([])
  const [aviso, setAviso] = useState<string | null>(null)
  const [busca, setBusca] = useState("")

  useEffect(() => {
    listarCenas()
      .then(setCenas)
      .catch(() => setAviso("Não foi possível ler as cenas salvas."))
  }, [])

  // O que dá para revelar/ocultar: grupos inteiros e objetos soltos
  const itens = useMemo(() => {
    const termo = normalizar(busca.trim())
    const lista = [
      ...grupos.map((g) => ({ id: g.id, nome: g.nome, oculto: g.oculto === true, grupo: true })),
      ...objetos
        .filter((o) => !o.grupoId)
        .map((o) => ({ id: o.id, nome: o.nome, oculto: o.oculto === true, grupo: false })),
    ]
    return lista.filter((i) => termo === "" || normalizar(i.nome).includes(termo))
  }, [grupos, objetos, busca])

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <details open>
        <summary>
          <strong>Cenas</strong>
        </summary>
        <ul style={{ listStyle: "none", padding: 0, margin: "6px 0 0" }}>
          {cenas.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => setAviso(aplicarCena(c))}
                className={`item ${c.nome === nomeCena ? "ativo" : ""}`}
              >
                {c.nome}
              </button>
            </li>
          ))}
          {cenas.length === 0 && <li style={{ opacity: 0.7 }}>Nenhuma cena salva.</li>}
        </ul>
        {aviso && <div style={{ marginTop: 4, opacity: 0.8 }}>{aviso}</div>}
      </details>

      {estados.length > 0 && (
        <details open>
          <summary>
            <strong>Estados</strong>
          </summary>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
            {estados.map((e) => (
              <button key={e.id} onClick={() => aplicarEstado(e.id)}>
                {e.nome}
              </button>
            ))}
          </div>
        </details>
      )}

      <details open>
        <summary>
          <strong>Câmera</strong>
        </summary>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
          <button
            onClick={() => definirModoCamera(modoCamera === "isometrica" ? "perspectiva" : "isometrica")}
          >
            {modoCamera === "isometrica" ? "Isométrica" : "Perspectiva"} ⇄
          </button>
        </div>
        {pontos.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {pontos.map((p) => (
              <button key={p.id} onClick={() => irParaVista(p.vista)}>
                🎥 {p.nome}
              </button>
            ))}
          </div>
        ) : (
          <div style={{ opacity: 0.7 }}>Sem pontos de câmera. Crie no modo de edição.</div>
        )}
      </details>

      <details open>
        <summary>
          <strong>Áudio</strong>
        </summary>
        <div style={{ margin: "6px 0" }}>
          <VolumeGeral />
        </div>
        {trilhas.length > 0 ? (
          trilhas.map((t) => <ControlesTrilha key={t.id} id={t.id} compacto />)
        ) : (
          <div style={{ opacity: 0.7 }}>Sem sons na cena. Adicione no modo de edição.</div>
        )}
      </details>

      {artes.length > 0 && (
        <details open>
          <summary>
            <strong>Personagens</strong>
          </summary>
          <div style={{ opacity: 0.7, margin: "6px 0" }}>Mostra ou esconde o cartão ao lado da cena.</div>
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {artes.map((a) => (
              <li key={a.id}>
                <button
                  onClick={() => alternarCartao(a.id)}
                  className={`item ${cartoes.includes(a.id) ? "ativo" : ""}`}
                >
                  {cartoes.includes(a.id) ? "👁" : "🙈"} {a.nome}
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <details>
        <summary>
          <strong>Atmosfera</strong>
        </summary>
        <div style={{ margin: "6px 0" }}>
          <label>
            <input
              type="checkbox"
              checked={ambiente.nevoaAtiva}
              onChange={(e) => atualizarAmbiente({ nevoaAtiva: e.target.checked })}
            />{" "}
            Névoa
          </label>
        </div>
        <label>
          Partículas{" "}
          <select
            value={ambiente.particulas}
            onChange={(e) => {
              const tipo = e.target.value as TipoParticula
              atualizarAmbiente({ particulas: tipo, particulasQuantidade: QUANTIDADE_PADRAO[tipo] })
            }}
          >
            <option value="nenhuma">Nenhuma</option>
            <option value="poeira">Poeira</option>
            <option value="chuva">Chuva</option>
            <option value="neve">Neve</option>
          </select>
        </label>
      </details>

      <details>
        <summary>
          <strong>Revelar / ocultar</strong>
        </summary>
        <input
          type="search"
          placeholder="Buscar..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          style={{ width: "100%", margin: "6px 0" }}
        />
        <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 220, overflowY: "auto" }}>
          {itens.map((i) => (
            <li key={i.id}>
              <button
                onClick={() => (i.grupo ? alternarOcultoGrupo(i.id) : alternarOculto(i.id))}
                className={`item ${i.oculto ? "" : "ativo"}`}
              >
                {i.oculto ? "🙈" : "👁"} {i.grupo ? "📦 " : ""}
                {i.nome}
              </button>
            </li>
          ))}
        </ul>
      </details>
    </div>
  )
}

// Tela do modo de apresentação: só a cena, uma barrinha e o painel do mestre.
export default function Apresentacao() {
  const [painelAberto, setPainelAberto] = useState(true)

  function sair() {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    useCena.getState().sairApresentacao()
  }

  return (
    <>
      <Cartoes />
      <div className="flutuante" style={{ top: 12, left: 12, display: "flex", gap: 6, padding: 6 }}>
        <button onClick={sair}>
          <Pencil size={15} /> Editar (P)
        </button>
        <button onClick={() => alternarTelaCheia()}>
          <Maximize size={15} /> Tela cheia
        </button>
        <button className={painelAberto ? "ativo" : ""} onClick={() => setPainelAberto((a) => !a)}>
          <SlidersHorizontal size={15} /> Painel do mestre
        </button>
      </div>

      {painelAberto && (
        <aside
          className="flutuante"
          style={{
            top: 12,
            right: 12,
            width: 290,
            maxHeight: "calc(100% - 24px)",
            overflowY: "auto",
            padding: 12,
          }}
        >
          <PainelDoMestre />
        </aside>
      )}
    </>
  )
}
