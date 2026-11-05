// Gera public/models/catalogo.json a partir dos modelos das pastas de pacotes.
// Rode de novo (npm run catalogo) sempre que adicionar ou remover modelos.
//
// Cada asset recebe:
//  - estilo: o gênero visual (Medieval, Sci-Fi, Fantasia, Natureza...), vem do pacote;
//  - tipo:   o que a peça é (Parede, Árvore, Casa...), deduzido do nome do arquivo;
//  - nome:   tradução do nome do arquivo para português (melhor esforço);
//  - nomeOriginal: o nome em inglês, usado também na busca;
//  - escala: tamanho padrão ao colocar na cena (só quando o pacote vem em outra medida).
//
// Para incluir um pacote novo: coloque os modelos em public/models/<pasta>, acrescente uma
// entrada em PACOTES e, se preciso, palavras em PALAVRAS e tipos nas tabelas.
import { readdirSync, writeFileSync } from "node:fs"
import { join } from "node:path"

const RAIZ = "public/models"

// ---------------------------------------------------------------------------
// Tipos (o que a peça é)
// ---------------------------------------------------------------------------

// Pelo primeiro trecho do nome
const TIPO_POR_PREFIXO = {
  // Medieval Village e Modular SciFi
  Balcony: "Sacada",
  Corner: "Canto",
  Door: "Porta",
  DoorFrame: "Porta",
  Floor: "Piso",
  HoleCover: "Piso",
  Overhang: "Beiral",
  Roof: "Telhado",
  Stair: "Escada",
  Stairs: "Escada",
  Wall: "Parede",
  ShortWall: "Parede",
  WallAstra: "Parede",
  WallBand: "Parede",
  WallWindow: "Janela",
  Window: "Janela",
  WindowShutters: "Janela",
  TopWindow: "Janela",
  Alien: "Criatura",
  Column: "Coluna",
  Decal: "Decalque",
  Platform: "Plataforma",
  BottomMetal: "Acabamento",
  BottomSimple: "Acabamento",
  TopAstra: "Acabamento",
  TopCables: "Acabamento",
  TopPlastic: "Acabamento",
  TopSimple: "Acabamento",
  // Natureza (os dois packs)
  BirchTree: "Árvore",
  CommonTree: "Árvore",
  DeadTree: "Árvore",
  MapleTree: "Árvore",
  PalmTree: "Árvore",
  PineTree: "Árvore",
  Willow: "Árvore",
  Bush: "Arbusto",
  BushBerries: "Arbusto",
  Cactus: "Cacto",
  CactusFlower: "Cacto",
  CactusFlowers: "Cacto",
  Corn: "Plantação",
  Wheat: "Plantação",
  Flower: "Flor",
  Flowers: "Flor",
  Grass: "Grama",
  Lilypad: "Planta",
  Plant: "Planta",
  Rock: "Rocha",
  TreeStump: "Tronco",
  WoodLog: "Tronco",
  // Fantasy RTS
  Archery: "Arquearia",
  Barracks: "Quartel",
  Barrel: "Barril",
  Crate: "Caixote",
  Dock: "Doca",
  Farm: "Fazenda",
  Houses: "Casa",
  Logs: "Tronco",
  Market: "Mercado",
  Mine: "Mina",
  Mountain: "Montanha",
  MountainLarge: "Montanha",
  Port: "Porto",
  Storage: "Armazém",
  Temple: "Templo",
  TowerHouse: "Torre",
  TownCenter: "Centro da cidade",
  WallTowers: "Muralha",
  WatchTower: "Torre",
  Windmill: "Moinho",
  Wonder: "Maravilha",
  WonderWalls: "Muralha",
}

// Dos "Prop_" (Medieval e SciFi): pelo segundo trecho
const TIPO_POR_PROP = {
  Brick: "Detalhe",
  ExteriorBorder: "Detalhe",
  Chimney: "Chaminé",
  Crate: "Caixote",
  Crate3: "Caixote",
  Crate4: "Caixote",
  MetalFence: "Cerca",
  WoodenFence: "Cerca",
  Support: "Suporte",
  Vine: "Vegetação",
  Wagon: "Carroça",
  Barrel: "Barril",
  Chest: "Baú",
  Computer: "Computador",
  Light: "Luz",
  Vent: "Ventilação",
  Fan: "Ventilação",
  Rail: "Corrimão",
  Cable: "Equipamento",
  Clamp: "Equipamento",
  ItemHolder: "Equipamento",
  PipeHolder: "Equipamento",
  AccessPoint: "Equipamento",
}

// Dos "Resource_" do Fantasy RTS: pelo segundo trecho
const TIPO_POR_RECURSO = {
  Gold: "Minério",
  PineTree: "Árvore",
  Tree: "Árvore",
  Rock: "Rocha",
}

const semNumero = (t) => t.replace(/\d+$/, "")

