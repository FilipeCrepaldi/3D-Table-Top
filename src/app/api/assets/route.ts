import { randomUUID } from "node:crypto"
import { writeFile } from "node:fs/promises"
import path from "node:path"
import { banco, paraAsset, PASTA_IMPORTADOS } from "@/server/banco"

export const dynamic = "force-dynamic" // sempre lê o banco, nunca usa cópia em cache

const TAMANHO_MAXIMO = 50 * 1024 * 1024 // 50 MB

const erro = (mensagem: string, status = 400) => Response.json({ erro: mensagem }, { status })

// Lista todos os assets (os do projeto e os importados)
export async function GET() {
  const linhas = banco().prepare("SELECT * FROM assets ORDER BY estilo, tipo, nome").all()
  return Response.json(linhas.map((l) => paraAsset(l as Parameters<typeof paraAsset>[0])))
}

// Importa um GLB: valida, guarda o arquivo em data/importados e registra no banco
export async function POST(request: Request) {
  const form = await request.formData()
  const arquivo = form.get("arquivo")
  if (!(arquivo instanceof File)) return erro("Nenhum arquivo enviado.")

  if (!arquivo.name.toLowerCase().endsWith(".glb")) return erro("O arquivo precisa ser .glb.")
  if (arquivo.size > TAMANHO_MAXIMO) return erro("Arquivo maior que 50 MB.")
  if (arquivo.size < 20) return erro("Arquivo vazio ou corrompido.")

  // GLB começa com "glTF" (0x46546C67) e versão 2
  const bytes = Buffer.from(await arquivo.arrayBuffer())
  if (bytes.readUInt32LE(0) !== 0x46546c67) return erro("Não é um GLB válido (cabeçalho incorreto).")
  if (bytes.readUInt32LE(4) !== 2) return erro(`Versão de glTF não suportada (${bytes.readUInt32LE(4)}).`)

  const texto = (campo: string, padrao: string) => {
    const valor = form.get(campo)
    return typeof valor === "string" && valor.trim() ? valor.trim().slice(0, 120) : padrao
  }

  const uuid = randomUUID()
  const nomeArquivo = `${uuid}.glb` // o nome vem de nós, nunca do usuário
  await writeFile(path.join(PASTA_IMPORTADOS, nomeArquivo), bytes)

  const nome = arquivo.name.replace(/\.glb$/i, "").replace(/_/g, " ").slice(0, 120)
  const asset = {
    id: `local/${uuid}`,
    nome,
    nomeOriginal: nome,
    tipo: texto("tipo", "Outros"),
    estilo: texto("estilo", "Importado"),
    arquivo: `/api/arquivos/${nomeArquivo}`,
    pacote: "Importados",
    autor: texto("autor", "Desconhecido"),
    origem: "Importado pelo usuário",
    licenca: texto("licenca", "Não informada"),
    local: true,
  }

  banco()
    .prepare(
      `INSERT INTO assets (id, nome, nome_original, tipo, estilo, arquivo, pacote, autor, origem, licenca, local)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
    )
    .run(asset.id, asset.nome, asset.nomeOriginal, asset.tipo, asset.estilo, asset.arquivo, asset.pacote, asset.autor, asset.origem, asset.licenca)

  return Response.json(asset, { status: 201 })
}
