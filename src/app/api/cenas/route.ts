import { validarCena } from "@/lib/validacao"
import type { CenaSalva } from "@/lib/tipos"
import { banco } from "@/server/banco"

export const dynamic = "force-dynamic"

// Lista as cenas salvas, da mais recente para a mais antiga
export async function GET() {
  const linhas = banco().prepare("SELECT dados FROM cenas ORDER BY salvo_em DESC").all() as {
    dados: string
  }[]
  return Response.json(linhas.map((l) => JSON.parse(l.dados) as CenaSalva))
}

// Salva uma cena. Se já existe outra com o mesmo nome, ela é substituída.
export async function POST(request: Request) {
  let corpo: unknown
  try {
    corpo = await request.json()
  } catch {
    return Response.json({ erro: "JSON inválido." }, { status: 400 })
  }

  const cena = validarCena(corpo)
  if (typeof cena === "string") return Response.json({ erro: cena }, { status: 400 })

  banco()
    .prepare(
      `INSERT INTO cenas (id, nome, salvo_em, dados) VALUES (?, ?, ?, ?)
       ON CONFLICT(nome) DO UPDATE SET id = excluded.id, salvo_em = excluded.salvo_em, dados = excluded.dados`,
    )
    .run(cena.id, cena.nome, cena.salvoEm, JSON.stringify(cena))

  return Response.json(cena, { status: 201 })
}
