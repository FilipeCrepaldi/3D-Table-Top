"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Download, FilePlus2, FolderOpen, Save, Trash2, Upload } from "lucide-react"
import { ambienteBase, terrenoBase } from "@/lib/ambiente"
import { aplicarCena, cenaAtual } from "@/lib/cena-atual"
import { luzBase } from "@/lib/luz"
import { baixarJson, excluirCena, gravarCena, lerArquivoJson, listarCenas } from "@/lib/salvamento"
import { useCena } from "@/lib/store"
import type { CenaSalva } from "@/lib/tipos"

// Nome da cena e ações de salvar, abrir, exportar e importar (vai dentro da barra do topo).
export default function BarraCenas() {
  const nome = useCena((s) => s.nome)
  const [salvas, setSalvas] = useState<CenaSalva[]>([])
  const [escolhida, setEscolhida] = useState("")
  const [mensagem, setMensagem] = useState<string | null>(null)
  const inputJson = useRef<HTMLInputElement>(null)

  const atualizarLista = useCallback(async () => {
    try {
      setSalvas(await listarCenas())
    } catch {
      setMensagem("Não foi possível ler as cenas do banco de dados.")
    }
  }, [])

  useEffect(() => {
    // Lê as cenas do banco na primeira vez
    // eslint-disable-next-line react-hooks/set-state-in-effect
    atualizarLista()
  }, [atualizarLista])

  // O aviso some sozinho depois de alguns segundos
  useEffect(() => {
    if (!mensagem) return
    const t = setTimeout(() => setMensagem(null), 4500)
    return () => clearTimeout(t)
  }, [mensagem])

  // Começa uma cena vazia, mantendo a câmera onde está
  function novaCena() {
    const s = useCena.getState()
    if (s.objetos.length > 0 && !window.confirm("Começar uma cena vazia? O que não foi salvo será perdido.")) {
      return
    }
    s.substituirCena({
      nome: "Nova cena",
      objetos: [],
      grupos: [],
      pontosCamera: [],
      cartoes: [],
      trilhas: [],
      modoCamera: s.modoCamera,
      luz: luzBase(),
      ambiente: ambienteBase(),
      terreno: terrenoBase(),
      estados: [],
    })
    setEscolhida("")
    setMensagem("Cena vazia criada.")
  }

  async function salvar() {
    const cena = cenaAtual()
    const existe = salvas.some((c) => c.nome === cena.nome)
    if (existe && !window.confirm(`Já existe uma cena "${cena.nome}". Substituir?`)) return
    try {
      await gravarCena(cena)
      await atualizarLista()
      setMensagem(`"${cena.nome}" salva.`)
    } catch (e) {
      setMensagem(e instanceof Error ? `Não foi possível salvar: ${e.message}` : "Não foi possível salvar.")
    }
  }

  function abrir() {
    const cena = salvas.find((c) => c.id === escolhida)
    if (cena) setMensagem(aplicarCena(cena))
  }

  async function excluir() {
    const cena = salvas.find((c) => c.id === escolhida)
    if (!cena || !window.confirm(`Excluir a cena salva "${cena.nome}"?`)) return
    try {
      await excluirCena(cena.id)
      setEscolhida("")
      await atualizarLista()
      setMensagem(`"${cena.nome}" excluída.`)
    } catch {
      setMensagem("Não foi possível excluir a cena.")
    }
  }

  async function importarJson(arquivo: File | undefined) {
    if (!arquivo) return
    const resultado = await lerArquivoJson(arquivo)
    if (typeof resultado === "string") setMensagem(resultado)
    else setMensagem(aplicarCena(resultado))
    if (inputJson.current) inputJson.current.value = ""
  }

  return (
    <>
      <div className="grupo-botoes" style={{ minWidth: 0 }}>
        <input
          value={nome}
          onChange={(e) => useCena.getState().definirNome(e.target.value)}
          placeholder="Nome da cena"
          style={{ width: 180 }}
          aria-label="Nome da cena"
        />
        <button className="icone" onClick={novaCena} title="Nova cena vazia">
          <FilePlus2 size={16} />
        </button>
        <button className="primario" onClick={salvar} title="Salvar a cena no banco de dados">
          <Save size={15} /> Salvar
        </button>
      </div>

      <div className="separador" />

      <div className="grupo-botoes" style={{ minWidth: 0 }}>
        <select value={escolhida} onChange={(e) => setEscolhida(e.target.value)} style={{ maxWidth: 200 }} aria-label="Cenas salvas">
          <option value="">Cenas salvas ({salvas.length})</option>
          {salvas.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome} · {new Date(c.salvoEm).toLocaleDateString("pt-BR")}
            </option>
          ))}
        </select>
        <button className="icone" onClick={abrir} disabled={!escolhida} title="Abrir a cena escolhida">
          <FolderOpen size={16} />
        </button>
        <button className="icone perigo" onClick={excluir} disabled={!escolhida} title="Excluir a cena escolhida">
          <Trash2 size={16} />
        </button>
        <button className="icone" onClick={() => baixarJson(cenaAtual())} title="Exportar a cena como arquivo .json">
          <Download size={16} />
        </button>
        <button className="icone" onClick={() => inputJson.current?.click()} title="Importar uma cena de um arquivo .json">
          <Upload size={16} />
        </button>
        <input
          ref={inputJson}
          type="file"
          accept=".json,application/json"
          hidden
          onChange={(e) => importarJson(e.target.files?.[0])}
        />
      </div>

      {mensagem && <div className="toast">{mensagem}</div>}
    </>
  )
}
