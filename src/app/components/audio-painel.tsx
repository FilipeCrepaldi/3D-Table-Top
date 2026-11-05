"use client"

import { useRef, useState } from "react"
import { useAudios } from "@/lib/audios"
import { useCena } from "@/lib/store"

// Controles de uma trilha: ligar/desligar, volume, repetir.
export function ControlesTrilha({ id, compacto = false }: { id: string; compacto?: boolean }) {
  const trilha = useCena((s) => s.trilhas.find((t) => t.id === id))
  const audio = useAudios((s) => s.audios.find((a) => a.id === trilha?.audioId))
  const { atualizarTrilha, removerTrilha } = useCena.getState()
  if (!trilha) return null

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 8 }}>
      <div style={{ display: "flex", gap: 6 }}>
        <button
          onClick={() => atualizarTrilha(trilha.id, { tocando: !trilha.tocando })}
          style={{ flex: 1, textAlign: "left", fontWeight: trilha.tocando ? "bold" : "normal" }}
          title={trilha.tocando ? "Parar" : "Tocar"}
        >
          {trilha.tocando ? "⏸" : "▶"} {audio?.nome ?? "(som apagado)"}
        </button>
        {!compacto && (
          <button onClick={() => removerTrilha(trilha.id)} title="Tirar da cena">
            ✕
          </button>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <input
          type="range"
          min={0}
          max={1}
          step={0.01}
          value={trilha.volume}
          onChange={(e) => atualizarTrilha(trilha.id, { volume: Number(e.target.value) })}
          style={{ flex: 1 }}
          title="Volume"
        />
        {!compacto && (
          <label title="Repetir quando acabar">
            <input
              type="checkbox"
              checked={trilha.repetir}
              onChange={(e) => atualizarTrilha(trilha.id, { repetir: e.target.checked })}
            />{" "}
            🔁
          </label>
        )}
      </div>
    </div>
  )
}

// Volume geral, por cima do volume de cada trilha.
export function VolumeGeral() {
  const volume = useCena((s) => s.volumeGeral)
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
      🔊 Geral
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={volume}
        onChange={(e) => useCena.getState().definirVolumeGeral(Number(e.target.value))}
        style={{ flex: 1 }}
      />
    </label>
  )
}

// Biblioteca de sons e trilhas da cena (modo de edição).
export default function AudioPainel() {
  const audios = useAudios((s) => s.audios)
  const erro = useAudios((s) => s.erro)
  const trilhas = useCena((s) => s.trilhas)

  const [nome, setNome] = useState("")
  const [mensagem, setMensagem] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)
  const inputArquivo = useRef<HTMLInputElement>(null)

  async function aoEscolher(arquivo: File | undefined) {
    if (!arquivo) return
    setEnviando(true)
    const falha = await useAudios.getState().importar(arquivo, nome)
    setEnviando(false)
    setMensagem(falha ?? `"${nome.trim() || arquivo.name}" adicionado.`)
    if (!falha) setNome("")
    if (inputArquivo.current) inputArquivo.current.value = ""
  }

  return (
    <details style={{ marginTop: 8 }}>
      <summary>
        <strong>Áudio ({trilhas.length} na cena)</strong>
      </summary>

      <div style={{ margin: "8px 0" }}>
        <VolumeGeral />
      </div>

      {trilhas.length > 0 && (
        <div style={{ margin: "8px 0" }}>
          <div style={{ opacity: 0.7, marginBottom: 4 }}>Na cena</div>
          {trilhas.map((t) => (
            <ControlesTrilha key={t.id} id={t.id} />
          ))}
        </div>
      )}

      <div style={{ opacity: 0.7, margin: "8px 0 4px" }}>Biblioteca de sons ({audios.length})</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
        {audios.map((a) => (
          <li key={a.id} style={{ display: "flex", gap: 6, marginBottom: 4 }}>
            <button
              onClick={() => useCena.getState().adicionarTrilha(a.id)}
              style={{ flex: 1, textAlign: "left" }}
              title="Adicionar à cena"
            >
              ＋ {a.nome}
            </button>
            <button
              onClick={() => {
                if (window.confirm(`Apagar o som "${a.nome}"? Ele some das cenas que o usam.`)) {
                  useAudios.getState().remover(a.id)
                }
              }}
              title="Apagar da biblioteca"
            >
              🗑
            </button>
          </li>
        ))}
      </ul>

      <div style={{ marginTop: 8 }}>
        <input
          placeholder="Nome (opcional)"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          style={{ width: "100%", marginBottom: 6 }}
        />
        <input
          ref={inputArquivo}
          type="file"
          accept="audio/*,.mp3,.ogg,.wav,.m4a,.flac,.webm"
          disabled={enviando}
          onChange={(e) => aoEscolher(e.target.files?.[0])}
          style={{ width: "100%" }}
        />
        <div style={{ opacity: 0.7, marginTop: 4 }}>MP3, OGG, WAV, M4A, FLAC ou WebM, até 40 MB.</div>
        {enviando && <div style={{ marginTop: 6 }}>Enviando...</div>}
        {mensagem && <div style={{ marginTop: 6 }}>{mensagem}</div>}
        {erro && <div style={{ marginTop: 6, color: "#ff8080" }}>{erro}</div>}
      </div>
    </details>
  )
}
