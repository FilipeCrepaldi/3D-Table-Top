// Deixa uma pasta de modelos glTF mais leve para computadores sem placa de vídeo dedicada.
//
//   node scripts/otimizar-gltf.mjs <pasta> [--max 1024] [--manter-normal]
//
// Para cada .gltf da pasta:
//  1. remove os mapas de relevo (normal maps), que são pesados e pouco visíveis em modelos
//     de poucos polígonos (use --manter-normal para preservar);
//  2. apaga do arquivo as texturas e imagens que deixaram de ser usadas;
//  3. reduz as imagens que sobraram para, no máximo, --max pixels no maior lado.
// Os arquivos da pasta são alterados no lugar: rode em uma CÓPIA dos originais.
import { readdirSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs"
import { extname, join } from "node:path"
import sharp from "sharp"

const args = process.argv.slice(2)
const pasta = args.find((a) => !a.startsWith("--"))
const indiceMax = args.indexOf("--max")
const maximo = indiceMax >= 0 ? Number(args[indiceMax + 1]) : 1024
const manterNormal = args.includes("--manter-normal")

if (!pasta) {
  console.error("Uso: node scripts/otimizar-gltf.mjs <pasta> [--max 1024] [--manter-normal]")
  process.exit(1)
}

const arquivos = readdirSync(pasta).filter((f) => f.endsWith(".gltf"))
const imagensUsadas = new Set()
const antes = tamanhoDaPasta(pasta)

for (const nome of arquivos) {
  const caminho = join(pasta, nome)
  const gltf = JSON.parse(readFileSync(caminho, "utf8"))

  // 1) tira os mapas de relevo
  if (!manterNormal) {
    for (const material of gltf.materials ?? []) delete material.normalTexture
  }

  // 2) descobre quais texturas ainda são usadas e remapeia os índices
  const texturas = gltf.textures ?? []
  const usadas = new Set()
  const marcar = (info) => info && typeof info.index === "number" && usadas.add(info.index)
  for (const m of gltf.materials ?? []) {
    marcar(m.normalTexture)
    marcar(m.occlusionTexture)
    marcar(m.emissiveTexture)
    marcar(m.pbrMetallicRoughness?.baseColorTexture)
    marcar(m.pbrMetallicRoughness?.metallicRoughnessTexture)
  }
  const novoIndiceTextura = new Map()
  const novasTexturas = []
  for (const [i, t] of texturas.entries()) {
    if (usadas.has(i)) {
      novoIndiceTextura.set(i, novasTexturas.length)
      novasTexturas.push(t)
    }
  }

  // imagens ainda usadas pelas texturas que ficaram
  const imagens = gltf.images ?? []
  const novoIndiceImagem = new Map()
  const novasImagens = []
  for (const t of novasTexturas) {
    if (typeof t.source !== "number") continue
    if (!novoIndiceImagem.has(t.source)) {
      novoIndiceImagem.set(t.source, novasImagens.length)
      novasImagens.push(imagens[t.source])
    }
    t.source = novoIndiceImagem.get(t.source)
  }
  for (const img of novasImagens) if (img.uri) imagensUsadas.add(img.uri)

  const remapear = (info) => info && typeof info.index === "number" && (info.index = novoIndiceTextura.get(info.index))
  for (const m of gltf.materials ?? []) {
    remapear(m.normalTexture)
    remapear(m.occlusionTexture)
    remapear(m.emissiveTexture)
    remapear(m.pbrMetallicRoughness?.baseColorTexture)
    remapear(m.pbrMetallicRoughness?.metallicRoughnessTexture)
  }
  if (texturas.length) gltf.textures = novasTexturas
  if (imagens.length) gltf.images = novasImagens
  if (!gltf.textures?.length) delete gltf.textures
  if (!gltf.images?.length) delete gltf.images
  if (!gltf.textures?.length) delete gltf.samplers

  writeFileSync(caminho, JSON.stringify(gltf))
}

// 3) apaga as imagens que ninguém usa mais e reduz as que ficaram
for (const nome of readdirSync(pasta)) {
  const extensao = extname(nome).toLowerCase()
  if (![".png", ".jpg", ".jpeg"].includes(extensao)) continue
  const caminho = join(pasta, nome)

  if (!imagensUsadas.has(nome)) {
    unlinkSync(caminho)
    console.log(`  removida (sem uso): ${nome}`)
    continue
  }

  // lê para a memória antes: no Windows o sharp mantém o arquivo aberto e impediria a gravação
  const imagem = sharp(readFileSync(caminho))
  const { width = 0, height = 0 } = await imagem.metadata()
  if (Math.max(width, height) <= maximo) continue
  const reduzida = imagem.resize({ width: maximo, height: maximo, fit: "inside" })
  const buffer = extensao === ".png" ? await reduzida.png({ compressionLevel: 9 }).toBuffer() : await reduzida.jpeg({ quality: 88 }).toBuffer()
  writeFileSync(caminho, buffer)
  console.log(`  reduzida: ${nome} (${width}x${height} -> máx ${maximo})`)
}

const depois = tamanhoDaPasta(pasta)
console.log(`${arquivos.length} modelos. ${(antes / 1e6).toFixed(1)} MB -> ${(depois / 1e6).toFixed(1)} MB`)

function tamanhoDaPasta(dir) {
  return readdirSync(dir).reduce((soma, f) => soma + statSync(join(dir, f)).size, 0)
}
