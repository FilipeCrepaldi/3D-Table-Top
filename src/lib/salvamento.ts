import { validarCena } from "./validacao"
import type { CenaSalva } from "./tipos"

// Duas formas de guardar, usando o mesmo formato (CenaSalva):
//  - banco de dados local (SQLite, via /api/cenas): lista de cenas para abrir rápido;
//  - arquivo .json: exportar/importar, para backup e para levar a outro computador.

// ---------- Banco de dados (API) ----------

async function chamar(url: string, init?: RequestInit) {
  const resposta = await fetch(url, init)
  if (!resposta.ok) {
    const corpo = (await resposta.json().catch(() => null)) as { erro?: string } | null
    throw new Error(corpo?.erro ?? `Erro ${resposta.status}`)
  }
  return resposta
}

export async function listarCenas(): Promise<CenaSalva[]> {
  const resposta = await chamar("/api/cenas", { cache: "no-store" })
  // Passa cada cena pela validação: cenas salvas em versões anteriores do app
  // ganham os campos novos (ex.: grupos) com valores padrão.
  const brutas = (await resposta.json()) as unknown[]
  return brutas.map(validarCena).filter((c): c is CenaSalva => typeof c !== "string")
}

/** Grava a cena. Se já existe uma com o mesmo nome, ela é substituída. */
export async function gravarCena(cena: CenaSalva): Promise<void> {
  await chamar("/api/cenas", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(cena),
  })
}

export async function excluirCena(id: string): Promise<void> {
  await chamar(`/api/cenas/${encodeURIComponent(id)}`, { method: "DELETE" })
}

// ---------- Arquivo .json ----------

export function baixarJson(cena: CenaSalva) {
  const blob = new Blob([JSON.stringify(cena, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${cena.nome.replace(/[^\w\-]+/g, "_") || "cena"}.tabletop.json`
  a.click()
  URL.revokeObjectURL(url)
}

export async function lerArquivoJson(arquivo: File): Promise<CenaSalva | string> {
  if (arquivo.size > 20 * 1024 * 1024) return "Arquivo grande demais para ser uma cena."
  let dado: unknown
  try {
    dado = JSON.parse(await arquivo.text())
  } catch {
    return "O arquivo não é um JSON válido."
  }
  return validarCena(dado)
}
