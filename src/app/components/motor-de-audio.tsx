"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAudios } from "@/lib/audios"
import { useCena } from "@/lib/store"

type Registro = {
  elemento: HTMLAudioElement
  url: string
  /** Intervalo do fade em andamento */
  fade: ReturnType<typeof setInterval> | null
}

const PASSO_FADE = 0.04 // quanto o volume muda a cada 50 ms (cerca de 1 s para ir de 0 a 1)

// Leva o volume do elemento até o alvo, devagar. `aoFim` roda quando chega.
function suavizar(registro: Registro, alvo: number, aoFim?: () => void) {
  if (registro.fade) clearInterval(registro.fade)
  const e = registro.elemento
  registro.fade = setInterval(() => {
    const diferenca = alvo - e.volume
    if (Math.abs(diferenca) <= PASSO_FADE) {
      e.volume = Math.min(1, Math.max(0, alvo))
      if (registro.fade) clearInterval(registro.fade)
      registro.fade = null
      aoFim?.()
    } else {
      e.volume = Math.min(1, Math.max(0, e.volume + Math.sign(diferenca) * PASSO_FADE))
    }
  }, 50)
}

// Toca as trilhas da cena. Não desenha nada (só um aviso quando o navegador bloqueia o som).
// Cada trilha vira um elemento <audio>; ligar e desligar faz fade para não cortar seco.
export default function MotorDeAudio() {
  const trilhas = useCena((s) => s.trilhas)
  const volumeGeral = useCena((s) => s.volumeGeral)
  const audios = useAudios((s) => s.audios)

  const mapa = useMemo(() => new Map(audios.map((a) => [a.id, a])), [audios])
  const registros = useRef(new Map<string, Registro>())

  // O navegador só deixa tocar depois de uma interação (clique ou tecla).
  const [bloqueado, setBloqueado] = useState(false)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    const todos = registros.current
    const vivos = new Set<string>()

    for (const t of trilhas) {
      const audio = mapa.get(t.audioId)
      if (!audio) continue // lista de sons ainda carregando, ou som apagado
      vivos.add(t.id)

      let registro = todos.get(t.id)
      if (!registro || registro.url !== audio.arquivo) {
        registro?.elemento.pause()
        const elemento = new Audio(audio.arquivo)
        elemento.preload = "auto"
        elemento.volume = 0
        // som que não repete e chegou ao fim: marca a trilha como parada
        elemento.onended = () => useCena.getState().atualizarTrilha(t.id, { tocando: false })
        registro = { elemento, url: audio.arquivo, fade: null }
        todos.set(t.id, registro)
      }

      const { elemento } = registro
      elemento.loop = t.repetir
      const alvo = Math.min(1, Math.max(0, t.volume * volumeGeral))

      if (t.tocando) {
        if (elemento.paused) {
          elemento.play().catch(() => setBloqueado(true))
        }
        suavizar(registro, alvo)
      } else if (!elemento.paused) {
        suavizar(registro, 0, () => elemento.pause())
      }
    }

    // trilhas removidas da cena: para e solta o elemento
    for (const [id, registro] of todos) {
      if (!vivos.has(id)) {
        if (registro.fade) clearInterval(registro.fade)
        registro.elemento.pause()
        todos.delete(id)
      }
    }
  }, [trilhas, volumeGeral, mapa, tentativa])

  // Ao bloquear, espera o primeiro clique ou tecla e tenta de novo
  useEffect(() => {
    if (!bloqueado) return
    const liberar = () => {
      setBloqueado(false)
      setTentativa((n) => n + 1)
    }
    window.addEventListener("pointerdown", liberar, { once: true })
    window.addEventListener("keydown", liberar, { once: true })
    return () => {
      window.removeEventListener("pointerdown", liberar)
      window.removeEventListener("keydown", liberar)
    }
  }, [bloqueado])

  // Ao sair da página, para tudo
  useEffect(() => {
    const todos = registros.current
    return () => {
      for (const registro of todos.values()) {
        if (registro.fade) clearInterval(registro.fade)
        registro.elemento.pause()
      }
      todos.clear()
    }
  }, [])

  if (!bloqueado) return null
  return (
    <div className="toast" style={{ pointerEvents: "none" }}>
      🔊 Clique em qualquer lugar para liberar o som
    </div>
  )
}