function tipoDe(tokens, ajustes = {}) {
  const [primeiro, segundo = ""] = tokens
  if (ajustes[primeiro]) return ajustes[primeiro]
  if (primeiro === "Prop") return TIPO_POR_PROP[semNumero(segundo)] ?? "Outros"
  if (primeiro === "Resource") return TIPO_POR_RECURSO[semNumero(segundo)] ?? "Outros"
  return TIPO_POR_PREFIXO[primeiro] ?? "Outros"
}

// ---------------------------------------------------------------------------
// Tradução das palavras. O que não estiver aqui fica em inglês.
// Entrada em lista = [masculino, feminino]; a escolha segue o gênero do primeiro
// substantivo do nome (veja GENERO), então: "bétula morta", "salgueiro morto".
// ---------------------------------------------------------------------------
const PALAVRAS = {
  // construção (Medieval Village)
  Balcony: "sacada",
  Corner: "canto",
  Door: "porta",
  DoorFrame: "batente",
  Floor: "piso",
  HoleCover: "tampa de buraco",
  Overhang: "beiral",
  Roof: "telhado",
  Stair: "escada",
  Stairs: "escada",
  Wall: "parede",
  ShortWall: "parede baixa",
  Window: "janela",
  WindowShutters: "persiana",
  Prop: "",
  Crate: "caixote",
  Chest: "baú",
  Barrel: "barril",
  Wagon: "carroça",
  Chimney: "chaminé",
  Fence: "cerca",
  MetalFence: "cerca de metal",
  WoodenFence: "cerca de madeira",
  Support: "suporte",
  Vine: "trepadeira",
  Light: "luz",
  Computer: "computador",
  Vent: "ventilação",
  Fan: "ventilador",
  Rail: "corrimão",
  Cable: "cabo",
  Column: "coluna",
  Platform: "plataforma",
  Alien: "criatura",
  Decal: "decalque",
  Brick: "tijolo",
  UnevenBrick: "tijolo irregular",
  RedBrick: "tijolo vermelho",
  Plaster: "reboco",
  Wood: "madeira",
  WoodDark: "madeira escura",
  WoodLight: "madeira clara",
  Metal: "metal",
  // adjetivos e detalhes
  Large: ["grande", "grande"],
  Small: ["pequeno", "pequena"],
  Big: ["grande", "grande"],
  Wide: ["largo", "larga"],
  Thin: ["fino", "fina"],
  Long: ["longo", "longa"],
  Short: ["curto", "curta"],
  Half: "meio",
  Straight: ["reto", "reta"],
  Round: ["redondo", "redonda"],
  Flat: ["plano", "plana"],
  Simple: "simples",
  Open: ["aberto", "aberta"],
  Closed: ["fechado", "fechada"],
  Interior: ["interno", "interna"],
  Exterior: ["externo", "externa"],
  Center: "centro",
  Left: "esquerda",
  Right: "direita",
  Base: "base",
  Top: "topo",
  Bottom: "base",
  Tiles: "telhas",
  RoundTiles: "telhas redondas",
  Tile: "telha",
  Hollow: ["oco", "oca"],
  Pipes: "tubos",
  Incline: ["inclinado", "inclinada"],
  Dark: ["escuro", "escura"],
  Single: ["único", "única"],
  Extension: "extensão",
  Ornament: "ornamento",
  Front: "frontal",
  Side: "lateral",
  Sides: "laterais",
  Arch: "arco",
  Thick: ["grosso", "grossa"],
  Inset: ["recuado", "recuada"],
  Cover: "tampa",
  // natureza
  BirchTree: "bétula",
  CommonTree: "árvore comum",
  DeadTree: "árvore morta",
  MapleTree: "bordo",
  PalmTree: "palmeira",
  PineTree: "pinheiro",
  Tree: "árvore",
  Willow: "salgueiro",
  Bush: "arbusto",
  BushBerries: "arbusto com frutinhas",
  Cactus: "cacto",
  CactusFlower: "cacto com flor",
  CactusFlowers: "cacto com flores",
  Corn: "milho",
  Wheat: "trigo",
  Flower: "flor",
  Flowers: "flores",
  Grass: "grama",
  Lilypad: "vitória-régia",
  Plant: "planta",
  Rock: "rocha",
  TreeStump: "toco de árvore",
  WoodLog: "tronco",
  Logs: "troncos",
  Autumn: "de outono",
  Dead: ["morto", "morta"],
  Snow: "com neve",
  Moss: "com musgo",
  Clump: "em tufo",
  Extruded: ["extrudado", "extrudada"],
  Group: "em grupo",
  Cut: ["cortado", "cortada"],
  Stack: "pilha",
  // Fantasy RTS
  Archery: "arquearia",
  Barracks: "quartel",
  Dock: "doca",
  Farm: "fazenda",
  Houses: "casa",
  Market: "mercado",
  Mine: "mina",
  Mountain: "montanha",
  MountainLarge: "montanha grande",
  Port: "porto",
  Storage: "armazém",
  Temple: "templo",
  TowerHouse: "casa-torre",
  TownCenter: "centro da cidade",
  WallTowers: "torres da muralha",
  WatchTower: "torre de vigia",
  Windmill: "moinho",
  Wonder: "maravilha",
  WonderWalls: "muralhas da maravilha",
  Resource: "recurso",
  Gold: "ouro",
  Dirt: "terra",
  DoorClosed: "porta fechada",
  FirstAge: "1ª era",
  SecondAge: "2ª era",
  Level: "nível",
  Leve: "nível", // erro de digitação no nome original (Storage_FirstAge_Leve3)
}

