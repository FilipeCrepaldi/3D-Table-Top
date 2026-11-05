// Converte modelos .obj (com .mtl de cores simples) em .glb, sem precisar do Blender.
//
//   node scripts/obj-para-glb.mjs <pasta com .obj e .mtl> <pasta de saída>
//
// Serve para packs que só vêm em FBX/OBJ, como o "Ultimate Nature Pack" do Quaternius.
// Limitações: só cores sólidas (Kd e d do .mtl), sem texturas; polígonos viram triângulos.
// A cor do Kd é copiada como está: nesses packs ela já está em espaço linear, o mesmo
// valor que o glTF oficial do Quaternius usa em baseColorFactor.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs"
import { basename, join } from "node:path"

const [entrada, saida] = process.argv.slice(2)
if (!entrada || !saida) {
  console.error("Uso: node scripts/obj-para-glb.mjs <pasta com .obj e .mtl> <pasta de saída>")
  process.exit(1)
}
mkdirSync(saida, { recursive: true })

// ---------- .mtl: nome do material -> { cor, alfa } ----------
function lerMtl(caminho) {
  const materiais = new Map()
  let atual = null
  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const [chave, ...resto] = linha.trim().split(/\s+/)
    if (chave === "newmtl") {
      atual = { cor: [0.8, 0.8, 0.8], alfa: 1 }
      materiais.set(resto.join(" "), atual)
    } else if (atual && chave === "Kd") atual.cor = resto.slice(0, 3).map(Number)
    else if (atual && chave === "d") atual.alfa = Number(resto[0])
  }
  return materiais
}

// ---------- .obj: posições, normais e faces agrupadas por material ----------
function lerObj(caminho) {
  const posicoes = []
  const normais = []
  const faces = new Map() // material -> lista de faces; cada face é uma lista de [iPos, iNormal]
  let mtlarq = null
  let material = "default"

  for (const linha of readFileSync(caminho, "utf8").split(/\r?\n/)) {
    const partes = linha.trim().split(/\s+/)
    const chave = partes[0]
    if (chave === "v") posicoes.push(partes.slice(1, 4).map(Number))
    else if (chave === "vn") normais.push(partes.slice(1, 4).map(Number))
    else if (chave === "mtllib") mtlarq = partes.slice(1).join(" ")
    else if (chave === "usemtl") material = partes.slice(1).join(" ")
    else if (chave === "f") {
      const vertices = partes.slice(1).map((token) => {
        const [v, , n] = token.split("/")
        // índices negativos contam a partir do fim da lista
        const iv = Number(v) < 0 ? posicoes.length + Number(v) : Number(v) - 1
        const inn = n ? (Number(n) < 0 ? normais.length + Number(n) : Number(n) - 1) : -1
        return [iv, inn]
      })
      if (!faces.has(material)) faces.set(material, [])
      faces.get(material).push(vertices)
    }
  }
  return { posicoes, normais, faces, mtlarq }
}

// Normal de um triângulo, para quando o .obj não traz normais
function normalDaFace(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]
  const v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]]
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]
  const t = Math.hypot(...n) || 1
  return [n[0] / t, n[1] / t, n[2] / t]
}

