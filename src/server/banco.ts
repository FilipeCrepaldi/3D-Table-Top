// Banco de dados local (SQLite). Só roda no servidor do Next, nunca no navegador.
// Usa o módulo node:sqlite que já vem no Node, sem instalar nada.
//
// Onde ficam os dados (pasta `data/`, fora do git):
//   data/tabletop.db        o banco: tabelas `assets` e `cenas`
//   data/importados/*.glb   os modelos que você importa
//   data/artes/*.png        as artes 2D dos personagens
//   data/audios/*           músicas e sons ambientes

import { DatabaseSync } from "node:sqlite"
import { existsSync, mkdirSync, readFileSync } from "node:fs"
import path from "node:path"
import type { Arte, Asset, Audio } from "@/lib/tipos"

const PASTA_DADOS = path.join(process.cwd(), "data")
export const PASTA_IMPORTADOS = path.join(PASTA_DADOS, "importados")
export const PASTA_ARTES = path.join(PASTA_DADOS, "artes")
export const PASTA_AUDIOS = path.join(PASTA_DADOS, "audios")

type ComBanco = typeof globalThis & { __bancoTabletop?: DatabaseSync }

/** Executa `f` dentro de uma transação: ou grava tudo, ou nada. */
export function transacao<T>(db: DatabaseSync, f: () => T): T {
  db.exec("BEGIN")
  try {
    const resultado = f()
    db.exec("COMMIT")
    return resultado
  } catch (e) {
    db.exec("ROLLBACK")
    throw e
  }
}

// Mantém a tabela `assets` em dia com public/models/catalogo.json (gerado por
// `npm run catalogo`). Só mexe nos modelos que vêm com o projeto (local = 0);
// os importados por você ficam como estão.
function sincronizarCatalogo(db: DatabaseSync) {
  const arquivo = path.join(process.cwd(), "public", "models", "catalogo.json")
  if (!existsSync(arquivo)) return
  const catalogo = JSON.parse(readFileSync(arquivo, "utf8")) as Omit<Asset, "local">[]

  const inserir = db.prepare(`
    INSERT INTO assets (id, nome, nome_original, tipo, estilo, arquivo, pacote, autor, origem, licenca, local, escala)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
    ON CONFLICT(id) DO UPDATE SET
      nome = excluded.nome, nome_original = excluded.nome_original, tipo = excluded.tipo,
      estilo = excluded.estilo, arquivo = excluded.arquivo, pacote = excluded.pacote,
      autor = excluded.autor, origem = excluded.origem, licenca = excluded.licenca, escala = excluded.escala
    WHERE assets.local = 0
  `)

  transacao(db, () => {
    for (const a of catalogo) {
      inserir.run(a.id, a.nome, a.nomeOriginal, a.tipo, a.estilo, a.arquivo, a.pacote, a.autor, a.origem, a.licenca, a.escala ?? 1)
    }
    // remove os que saíram do catálogo
    const ids = new Set(catalogo.map((a) => a.id))
    const existentes = db.prepare("SELECT id FROM assets WHERE local = 0").all() as { id: string }[]
    const apagar = db.prepare("DELETE FROM assets WHERE id = ? AND local = 0")
    for (const { id } of existentes) if (!ids.has(id)) apagar.run(id)
  })
}

// Bancos criados por versões anteriores não têm algumas colunas. Acrescenta o que falta.
function migrar(db: DatabaseSync) {
  const colunas = (db.prepare("PRAGMA table_info(assets)").all() as { name: string }[]).map((c) => c.name)
  if (!colunas.includes("escala")) {
    db.exec("ALTER TABLE assets ADD COLUMN escala REAL NOT NULL DEFAULT 1")
  }
}

function abrir(): DatabaseSync {
  mkdirSync(PASTA_IMPORTADOS, { recursive: true })
  mkdirSync(PASTA_ARTES, { recursive: true })
  mkdirSync(PASTA_AUDIOS, { recursive: true })
  const db = new DatabaseSync(path.join(PASTA_DADOS, "tabletop.db"))
  db.exec(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS assets (
      id            TEXT PRIMARY KEY,
      nome          TEXT NOT NULL,
      nome_original TEXT NOT NULL,
      tipo          TEXT NOT NULL,
      estilo        TEXT NOT NULL,
      arquivo       TEXT NOT NULL,
      pacote        TEXT NOT NULL,
      autor         TEXT NOT NULL,
      origem        TEXT NOT NULL,
      licenca       TEXT NOT NULL,
      local         INTEGER NOT NULL DEFAULT 0,
      escala        REAL NOT NULL DEFAULT 1
    );
    CREATE INDEX IF NOT EXISTS idx_assets_estilo_tipo ON assets (estilo, tipo);

    CREATE TABLE IF NOT EXISTS artes (
      id        TEXT PRIMARY KEY,
      nome      TEXT NOT NULL,
      descricao TEXT NOT NULL DEFAULT '',
      arquivo   TEXT NOT NULL, -- nome do arquivo em data/artes
      largura   INTEGER NOT NULL,
      altura    INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audios (
      id      TEXT PRIMARY KEY,
      nome    TEXT NOT NULL,
      arquivo TEXT NOT NULL -- nome do arquivo em data/audios
    );

    CREATE TABLE IF NOT EXISTS cenas (
      id       TEXT PRIMARY KEY,
      nome     TEXT NOT NULL UNIQUE,
      salvo_em TEXT NOT NULL,
      dados    TEXT NOT NULL -- a cena inteira em JSON (mesmo formato do arquivo .json)
    );
  `)
  migrar(db)
  sincronizarCatalogo(db)
  return db
}

/** Conexão única, reaproveitada entre recarregamentos do servidor de desenvolvimento. */
export function banco(): DatabaseSync {
  const g = globalThis as ComBanco
  g.__bancoTabletop ??= abrir()
  return g.__bancoTabletop
}

type LinhaAsset = {
  id: string
  nome: string
  nome_original: string
  tipo: string
  estilo: string
  arquivo: string
  pacote: string
  autor: string
  origem: string
  licenca: string
  local: number
  escala: number
}

export function paraAsset(l: LinhaAsset): Asset {
  return {
    id: l.id,
    nome: l.nome,
    nomeOriginal: l.nome_original,
    tipo: l.tipo,
    estilo: l.estilo,
    arquivo: l.arquivo,
    pacote: l.pacote,
    autor: l.autor,
    origem: l.origem,
    licenca: l.licenca,
    local: l.local === 1,
    ...(l.escala !== 1 ? { escala: l.escala } : {}),
  }
}

export type LinhaArte = {
  id: string
  nome: string
  descricao: string
  arquivo: string
  largura: number
  altura: number
}

export function paraArte(l: LinhaArte): Arte {
  return {
    id: l.id,
    nome: l.nome,
    descricao: l.descricao,
    arquivo: `/api/imagens/${l.arquivo}`,
    largura: l.largura,
    altura: l.altura,
  }
}

export type LinhaAudio = { id: string; nome: string; arquivo: string }

export function paraAudio(l: LinhaAudio): Audio {
  return { id: l.id, nome: l.nome, arquivo: `/api/sons/${l.arquivo}` }
}
