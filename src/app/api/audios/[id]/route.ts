import { unlink } from "node:fs/promises"
import path from "node:path"
import { banco, PASTA_AUDIOS, type LinhaAudio } from "@/server/banco"

// Apaga o som e o arquivo dele
export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const atual = banco().prepare("SELECT * FROM audios WHERE id = ?").get(id) as LinhaAudio | undefined
  if (atual) {
    banco().prepare("DELETE FROM audios WHERE id = ?").run(id)
    await unlink(path.join(PASTA_AUDIOS, atual.arquivo)).catch(() => {}) // o registro já saiu; o arquivo é só limpeza
  }
  return Response.json({ ok: true })
}
