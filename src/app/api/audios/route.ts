import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { banco, paraAudio, PASTA_AUDIOS, type LinhaAudio } from "@/server/banco"

export const dynamic = "force-dynamic"

const TAMANHO_MAXIMO = 40 * 1024 * 1024 // 40 MB

const erro = (mensagem: string, status = 400) => Response.json({ erro: mensagem }, { status })

// Descobre o formato pelo começo do arquivo (não confia na extensão que veio do usuário).
// Devolve a extensão que usaremos ao guardar, ou null se não for um áudio conhecido.
function detectarFormato(b: Buffer): string | null {
  if (b.length < 12) return null
  if (b.toString("ascii", 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) return "mp3"
  if (b.toString("ascii", 0, 4) === "OggS") return "ogg"
  if (b.toString("ascii", 0, 4) === "RIFF" && b.toString("ascii", 8, 12) === "WAVE") return "wav"
  if (b.toString("ascii", 0, 4) === "fLaC") return "flac"
  if (b.toString("ascii", 4, 8) === "ftyp") return "m4a"
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) return "webm"
  return null
}

// Lista os sons
export async function GET() {
  const linhas = banco().prepare("SELECT * FROM audios ORDER BY nome").all()
  return Response.json(linhas.map((l) => paraAudio(l as LinhaAudio)))
}

// Importa um som
export async function POST(request: Request) {
  const form = await request.formData()
  const arquivo = form.get("arquivo")
  if (!(arquivo instanceof File)) return erro("Nenhum arquivo enviado.")
  if (arquivo.size > TAMANHO_MAXIMO) return erro("Arquivo maior que 40 MB.")

  const bytes = Buffer.from(await arquivo.arrayBuffer())
  const extensao = detectarFormato(bytes)
  if (!extensao) return erro("Formato não suportado. Use MP3, OGG, WAV, M4A, FLAC ou WebM.")

  const nomeInformado = form.get("nome")
  const nome =
    typeof nomeInformado === "string" && nomeInformado.trim()
      ? nomeInformado.trim().slice(0, 120)
      : arquivo.name.replace(/\.[^.]+$/, "").slice(0, 120) || "Som"

  const id = randomUUID()
  const nomeArquivo = `${id}.${extensao}` // o nome vem de nós, nunca do usuário
  await writeFile(path.join(PASTA_AUDIOS, nomeArquivo), bytes)

  const linha: LinhaAudio = { id, nome, arquivo: nomeArquivo }
  banco().prepare("INSERT INTO audios (id, nome, arquivo) VALUES (?, ?, ?)").run(linha.id, linha.nome, linha.arquivo)

  return Response.json(paraAudio(linha), { status: 201 })
}
