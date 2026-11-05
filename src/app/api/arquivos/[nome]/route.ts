import { readFile } from "node:fs/promises"
import path from "node:path"
import { PASTA_IMPORTADOS } from "@/server/banco"

// Entrega os GLB importados. Só aceita nomes no formato <uuid>.glb, o que impede
// pedir arquivos de fora da pasta (ex.: ../../alguma-coisa).
const NOME_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.glb$/

export async function GET(_request: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params
  if (!NOME_VALIDO.test(nome)) return new Response("Não encontrado", { status: 404 })

  try {
    const conteudo = await readFile(path.join(PASTA_IMPORTADOS, nome))
    return new Response(new Uint8Array(conteudo), {
      headers: {
        "Content-Type": "model/gltf-binary",
        // o arquivo nunca muda (o nome é um id único), então o navegador pode guardar
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch {
    return new Response("Não encontrado", { status: 404 })
  }
}
