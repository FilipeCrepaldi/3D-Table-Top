// Prepara uma imagem escolhida pelo usuário antes de enviar ao servidor:
//  - converte para PNG (aceita PNG, JPG, WebP...);
//  - reduz se for muito grande (o maior lado vira, no máximo, LIMITE_LADO);
//  - corta as bordas transparentes, para a figura ocupar a imagem toda.
//    Isso importa para a figura em pé na cena: sem o corte, uma arte com muita
//    margem apareceria pequena e com os "pés" flutuando acima do chão.

const LIMITE_LADO = 1536
const ALFA_MINIMO = 10 // pixels quase invisíveis (0 a 255) contam como vazios

/** Devolve o PNG pronto, ou uma mensagem de erro. */
export async function prepararImagem(arquivo: File): Promise<Blob | string> {
  if (!arquivo.type.startsWith("image/")) return "O arquivo não é uma imagem."

  let bitmap: ImageBitmap
  try {
    bitmap = await createImageBitmap(arquivo)
  } catch {
    return "Não foi possível ler essa imagem."
  }

  const escala = Math.min(1, LIMITE_LADO / Math.max(bitmap.width, bitmap.height))
  const largura = Math.max(1, Math.round(bitmap.width * escala))
  const altura = Math.max(1, Math.round(bitmap.height * escala))

  const tela = document.createElement("canvas")
  tela.width = largura
  tela.height = altura
  const ctx = tela.getContext("2d", { willReadFrequently: true })
  if (!ctx) return "Seu navegador não conseguiu processar a imagem."
  ctx.drawImage(bitmap, 0, 0, largura, altura)
  bitmap.close()

  // Caixa que contém tudo o que não é transparente
  const { data } = ctx.getImageData(0, 0, largura, altura)
  let minX = largura
  let minY = altura
  let maxX = -1
  let maxY = -1
  for (let y = 0; y < altura; y++) {
    for (let x = 0; x < largura; x++) {
      if (data[(y * largura + x) * 4 + 3] > ALFA_MINIMO) {
        if (x < minX) minX = x
        if (x > maxX) maxX = x
        if (y < minY) minY = y
        if (y > maxY) maxY = y
      }
    }
  }
  if (maxX < 0) return "A imagem está totalmente transparente."

  // Recorta (com 2 px de folga, para não cortar a borda suave da figura)
  const folga = 2
  const x0 = Math.max(0, minX - folga)
  const y0 = Math.max(0, minY - folga)
  const x1 = Math.min(largura, maxX + 1 + folga)
  const y1 = Math.min(altura, maxY + 1 + folga)

  const recorte = document.createElement("canvas")
  recorte.width = x1 - x0
  recorte.height = y1 - y0
  recorte.getContext("2d")!.drawImage(tela, x0, y0, recorte.width, recorte.height, 0, 0, recorte.width, recorte.height)

  return new Promise((resolver) => {
    recorte.toBlob((blob) => resolver(blob ?? "Não foi possível converter a imagem."), "image/png")
  })
}
