import { unlink } from "node:fs/promises"
import path from "node:path"
import { banco, paraArte, PASTA_ARTES, type LinhaArte } from "@/server/banco"

// Muda o nome e/ou a descrição de uma arte
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const corpo = (await request.json().catch(() => null)) as { nome?: unknown; descricao?: unknown } | null
  if (!corpo) return Response.json({ erro: "JSON inválido." }, { status: 400 })

  const atual = banco().prepare("SELECT * FROM artes WHERE id = ?").get(id) as LinhaArte | undefined
  if (!atual) return Response.json({ erro: "Arte não encontrada." }, { status: 404 })

  const nome = typeof corpo.nome === "string" && corpo.nome.trim() ? corpo.nome.trim().slice(0, 120) : atual.nome
  const descricao = typeof corpo.descricao === "string" ? corpo.descricao.slice(0, 2000) : atual.descricao
  banco().prepare("UPDATE artes SET nome = ?, descricao = ? WHERE id = ?").run(nome, descricao, id)

  return Response.json(paraArte({ ...atual, nome, descricao }))
}

// Apaga a arte e o arquivo dela
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const atual = banco().prepare("SELECT * FROM artes WHERE id = ?").get(id) as LinhaArte | undefined
  if (atual) {
    banco().prepare("DELETE FROM artes WHERE id = ?").run(id)
    await unlink(path.join(PASTA_ARTES, atual.arquivo)).catch(() => {}) // o registro já saiu; o arquivo é só limpeza
  }
  return Response.json({ ok: true })
}
