import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { banco, paraArte, PASTA_ARTES, type LinhaArte } from "@/server/banco"

export const dynamic = "force-dynamic"

const TAMANHO_MAXIMO = 10 * 1024 * 1024 // 10 MB
const LIMITE_LADO = 8192

const erro = (mensagem: string, status = 400) => Response.json({ erro: mensagem }, { status })

// Lista as artes
export async function GET() {
  const linhas = banco().prepare("SELECT * FROM artes ORDER BY nome").all()
  return Response.json(linhas.map((l) => paraArte(l as LinhaArte)))
}

// Importa uma arte. O aplicativo sempre envia PNG (converte e recorta antes), então
// o servidor só aceita PNG e lê as dimensões do próprio cabeçalho do arquivo.
export async function POST(request: Request) {
  const form = await request.formData()
  const arquivo = form.get("arquivo")
  if (!(arquivo instanceof File)) return erro("Nenhum arquivo enviado.")
  if (arquivo.size > TAMANHO_MAXIMO) return erro("Imagem maior que 10 MB.")

  const bytes = Buffer.from(await arquivo.arrayBuffer())
  const assinaturaPng = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  if (bytes.length < 33 || !bytes.subarray(0, 8).equals(assinaturaPng) || bytes.toString("ascii", 12, 16) !== "IHDR") {
    return erro("O arquivo não é um PNG válido.")
  }
  const largura = bytes.readUInt32BE(16)
  const altura = bytes.readUInt32BE(20)
  if (largura < 1 || altura < 1 || largura > LIMITE_LADO || altura > LIMITE_LADO) {
    return erro("Dimensões da imagem fora do limite.")
  }

  const texto = (campo: string, padrao: string, max: number) => {
    const valor = form.get(campo)
    return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, max) : padrao
  }

  const id = randomUUID()
  const nomeArquivo = `${id}.png` // o nome vem de nós, nunca do usuário
  await writeFile(path.join(PASTA_ARTES, nomeArquivo), bytes)

  const linha: LinhaArte = {
    id,
    nome: texto("nome", "Personagem", 120),
    descricao: texto("descricao", "", 2000),
    arquivo: nomeArquivo,
    largura,
    altura,
  }
  banco()
    .prepare("INSERT INTO artes (id, nome, descricao, arquivo, largura, altura) VALUES (?, ?, ?, ?, ?, ?)")
    .run(linha.id, linha.nome, linha.descricao, linha.arquivo, linha.largura, linha.altura)

  return Response.json(paraArte(linha), { status: 201 })
}
