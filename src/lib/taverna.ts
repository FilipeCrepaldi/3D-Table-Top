import { novaLuzPontual } from "./luz"
import type { LuzPontual, ObjetoCena, Vec3 } from "./tipos"

// Cena inicial: uma taverna montada só com os assets do projeto.
//
// Medidas: o piso é uma grade de peças 2x2, 5 peças em x e 4 em z (10 x 8).
// Cada parede tem 2 de largura e 3,12 de altura. O lado "de fora" da parede
// é o +z local, então as paredes são giradas para esse lado olhar para fora.
// Não há mesas nem cadeiras nos pacotes, então caixotes escalados fazem esse papel.

const M = "medieval/"
const S = "scifi/"

const PI = Math.PI

type Opcoes = {
  rotY?: number
  escala?: Vec3
}

function peca(assetId: string, nome: string, x: number, y: number, z: number, o: Opcoes = {}): ObjetoCena {
  return {
    id: crypto.randomUUID(),
    nome,
    assetId,
    posicao: [x, y, z],
    rotacao: [0, o.rotY ?? 0, 0],
    escala: o.escala ?? [1, 1, 1],
  }
}

/** Duas luzes quentes: uma sobre o bar e outra no centro do salão. */
export function luzesDaTaverna(): LuzPontual[] {
  return [
    novaLuzPontual([3, 2.4, -2.6], "Luz do bar"),
    novaLuzPontual([-2, 2.6, 0], "Luz do salão"),
  ]
}

export function taverna(): ObjetoCena[] {
  const objetos: ObjetoCena[] = []
  const add = (o: ObjetoCena) => objetos.push(o)

  // --- Piso (a área do balcão usa madeira clara) ---
  for (const x of [-4, -2, 0, 2, 4]) {
    for (const z of [-3, -1, 1, 3]) {
      const balcao = x >= 2 && z === -3
      add(peca(`${M}${balcao ? "Floor_WoodLight" : "Floor_WoodDark"}`, "Piso", x, 0, z))
    }
  }

  // --- Paredes: reta, janela ou porta ---
  const reta = `${M}Wall_Plaster_Straight`
  const janela = `${M}Wall_Plaster_Window_Wide_Round`
  const porta = `${M}Wall_Plaster_Door_Round`

  // Norte (z = -4), olhando para -z
  ;[reta, janela, reta, janela, reta].forEach((id, i) =>
    add(peca(id, "Parede norte", -4 + i * 2, 0, -4, { rotY: PI })),
  )
  // Sul (z = 4), com a porta de entrada no meio
  ;[reta, janela, porta, janela, reta].forEach((id, i) =>
    add(peca(id, id === porta ? "Entrada" : "Parede sul", -4 + i * 2, 0, 4)),
  )
  // Leste (x = 5) e oeste (x = -5)
  ;[reta, janela, janela, reta].forEach((id, i) => {
    add(peca(id, "Parede leste", 5, 0, -3 + i * 2, { rotY: PI / 2 }))
    add(peca(id, "Parede oeste", -5, 0, -3 + i * 2, { rotY: -PI / 2 }))
  })

  // Colunas de canto
  for (const x of [-5, 5]) {
    for (const z of [-4, 4]) add(peca(`${M}Corner_Exterior_Wood`, "Canto", x, 0, z))
  }

  // --- Balcão do bar (um caixote esticado) e barris atrás dele ---
  add(peca(`${M}Prop_Crate`, "Balcão", 3.1, 0, -1.9, { escala: [3.2, 0.95, 0.8] }))
  for (let i = 0; i < 5; i++) {
    add(peca(`${S}Prop_Barrel_Large`, "Barril", 1.3 + i * 0.85, 0, -3.5, { escala: [1.3, 1.3, 1.3] }))
  }
  add(peca(`${M}Prop_Crate`, "Caixote", 4.4, 0, -3.1, { rotY: 0.3, escala: [0.8, 0.8, 0.8] }))

  // --- Mesas (caixotes achatados) com bancos (caixotes pequenos) ---
  const mesas: { x: number; z: number; rot: number }[] = [
    { x: -3, z: -1.8, rot: 0.05 },
    { x: -3, z: 1.5, rot: -0.08 },
    { x: 2.6, z: 1.6, rot: 0.1 },
  ]
  for (const m of mesas) {
    add(peca(`${M}Prop_Crate`, "Mesa", m.x, 0, m.z, { rotY: m.rot, escala: [1.8, 0.7, 1.1] }))
    for (const dx of [-0.5, 0.5]) {
      for (const dz of [-1, 1]) {
        // gira o deslocamento junto com a mesa para os bancos acompanharem
        const x = m.x + dx * Math.cos(m.rot) + dz * Math.sin(m.rot)
        const z = m.z - dx * Math.sin(m.rot) + dz * Math.cos(m.rot)
        add(peca(`${M}Prop_Crate`, "Banco", x, 0, z, { escala: [0.42, 0.42, 0.42] }))
      }
    }
  }

  // --- Detalhes ---
  add(peca(`${S}Prop_Chest`, "Baú", -4.2, 0, 3.2, { rotY: PI / 2 + 0.1 }))
  add(peca(`${S}Prop_Light_Floor`, "Luminária de chão", 0, 0, -3.7))

  // --- Lado de fora ---
  add(peca(`${M}Prop_Chimney`, "Chaminé", -3, 0, -4.5))
  add(peca(`${M}Prop_Wagon`, "Carroça", -7, 0, 1, { rotY: 0.15 }))

  return objetos
}
