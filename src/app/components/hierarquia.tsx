"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Eye, EyeOff, Lock, Package, Unlock } from "lucide-react"
import { useCena } from "@/lib/store"

// Lista de grupos e objetos soltos: seleciona, marca para agrupar, oculta e trava.
// Os grupos começam fechados; clicar no nome seleciona o grupo e mostra/esconde o que tem dentro.
export default function Hierarquia() {
  const objetos = useCena((s) => s.objetos)
  const grupos = useCena((s) => s.grupos)
  const selecionadoId = useCena((s) => s.selecionadoId)
  const grupoSelecionadoId = useCena((s) => s.grupoSelecionadoId)
  const multiSelecao = useCena((s) => s.multiSelecao)
  const { selecionar, selecionarGrupo, alternarMulti, definirMulti, limparSelecao, agrupar } = useCena.getState()
  const { alternarTravaGrupo, alternarTravaObjeto, alternarOculto, alternarOcultoGrupo } = useCena.getState()

  const [nomeGrupo, setNomeGrupo] = useState("")
  const [abertos, setAbertos] = useState<Set<string>>(new Set())

  function alternarAberto(id: string) {
    setAbertos((atual) => {
      const novo = new Set(atual)
      if (novo.has(id)) novo.delete(id)
      else novo.add(id)
      return novo
    })
  }

  const soltos = objetos.filter((o) => !o.grupoId)
  const selecionaveis = soltos.filter((o) => !o.travado)

  return (
    <div>
      <div className="titulo-secao" style={{ marginTop: 4 }}>
        Objetos <span className="pilula">{objetos.length}</span> · Grupos <span className="pilula">{grupos.length}</span>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
        <button onClick={() => definirMulti(selecionaveis.map((o) => o.id))} disabled={selecionaveis.length === 0}>
          Marcar todos os soltos
        </button>
        <button className="fantasma" onClick={limparSelecao}>
          Limpar seleção
        </button>
      </div>

      {multiSelecao.length > 0 && (
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          <input
            placeholder={`Nome do grupo (${multiSelecao.length} marcados)`}
            value={nomeGrupo}
            onChange={(e) => setNomeGrupo(e.target.value)}
            style={{ flex: 1 }}
          />
          <button
            className="primario"
            onClick={() => {
              agrupar(nomeGrupo)
              setNomeGrupo("")
            }}
          >
            <Package size={15} /> Agrupar
          </button>
        </div>
      )}

      <ul style={{ listStyle: "none", padding: 0 }}>
        {grupos.map((g) => {
          const membros = objetos.filter((o) => o.grupoId === g.id)
          // fica aberto também quando um dos objetos dele está selecionado
          const aberto = abertos.has(g.id) || membros.some((o) => o.id === selecionadoId)
          return (
            <li key={g.id} style={{ marginBottom: 4 }}>
              <div style={{ display: "flex", gap: 4, alignItems: "center", opacity: g.oculto ? 0.55 : 1 }}>
                <button
                  className={`item ${g.id === grupoSelecionadoId ? "ativo" : ""}`}
                  onClick={() => {
                    selecionarGrupo(g.id)
                    alternarAberto(g.id)
                  }}
                >
                  {aberto ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Package size={14} />
                  <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {g.nome}
                  </span>
                  <span className="pilula">{membros.length}</span>
                </button>
                <button className="icone fantasma" onClick={() => alternarOcultoGrupo(g.id)} title={g.oculto ? "Mostrar grupo" : "Ocultar grupo"}>
                  {g.oculto ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
                <button className="icone fantasma" onClick={() => alternarTravaGrupo(g.id)} title={g.travado ? "Destravar grupo" : "Travar grupo"}>
                  {g.travado ? <Lock size={15} color="var(--destaque)" /> : <Unlock size={15} />}
                </button>
              </div>
              {aberto && (
                <ul style={{ listStyle: "none", padding: "0 0 0 22px", margin: "2px 0 0" }}>
                  {membros.map((o) => (
                    <li key={o.id}>
                      <button
                        className={`item ${o.id === selecionadoId ? "ativo" : ""}`}
                        // num grupo travado, só dá para selecionar o grupo (para destravar)
                        onClick={() => (g.travado ? selecionarGrupo(g.id) : selecionar(o.id))}
                      >
                        {o.nome}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          )
        })}

        {soltos.map((o) => (
          <li key={o.id} style={{ display: "flex", gap: 4, alignItems: "center", opacity: o.oculto ? 0.55 : 1 }}>
            <input
              type="checkbox"
              checked={multiSelecao.includes(o.id)}
              disabled={o.travado}
              onChange={() => alternarMulti(o.id)}
              title="Marcar para agrupar"
            />
            <button className={`item ${o.id === selecionadoId ? "ativo" : ""}`} onClick={() => selecionar(o.id)}>
              <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{o.nome}</span>
            </button>
            <button className="icone fantasma" onClick={() => alternarOculto(o.id)} title={o.oculto ? "Mostrar" : "Ocultar"}>
              {o.oculto ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
            <button className="icone fantasma" onClick={() => alternarTravaObjeto(o.id)} title={o.travado ? "Destravar" : "Travar"}>
              {o.travado ? <Lock size={15} color="var(--destaque)" /> : <Unlock size={15} />}
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
