"use client"

import { useRef, useState } from "react"
import { useArtes } from "@/lib/artes"
import { useCena } from "@/lib/store"
import type { Arte } from "@/lib/tipos"

// Uma arte da lista: miniatura, ações e edição de nome e descrição.
function ItemArte({ arte, noCartao }: { arte: Arte; noCartao: boolean }) {
  const { atualizar, remover } = useArtes.getState()
  const [nome, setNome] = useState(arte.nome)
  const [descricao, setDescricao] = useState(arte.descricao)

  return (
    <li style={{ marginBottom: 8, padding: 6, border: "1px solid #444", borderRadius: 6 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={arte.arquivo}
          alt={arte.nome}
          style={{ width: 40, height: 56, objectFit: "contain", background: "#222", borderRadius: 4 }}
        />
        <strong style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {arte.nome}
        </strong>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, margin: "6px 0" }}>
        <button
          onClick={() => useCena.getState().adicionar(`arte/${arte.id}`, arte.nome, [0, 0, 0])}
          title="Coloca a figura em pé dentro da cena"
        >
          Pôr na cena
        </button>
        <label title="Mostra a arte, com nome e descrição, ao lado da cena na apresentação">
          <input type="checkbox" checked={noCartao} onChange={() => useCena.getState().alternarCartao(arte.id)} />{" "}
          Cartão
        </label>
      </div>

      <details>
        <summary>Editar</summary>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => nome.trim() && nome !== arte.nome && atualizar(arte.id, { nome })}
          style={{ width: "100%", margin: "6px 0" }}
        />
        <textarea
          value={descricao}
          placeholder="Descrição (aparece no cartão)"
          rows={3}
          onChange={(e) => setDescricao(e.target.value)}
          onBlur={() => descricao !== arte.descricao && atualizar(arte.id, { descricao })}
          style={{ width: "100%" }}
        />
        <button
          onClick={() => {
            if (window.confirm(`Apagar a arte "${arte.nome}"? As figuras dela somem das cenas.`)) remover(arte.id)
          }}
        >
          Apagar arte
        </button>
      </details>
    </li>
  )
}

// Biblioteca de artes 2D dos personagens (modo de edição).
export default function ArtesPainel() {
  const artes = useArtes((s) => s.artes)
  const erro = useArtes((s) => s.erro)
  const cartoes = useCena((s) => s.cartoes)

  const [nome, setNome] = useState("")
  const [descricao, setDescricao] = useState("")
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)

  async function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return
    setEnviando(true)
    const falha = await useArtes.getState().importar(arquivo, nome, descricao)
    setEnviando(false)
    setMensagem(falha ?? `"${nome.trim() || arquivo.name}" adicionada.`)
    if (!falha) {
      setNome("")
      setDescricao("")
    }
    if (inputArquivo.current) inputArquivo.current.value = ""
  }

  return (
    <details style={{ marginTop: 8 }}>
      <summary>
        <strong>Artes de personagens ({artes.length})</strong>
      </summary>

      <div style={{ opacity: 0.7, margin: "6px 0" }}>
        Use PNG com fundo transparente. A imagem é recortada automaticamente.
      </div>
      <input
        placeholder="Nome do personagem"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ width: "100%", marginBottom: 6 }}
      />
      <textarea
        placeholder="Descrição (opcional)"
        rows={2}
        value={descricao}
        onChange={(e) => setDescricao(e.target.value)}
        style={{ width: "100%", marginBottom: 6 }}
      />
      <input
        ref={inputArquivo}
        type="file"
        accept="image/*"
        disabled={enviando}
        onChange={(e) => aoEscolher(e.target.files?.[0])}
        style={{ width: "100%" }}
      />
      {enviando && <div style={{ marginTop: 6 }}>Enviando...</div>}
      {mensagem && <div style={{ marginTop: 6 }}>{mensagem}</div>}
      {erro && <div style={{ marginTop: 6, color: "#ff8080" }}>{erro}</div>}

      <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0" }}>
        {artes.map((a) => (
          <ItemArte key={a.id} arte={a} noCartao={cartoes.includes(a.id)} />
        ))}
      </ul>
    </details>
  )
}