// Gênero do primeiro substantivo: m = masculino, f = feminino (padrão)
const GENERO = {
  Corner: "m", Floor: "m", Overhang: "m", Roof: "m", DoorFrame: "m", Support: "m", Crate: "m", Chest: "m",
  Barrel: "m", Computer: "m", Fan: "m", Rail: "m", Cable: "m", Decal: "m", Brick: "m",
  MapleTree: "m", PineTree: "m", Willow: "m", Bush: "m", BushBerries: "m", Cactus: "m", CactusFlower: "m",
  CactusFlowers: "m", Corn: "m", Wheat: "m", TreeStump: "m", WoodLog: "m", Logs: "m",
  Barracks: "m", Market: "m", Port: "m", Resource: "m", Storage: "m", Temple: "m", TownCenter: "m",
  Windmill: "m", Mountain: "m", MountainLarge: "f",
}

// Palavras que, depois do primeiro nome, ganham "com": "Bush_Small_Flowers" = "arbusto pequeno com flores"
const COM_DEPOIS = { Flower: "com flor", Flowers: "com flores", Wheat: "com trigo" }

function nomeEmPortugues(tokens, extras = {}) {
  const genero = GENERO[semNumero(tokens[0])] ?? "f"
  const indice = genero === "m" ? 0 : 1
  const palavras = tokens.map((t, posicao) => {
    if (posicao > 0 && COM_DEPOIS[t]) return COM_DEPOIS[t]
    if (/^\d+$/.test(t)) return `#${t}` // variante numerada: "casa 1ª era #2 nível 1"
    const numero = t.match(/\d+$/)?.[0] ?? ""
    const base = semNumero(t)
    let traduzida = extras[t] ?? extras[base] ?? PALAVRAS[t] ?? PALAVRAS[base]
    if (Array.isArray(traduzida)) traduzida = traduzida[indice]
    if (traduzida === undefined) return t.replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase()
    return traduzida ? `${traduzida}${numero ? " " + numero : ""}` : ""
  })
  const texto = palavras.filter(Boolean).join(" ").replace(/\s+/g, " ").trim()
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}

// ---------------------------------------------------------------------------
// Pacotes
// ---------------------------------------------------------------------------
const PACOTES = [
  { pasta: "medieval", nome: "Medieval Village", estilo: "Medieval", ext: ".gltf" },
  { pasta: "scifi", nome: "Modular SciFi", estilo: "Sci-Fi", ext: ".gltf" },
  {
    // Prédios de estratégia: saem bem menores que o resto (uma casa mede cerca de 1),
    // então entram na cena ampliados 4 vezes para ficarem na escala do Medieval Village.
    pasta: "rts",
    nome: "Ultimate Fantasy RTS",
    estilo: "Fantasia",
    ext: ".gltf",
    escala: 4,
    // aqui "Wall" é a muralha da cidade, não a parede de uma casa
    palavras: { Wall: "muralha" },
    tipos: { Wall: "Muralha" },
  },
  { pasta: "natureza-lowpoly", nome: "Ultimate Nature Pack", estilo: "Natureza", ext: ".glb" },
  { pasta: "natureza-estilizada", nome: "Ultimate Stylized Nature", estilo: "Natureza", ext: ".gltf" },
]

const assets = []

for (const pacote of PACOTES) {
  const arquivos = readdirSync(join(RAIZ, pacote.pasta)).filter((f) => f.endsWith(pacote.ext))
  for (const arquivo of arquivos.sort()) {
    const base = arquivo.slice(0, -pacote.ext.length)
    const tokens = base.split("_")
    const tipo = tipoDe(tokens, pacote.tipos)
    if (tipo === "Outros") console.warn(`Sem tipo para ${pacote.pasta}/${arquivo}`)
    assets.push({
      id: `${pacote.pasta}/${base}`,
      nome: nomeEmPortugues(tokens, pacote.palavras),
      nomeOriginal: base.replace(/_/g, " "),
      tipo,
      estilo: pacote.estilo,
      arquivo: `/models/${pacote.pasta}/${arquivo}`,
      pacote: pacote.nome,
      autor: "Quaternius",
      origem: "https://quaternius.com/",
      licenca: "CC0 1.0",
      ...(pacote.escala ? { escala: pacote.escala } : {}),
    })
  }
}

writeFileSync(join(RAIZ, "catalogo.json"), JSON.stringify(assets, null, 1))
console.log(`${assets.length} assets em ${join(RAIZ, "catalogo.json")}`)
const porTipo = {}
for (const a of assets) porTipo[`${a.estilo} / ${a.tipo}`] = (porTipo[`${a.estilo} / ${a.tipo}`] ?? 0) + 1
console.log(porTipo)
