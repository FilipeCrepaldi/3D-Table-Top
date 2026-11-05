import { readFile } from "node:fs/promises"
import path from "node:path"
import { PASTA_ARTES } from "@/server/banco"

// Entrega as imagens das artes. Só aceita nomes no formato <uuid>.png, o que impede
// pedir arquivos de fora da pasta.
const NOME_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.png$/

export async function GET(_request: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params
  if (!NOME_VALIDO.test(nome)) return new Response("Não encontrado", { status: 404 })

  try {
    const conteudo = await readFile(path.join(PASTA_ARTES, nome))
    return new Response(new Uint8Array(conteudo), {
      headers: {
        "Content-Type": "image/png",
        // o arquivo nunca muda (o nome é um id único)
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Não encontrado", { status: 404 })
  }
}
