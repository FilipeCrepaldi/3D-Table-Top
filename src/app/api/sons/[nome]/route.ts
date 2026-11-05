import { open, stat } from "node:fs/promises"
import path from "node:path"
import { PASTA_AUDIOS } from "@/server/banco"

// Entrega os sons. Só aceita nomes no formato <uuid>.<extensão>, o que impede pedir
// arquivos de fora da pasta. Aceita "Range" (pedir só um pedaço do arquivo): o navegador
// usa isso para tocar sons longos sem baixar tudo e para repetir/avançar sem travar.
const NOME_VALIDO = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(mp3|ogg|wav|flac|m4a|webm)$/

const TIPOS: Record<string, string> = {
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  wav: "audio/wav",
  flac: "audio/flac",
  m4a: "audio/mp4",
  webm: "audio/webm",
}

export async function GET(request: Request, { params }: { params: Promise<{ nome: string }> }) {
  const { nome } = await params
  if (!NOME_VALIDO.test(nome)) return new Response("Não encontrado", { status: 404 })

  const caminho = path.join(PASTA_AUDIOS, nome)
  let tamanho: number
  try {
    tamanho = (await stat(caminho)).size
  } catch {
    return new Response("Não encontrado", { status: 404 })
  }

  const cabecalhos: Record<string, string> = {
    "Content-Type": TIPOS[nome.split(".").pop()!],
    "Accept-Ranges": "bytes",
    // o arquivo nunca muda (o nome é um id único)
    "Cache-Control": "public, max-age=31536000, immutable",
  }

  // Intervalo pedido: "bytes=inicio-fim" (o fim é opcional)
  const intervalo = /^bytes=(\d*)-(\d*)$/.exec(request.headers.get("range") ?? "")
  let inicio = 0
  let fim = tamanho - 1
  let parcial = false
  if (intervalo && (intervalo[1] !== "" || intervalo[2] !== "")) {
    if (intervalo[1] === "") {
      // "bytes=-N": os últimos N bytes
      inicio = Math.max(0, tamanho - Number(intervalo[2]))
    } else {
      inicio = Number(intervalo[1])
      if (intervalo[2] !== "") fim = Math.min(fim, Number(intervalo[2]))
    }
    if (inicio > fim || inicio >= tamanho) {
      return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${tamanho}` } })
    }
    parcial = true
  }

  const comprimento = fim - inicio + 1
  const arquivo = await open(caminho)
  try {
    const buffer = Buffer.alloc(comprimento)
    await arquivo.read(buffer, 0, comprimento, inicio)
    return new Response(new Uint8Array(buffer), {
      status: parcial ? 206 : 200,
      headers: {
        ...cabecalhos,
        "Content-Length": String(comprimento),
        ...(parcial ? { "Content-Range": `bytes ${inicio}-${fim}/${tamanho}` } : {}),
      },
    })
  } finally {
    await arquivo.close()
  }
}
