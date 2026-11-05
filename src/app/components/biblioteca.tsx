"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Search } from "lucide-react"
import { useBiblioteca } from "@/lib/biblioteca"
import { useCena } from "@/lib/store"

const TODOS = "Todos"

// Normaliza para a busca ignorar maiúsculas e acentos
const normalizar = (t: string) =>
  t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")

const unicos = (valores: string[]) => Array.from(new Set(valores)).sort((a, b) => a.localeCompare(b, "pt-BR"))

export default function Biblioteca() {
  const assets = useBiblioteca((s) => s.assets)
  const carregando = useBiblioteca((s) => s.carregando)
  const erroCatalogo = useBiblioteca((s) => s.erro)

  const [busca, setBusca] = useState("")
  const [estilo, setEstilo] = useState(TODOS)
  const [tipo, setTipo] = useState(TODOS)
  const [autor, setAutor] = useState("")
  const [licenca, setLicenca] = useState("")
  const [tipoNovo, setTipoNovo] = useState("")
  const [estiloNovo, setEstiloNovo] = useState("")
  const [mensagem, setMensagem] = useState<string | null>(null)
  const inputArquivo = useRef<HTMLInputElement>(null)

  useEffect(() => {
    useBiblioteca.getState().iniciar()
  }, [])

  const estilos = useMemo(() => [TODOS, ...unicos(assets.map((a) => a.estilo))], [assets])

  // Os tipos oferecidos dependem do estilo escolhido (só os que existem nele)
  const tipos = useMemo(
    () => [
      TODOS,
      ...unicos(assets.filter((a) => estilo === TODOS || a.estilo === estilo).map((a) => a.tipo)),
    ],
    [assets, estilo],
  )

  const filtrados = useMemo(() => {
    const termo = normalizar(busca.trim())
    return assets.filter(
      (a) =>
        (estilo === TODOS || a.estilo === estilo) &&
        (tipo === TODOS || a.tipo === tipo) &&
        (termo === "" ||
          normalizar(a.nome).includes(termo) ||
          normalizar(a.nomeOriginal).includes(termo)),
    )
  }, [assets, busca, estilo, tipo])

  function mudarEstilo(novo: string) {
    setEstilo(novo)
    setTipo(TODOS) // o tipo antigo pode não existir no novo estilo
  }

  async function aoEscolherArquivo(arquivo: File | undefined) {
    if (!arquivo) return
    const erro = await useBiblioteca
      .getState()
      .importar(arquivo, { autor, licenca, tipo: tipoNovo, estilo: estiloNovo })
    setMensagem(erro ?? `"${arquivo.name}" importado.`)
    if (!erro) {
      setEstilo(estiloNovo.trim() || "Importado")
      setTipo(TODOS)
    }
    if (inputArquivo.current) inputArquivo.current.value = "" // permite reimportar o mesmo arquivo
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      <div className="cabecalho-painel">
        <h2>
          Biblioteca <span className="pilula">{filtrados.length}</span>
        </h2>

        <div style={{ position: "relative", marginBottom: 6 }}>
          <Search size={14} style={{ position: "absolute", left: 9, top: 9, color: "#6c7588" }} />
          <input
            type="search"
            placeholder="Buscar modelo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: "100%", paddingLeft: 28 }}
          />
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <select value={estilo} onChange={(e) => mudarEstilo(e.target.value)} style={{ flex: 1 }}>
            {estilos.map((e) => (
              <option key={e} value={e}>
                {e === TODOS ? "Todos os estilos" : e}
              </option>
            ))}
          </select>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} style={{ flex: 1 }}>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t === TODOS ? "Todos os tipos" : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      <ul className="lista-rolagem" style={{ listStyle: "none", margin: 0 }}>
        {carregando && <li className="dica" style={{ padding: 8 }}>Carregando...</li>}
        {erroCatalogo && <li style={{ color: "#ff8080" }}>{erroCatalogo}</li>}
        {filtrados.map((a) => (
          <li key={a.id}>
            <button
              className="item"
              onClick={() => useCena.getState().adicionar(a.id, a.nome, [0, 0, 0], a.escala)}
              title={`${a.nomeOriginal}\n${a.pacote} · ${a.estilo} · ${a.tipo}\nAutor: ${a.autor}\nLicença: ${a.licenca}\nOrigem: ${a.origem}`}
            >
              <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {a.nome}
              </span>
              <span className="pilula">{a.estilo}</span>
            </button>
          </li>
        ))}
      </ul>

      <details style={{ margin: "0 10px 10px" }}>
        <summary>
          <strong>Importar modelo (.glb)</strong>
        </summary>
        <datalist id="lista-tipos">
          {unicos(assets.map((a) => a.tipo)).map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
        <datalist id="lista-estilos">
          {unicos(assets.map((a) => a.estilo)).map((e) => (
            <option key={e} value={e} />
          ))}
        </datalist>
        <input
          placeholder="Tipo (ex.: Cadeira)"
          list="lista-tipos"
          value={tipoNovo}
          onChange={(e) => setTipoNovo(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />
        <input
          placeholder="Estilo (ex.: Medieval)"
          list="lista-estilos"
          value={estiloNovo}
          onChange={(e) => setEstiloNovo(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />
        <input
          placeholder="Autor"
          value={autor}
          onChange={(e) => setAutor(e.target.value)}
          style={{ width: "100%", marginTop: 6 }}
        />
        <input
          placeholder="Licença (ex.: CC0)"
          value={licenca}
          onChange={(e) => setLicenca(e.target.value)}
          style={{ width: "100%", margin: "6px 0" }}
        />
        <input
          ref={inputArquivo}
          type="file"
          accept=".glb"
          onChange={(e) => aoEscolherArquivo(e.target.files?.[0])}
          style={{ width: "100%" }}
        />
        {mensagem && <div className="dica" style={{ marginTop: 6 }}>{mensagem}</div>}
      </details>
    </div>
  )
}
