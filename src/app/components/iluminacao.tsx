"use client"

import { useCena } from "@/lib/store"
import { CampoNumero, CamposVec3 } from "./campos"

const DESTAQUE = "2px solid #ffd400"

export default function Iluminacao() {
  const luz = useCena((s) => s.luz)
  const selecionadaId = useCena((s) => s.luzSelecionadaId)
  const { atualizarLuz, adicionarLuzPontual, atualizarLuzPontual, removerLuzPontual, selecionarLuz } =
    useCena.getState()

  return (
    // abre sozinho quando você clica numa luz na cena
    <details open={selecionadaId ? true : undefined}>
      <summary>
        <strong>Iluminação</strong>
      </summary>

      <div style={{ opacity: 0.7, margin: "6px 0" }}>
        Clique na bolinha da luz na cena e arraste as setas para escolher de onde ela vem.
      </div>

      <div style={{ margin: "8px 0" }}>
        <div style={{ opacity: 0.7 }}>Luz ambiente</div>
        <label>
          Cor{" "}
          <input
            type="color"
            value={luz.ambienteCor}
            onChange={(e) => atualizarLuz({ ambienteCor: e.target.value })}
          />
        </label>
        <CampoNumero
          rotulo="Intensidade"
          valor={luz.ambienteIntensidade}
          passo={0.1}
          minimo={0}
          aoMudar={(n) => atualizarLuz({ ambienteIntensidade: n })}
        />
      </div>

      <fieldset style={{ margin: "8px 0", padding: 6, border: selecionadaId === "sol" ? DESTAQUE : undefined }}>
        <legend>☀ Sol (direcional)</legend>
        <button onClick={() => selecionarLuz("sol")}>Selecionar na cena</button>
        <CampoNumero
          rotulo="Intensidade"
          valor={luz.solIntensidade}
          passo={0.1}
          minimo={0}
          aoMudar={(n) => atualizarLuz({ solIntensidade: n })}
        />
        <CamposVec3
          titulo="Posição (a luz aponta para o centro)"
          valor={luz.solPosicao}
          passo={1}
          aoMudar={(solPosicao) => atualizarLuz({ solPosicao })}
        />
      </fieldset>

      <div style={{ opacity: 0.7 }}>Luzes pontuais ({luz.pontuais.length})</div>
      {luz.pontuais.map((l) => (
        <fieldset
          key={l.id}
          style={{ margin: "6px 0", padding: 6, border: l.id === selecionadaId ? DESTAQUE : undefined }}
        >
          <legend>💡 {l.nome}</legend>
          <button onClick={() => selecionarLuz(l.id)}>Selecionar na cena</button>
          <CamposVec3
            titulo="Posição"
            valor={l.posicao}
            passo={0.5}
            aoMudar={(posicao) => atualizarLuzPontual(l.id, { posicao })}
          />
          <label>
            Cor{" "}
            <input
              type="color"
              value={l.cor}
              onChange={(e) => atualizarLuzPontual(l.id, { cor: e.target.value })}
            />
          </label>
          <CampoNumero
            rotulo="Intensidade"
            valor={l.intensidade}
            passo={1}
            minimo={0}
            aoMudar={(n) => atualizarLuzPontual(l.id, { intensidade: n })}
          />
          <CampoNumero
            rotulo="Alcance (0 = ilimitado)"
            valor={l.alcance}
            passo={1}
            minimo={0}
            aoMudar={(n) => atualizarLuzPontual(l.id, { alcance: n })}
          />
          <button onClick={() => removerLuzPontual(l.id)}>Remover</button>
        </fieldset>
      ))}
      <button onClick={adicionarLuzPontual}>Adicionar luz pontual</button>
    </details>
  )
}
