"use client"

import { X } from "lucide-react"
import { useArtes } from "@/lib/artes"
import { useCena } from "@/lib/store"

// Cartões de personagem mostrados ao lado da cena na apresentação:
// retrato grande, nome e descrição. O "✕" esconde o cartão.
export default function Cartoes() {
  const cartoes = useCena((s) => s.cartoes)
  const artes = useArtes((s) => s.artes)

  const visiveis = cartoes
    .map((id) => artes.find((a) => a.id === id))
    .filter((a): a is NonNullable<typeof a> => a !== undefined)

  if (visiveis.length === 0) return null

  return (
    <div
      style={{
        position: "absolute",
        top: 68,
        left: 12,
        bottom: 12,
        width: 240,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        overflowY: "auto",
        pointerEvents: "none", // só os cartões em si recebem cliques
      }}
    >
      {visiveis.map((arte) => (
        <div
          key={arte.id}
          className="cartao-personagem"
        >
          <button
            onClick={() => useCena.getState().alternarCartao(arte.id)}
            title="Esconder cartão"
            className="icone"
            style={{ position: "absolute", top: 8, right: 8 }}
          >
            <X size={14} />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={arte.arquivo}
            alt={arte.nome}
            style={{ width: "100%", maxHeight: 300, objectFit: "contain", display: "block" }}
          />
          <div style={{ fontWeight: "bold", fontSize: 16, marginTop: 8 }}>{arte.nome}</div>
          {arte.descricao && (
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4, whiteSpace: "pre-wrap" }}>
              {arte.descricao}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
