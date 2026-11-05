import { banco } from "@/server/banco"

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  banco().prepare("DELETE FROM cenas WHERE id = ?").run(id)
  return Response.json({ ok: true })
}
