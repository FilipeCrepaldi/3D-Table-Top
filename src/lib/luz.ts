import type { ConfigLuz, LuzPontual, Vec3 } from "./tipos"

/** Iluminação padrão, sem luzes pontuais. */
export function luzBase(): ConfigLuz {
  return {
    ambienteCor: "#ffffff",
    ambienteIntensidade: 0.5,
    solIntensidade: 1.2,
    solPosicao: [5, 10, 5],
    pontuais: [],
  }
}

export function novaLuzPontual(posicao: Vec3 = [0, 2.5, 0], nome = "Luz pontual"): LuzPontual {
  return {
    id: crypto.randomUUID(),
    nome,
    posicao,
    cor: "#ffb060", // laranja quente
    intensidade: 15,
    alcance: 0,
  }
}
