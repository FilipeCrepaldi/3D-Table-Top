// Tipos da cena. Tudo aqui é dado puro (números e textos), sem nada do Three.js,
// para poder virar JSON e ser salvo/carregado.

/** [x, y, z] */
export type Vec3 = [number, number, number]

/** Um modelo da biblioteca, com a origem e a licença registradas. */
export type Asset = {
  /** Identificador estável, ex.: "medieval/Prop_Crate" ou "local/<uuid>" */
  id: string
  /** Nome exibido, em português */
  nome: string
  /** Nome original do arquivo, usado também na busca */
  nomeOriginal: string
  /** O que a peça é: Parede, Piso, Cadeira, Mesa... */
  tipo: string
  /** Gênero visual: Medieval, Sci-Fi... */
  estilo: string
  /** URL para carregar o modelo (caminho em /public ou blob: para importados) */
  arquivo: string
  pacote: string
  autor: string
  origem: string
  licenca: string
  /** Tamanho padrão ao colocar na cena (pacotes que vêm em outra medida). Se não houver, 1. */
  escala?: number
  /** true quando foi importado pelo usuário e fica em data/importados */
  local?: boolean
}

/** Um objeto colocado na cena. Aponta para um asset pelo id (não pela URL,
 *  que muda entre sessões para modelos importados). */
export type ObjetoCena = {
  id: string
  /** Nome exibido no painel */
  nome: string
  assetId: string
  /** Quando está num grupo, posicao/rotacao/escala são relativas a ele */
  grupoId?: string
  /** Objeto travado não pode ser selecionado, movido nem excluído */
  travado?: boolean
  /** Objeto oculto não aparece na cena (dá para revelar depois) */
  oculto?: boolean
  posicao: Vec3
  /** Em radianos */
  rotacao: Vec3
  escala: Vec3
}

/** Conjunto de objetos que se move, gira e trava junto (ex.: a taverna inteira). */
export type GrupoCena = {
  id: string
  nome: string
  travado: boolean
  oculto?: boolean
  posicao: Vec3
  /** Em radianos */
  rotacao: Vec3
  escala: Vec3
}

/** Campos que podem ser alterados em um objeto (tudo menos o id). */
export type AlteracaoObjeto = Partial<Omit<ObjetoCena, "id">>

/** Arte 2D de um personagem (retrato ou figura recortada), guardada no banco local. */
export type Arte = {
  id: string
  nome: string
  descricao: string
  /** URL da imagem (servida por /api/imagens) */
  arquivo: string
  largura: number
  altura: number
}

/** Arquivo de som da biblioteca (música, ambiente, efeito), guardado no banco local. */
export type Audio = {
  id: string
  nome: string
  /** URL do som (servida por /api/sons) */
  arquivo: string
}

/** Um som tocando (ou parado) na cena, com volume e repetição próprios. */
export type TrilhaCena = {
  id: string
  audioId: string
  /** 0 a 1 */
  volume: number
  repetir: boolean
  tocando: boolean
}

/** O que um estado da cena guarda de cada trilha: ligada ou não, e o volume. */
export type EstadoTrilha = {
  trilhaId: string
  tocando: boolean
  volume: number
}

export type ModoCamera = "isometrica" | "perspectiva"

/** Onde a câmera está e para onde olha. */
export type VistaCamera = {
  modo: ModoCamera
  posicao: Vec3
  alvo: Vec3
  /** Só tem efeito na câmera isométrica (ortográfica) */
  zoom: number
}

/** Um enquadramento salvo, para voltar a ele com um clique (ex.: "Balcão", "Entrada"). */
export type PontoCamera = {
  id: string
  nome: string
  vista: VistaCamera
}

/** Lâmpada, vela, lareira: ilumina em todas as direções a partir de um ponto. */
export type LuzPontual = {
  id: string
  nome: string
  posicao: Vec3
  /** Cor em hexadecimal, ex.: "#ffb060" */
  cor: string
  intensidade: number
  /** Distância máxima da luz; 0 = sem limite */
  alcance: number
}

export type ConfigLuz = {
  ambienteCor: string
  ambienteIntensidade: number
  solIntensidade: number
  solPosicao: Vec3
  pontuais: LuzPontual[]
}

export type TipoParticula = "nenhuma" | "poeira" | "chuva" | "neve"

/** Atmosfera da cena: névoa e partículas. */
export type ConfigAmbiente = {
  nevoaAtiva: boolean
  nevoaCor: string
  /** Densidade da névoa exponencial: 0,02 leve, 0,15 espessa */
  nevoaDensidade: number
  particulas: TipoParticula
  particulasQuantidade: number
  /** Cores do céu: no alto, no horizonte e abaixo dele */
  ceuTopo: string
  ceuHorizonte: string
  ceuBase: string
  estrelas: boolean
}

/** O chão da cena: uma cor de fundo e, por cima, a pintura feita com o pincel. */
export type Terreno = {
  /** Cor do chão onde não há pintura */
  corBase: string
  /** Imagem da pintura (data URL), ou null se o chão não foi pintado */
  pintura: string | null
  /** Lado da área pintável, em unidades do mundo (ela fica centrada na origem) */
  tamanho: number
}

/** Uma "versão" da cena (dia, noite, tempestade...): guarda luz e atmosfera. */
export type EstadoDaCena = {
  id: string
  nome: string
  luz: ConfigLuz
  ambiente: ConfigAmbiente
  trilhas: EstadoTrilha[]
}

/** Ajuste de desempenho do aplicativo (não é salvo com a cena). */
export type Qualidade = "baixa" | "media" | "alta"

/** O que vai para o banco de dados e para o arquivo .json exportado. */
export type CenaSalva = {
  /** Versão do formato; permite migrar arquivos antigos no futuro */
  versao: 1
  id: string
  nome: string
  /** Data ISO */
  salvoEm: string
  objetos: ObjetoCena[]
  grupos: GrupoCena[]
  pontosCamera: PontoCamera[]
  /** Ids das artes mostradas como cartão na apresentação */
  cartoes: string[]
  trilhas: TrilhaCena[]
  modoCamera: ModoCamera
  vista: VistaCamera | null
  luz: ConfigLuz
  ambiente: ConfigAmbiente
  terreno: Terreno
  estados: EstadoDaCena[]
}
