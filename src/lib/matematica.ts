import { Euler, Matrix4, Quaternion, Vector3 } from "three"
import type { Vec3 } from "./tipos"

// Contas de transformação (posição, rotação, escala) usadas ao agrupar e desagrupar.

export type Transformacao = { posicao: Vec3; rotacao: Vec3; escala: Vec3 }

function paraMatriz(t: Transformacao): Matrix4 {
  return new Matrix4().compose(
    new Vector3(...t.posicao),
    new Quaternion().setFromEuler(new Euler(...t.rotacao)),
    new Vector3(...t.escala),
  )
}

/** Transformação de um filho no mundo, dada a transformação do grupo e a dele dentro do grupo. */
export function aplicarGrupo(grupo: Transformacao, filho: Transformacao): Transformacao {
  const m = paraMatriz(grupo).multiply(paraMatriz(filho))
  const posicao = new Vector3()
  const quaternion = new Quaternion()
  const escala = new Vector3()
  m.decompose(posicao, quaternion, escala)
  const euler = new Euler().setFromQuaternion(quaternion)
  return {
    posicao: [posicao.x, posicao.y, posicao.z],
    rotacao: [euler.x, euler.y, euler.z],
    escala: [escala.x, escala.y, escala.z],
  }
}