function converter(caminhoObj, caminhoGlb, nomeModelo) {
  const { posicoes, normais, faces, mtlarq } = lerObj(caminhoObj)
  const materiaisMtl = mtlarq ? lerMtl(join(entrada, mtlarq)) : new Map()

  const bufferViews = []
  const accessors = []
  const materiais = []
  const primitivas = []
  const pedacos = [] // blocos binários, na ordem
  let deslocamento = 0

  const adicionarBloco = (typedArray, alvo) => {
    const bytes = Buffer.from(typedArray.buffer, typedArray.byteOffset, typedArray.byteLength)
    const preenchimento = (4 - (bytes.length % 4)) % 4
    pedacos.push(bytes, Buffer.alloc(preenchimento))
    bufferViews.push({ buffer: 0, byteOffset: deslocamento, byteLength: bytes.length, target: alvo })
    deslocamento += bytes.length + preenchimento
    return bufferViews.length - 1
  }

  let triangulosTotais = 0
  const minimo = [Infinity, Infinity, Infinity]
  const maximo = [-Infinity, -Infinity, -Infinity]

  for (const [nomeMaterial, listaFaces] of faces) {
    const dedup = new Map()
    const pos = []
    const nor = []
    const indices = []

    const vertice = (iv, inn, normalDaFaceAtual) => {
      const chave = inn >= 0 ? `${iv}/${inn}` : `${iv}/f${normalDaFaceAtual.join(",")}`
      let indice = dedup.get(chave)
      if (indice === undefined) {
        indice = pos.length / 3
        dedup.set(chave, indice)
        pos.push(...posicoes[iv])
        nor.push(...(inn >= 0 ? normais[inn] : normalDaFaceAtual))
      }
      return indice
    }

    for (const face of listaFaces) {
      if (face.length < 3) continue
      const normalFace = normalDaFace(posicoes[face[0][0]], posicoes[face[1][0]], posicoes[face[2][0]])
      // leque: (0,1,2), (0,2,3), (0,3,4)... mantém a ordem dos vértices (e o lado da frente)
      for (let i = 1; i < face.length - 1; i++) {
        for (const [iv, inn] of [face[0], face[i], face[i + 1]]) indices.push(vertice(iv, inn, normalFace))
        triangulosTotais++
      }
    }
    if (indices.length === 0) continue

    const posArray = new Float32Array(pos)
    const norArray = new Float32Array(nor)
    const indArray = pos.length / 3 > 65535 ? new Uint32Array(indices) : new Uint16Array(indices)

    const min = [Infinity, Infinity, Infinity]
    const max = [-Infinity, -Infinity, -Infinity]
    for (let i = 0; i < posArray.length; i += 3) {
      for (let k = 0; k < 3; k++) {
        min[k] = Math.min(min[k], posArray[i + k])
        max[k] = Math.max(max[k], posArray[i + k])
        minimo[k] = Math.min(minimo[k], posArray[i + k])
        maximo[k] = Math.max(maximo[k], posArray[i + k])
      }
    }

    const vPos = adicionarBloco(posArray, 34962)
    const vNor = adicionarBloco(norArray, 34962)
    const vInd = adicionarBloco(indArray, 34963)
    accessors.push({ bufferView: vPos, componentType: 5126, count: posArray.length / 3, type: "VEC3", min, max })
    const aPos = accessors.length - 1
    accessors.push({ bufferView: vNor, componentType: 5126, count: norArray.length / 3, type: "VEC3" })
    const aNor = accessors.length - 1
    accessors.push({
      bufferView: vInd,
      componentType: indArray instanceof Uint32Array ? 5125 : 5123,
      count: indArray.length,
      type: "SCALAR",
    })
    const aInd = accessors.length - 1

    const dados = materiaisMtl.get(nomeMaterial) ?? { cor: [0.8, 0.8, 0.8], alfa: 1 }
    const material = {
      name: nomeMaterial,
      pbrMetallicRoughness: { baseColorFactor: [...dados.cor, dados.alfa], metallicFactor: 0, roughnessFactor: 0.5 },
      doubleSided: true,
    }
    if (dados.alfa < 1) material.alphaMode = "BLEND"
    materiais.push(material)

    primitivas.push({ attributes: { POSITION: aPos, NORMAL: aNor }, indices: aInd, material: materiais.length - 1 })
  }

  const json = {
    asset: { version: "2.0", generator: "tabletop3d obj-para-glb" },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: nomeModelo, mesh: 0 }],
    meshes: [{ name: nomeModelo, primitives: primitivas }],
    materials: materiais,
    buffers: [{ byteLength: deslocamento }],
    bufferViews,
    accessors,
  }

  // contêiner GLB: cabeçalho de 12 bytes + bloco JSON + bloco binário
  let jsonBytes = Buffer.from(JSON.stringify(json), "utf8")
  jsonBytes = Buffer.concat([jsonBytes, Buffer.alloc((4 - (jsonBytes.length % 4)) % 4, 0x20)]) // espaços
  const binario = Buffer.concat(pedacos)
  const total = 12 + 8 + jsonBytes.length + 8 + binario.length
  const cabecalho = Buffer.alloc(12)
  cabecalho.write("glTF", 0, "ascii")
  cabecalho.writeUInt32LE(2, 4)
  cabecalho.writeUInt32LE(total, 8)
  const blocoJson = Buffer.alloc(8)
  blocoJson.writeUInt32LE(jsonBytes.length, 0)
  blocoJson.write("JSON", 4, "ascii")
  const blocoBin = Buffer.alloc(8)
  blocoBin.writeUInt32LE(binario.length, 0)
  blocoBin.write("BIN\0", 4, "ascii")
  writeFileSync(caminhoGlb, Buffer.concat([cabecalho, blocoJson, jsonBytes, blocoBin, binario]))

  return { triangulos: triangulosTotais, tamanho: maximo.map((m, i) => +(m - minimo[i]).toFixed(2)), baseY: +minimo[1].toFixed(2) }
}

const arquivos = readdirSync(entrada).filter((f) => f.toLowerCase().endsWith(".obj"))
let total = 0
for (const arquivo of arquivos) {
  const nome = basename(arquivo, ".obj")
  const r = converter(join(entrada, arquivo), join(saida, `${nome}.glb`), nome)
  total++
  if (total <= 4 || total % 40 === 0) {
    console.log(`${nome.padEnd(24)} ${r.triangulos} triângulos, tamanho(x,y,z)=${r.tamanho.join("x")}, base y=${r.baseY}`)
  }
}
console.log(`${total} modelos convertidos para ${saida}`)
