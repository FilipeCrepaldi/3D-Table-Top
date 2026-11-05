"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber"
import { TransformControls, useGLTF } from "@react-three/drei"
import { BoxHelper, type Group } from "three"

import { useArtes } from "@/lib/artes"
import { useBiblioteca } from "@/lib/biblioteca"
import { useCena } from "@/lib/store"
import type { ObjetoCena, Vec3 } from "@/lib/tipos"
import Figura from "./figura"
import Modelo from "./modelo"

// Caixa colorida em volta de um objeto ou grupo (leve: só linhas, sem pós-processamento).
// Procura o objeto pelo nome (que é o id) a cada quadro até achar, porque o modelo
// pode ainda estar carregando quando a seleção acontece.
function Destaque({ nome, cor }: { nome: string; cor: string }) {
  const scene = useThree((s) => s.scene)
  const helper = useRef<BoxHelper | null>(null)

  useEffect(
    () => () => {
      if (helper.current) {
        scene.remove(helper.current)
        helper.current.dispose()
        helper.current = null
      }
    },
    [scene],
  )

  useFrame(() => {
    if (!helper.current) {
      const alvo = scene.getObjectByName(nome)
      if (!alvo) return
      helper.current = new BoxHelper(alvo, cor)
      scene.add(helper.current)
    }
    helper.current.update()
  })

  return null
}

// Desenha objetos e grupos do estado, trata cliques e mostra o gizmo no selecionado.
//  - clique: seleciona o objeto (ou o grupo inteiro, se ele estiver num grupo);
//  - Shift+clique: marca o objeto para agrupar;
//  - travado: não recebe cliques, então o clique passa direto para o que está atrás.
export default function ObjetosDaCena() {
  const objetos = useCena((s) => s.objetos)
  const grupos = useCena((s) => s.grupos)
  const selecionadoId = useCena((s) => s.selecionadoId)
  const grupoSelecionadoId = useCena((s) => s.grupoSelecionadoId)
  const multiSelecao = useCena((s) => s.multiSelecao)
  const apresentando = useCena((s) => s.apresentando)
  const pincelAtivo = useCena((s) => s.pincel.ativo)
  const modo = useCena((s) => s.modo)
  const encaixe = useCena((s) => s.encaixe)
  const assets = useBiblioteca((s) => s.assets)

  const artes = useArtes((s) => s.artes)

  // assetId -> URL do modelo
  const urls = useMemo(() => new Map(assets.map((a) => [a.id, a.arquivo])), [assets])
  // id da arte -> arte (objetos com assetId "arte/<id>" são figuras 2D em pé)
  const mapaArtes = useMemo(() => new Map(artes.map((a) => [a.id, a])), [artes])

  // Descarrega do cache os modelos que saíram da cena (liberar memória)
  const emUso = useRef(new Set<string>())
  useEffect(() => {
    const agora = new Set<string>()
    for (const o of objetos) {
      const url = urls.get(o.assetId)
      if (url) agora.add(url)
    }
    for (const url of emUso.current) if (!agora.has(url)) useGLTF.clear(url)
    emUso.current = agora
  }, [objetos, urls])

  // O Group do Three.js do que está selecionado (preenchido pelos refs abaixo)
  const [alvo, setAlvo] = useState<Group | null>(null)

  const objetoSelecionado = objetos.find((o) => o.id === selecionadoId)
  const grupoDoObjeto = grupos.find((g) => g.id === objetoSelecionado?.grupoId)
  const grupoSelecionado = grupos.find((g) => g.id === grupoSelecionadoId)
  const bloqueado = grupoSelecionado
    ? grupoSelecionado.travado
    : !!objetoSelecionado && (objetoSelecionado.travado === true || grupoDoObjeto?.travado === true)

  // Ao soltar o mouse, copia a transformação do Three.js de volta para o estado
  function aoSoltar() {
    if (!alvo) return
    const { position: p, rotation: r, scale: s } = alvo
    const nova = {
      posicao: [p.x, p.y, p.z] as Vec3,
      rotacao: [r.x, r.y, r.z] as Vec3,
      escala: [s.x, s.y, s.z] as Vec3,
    }
    const estado = useCena.getState()
    if (grupoSelecionadoId) estado.atualizarGrupo(grupoSelecionadoId, nova)
    else if (selecionadoId) estado.atualizar(selecionadoId, nova)
  }

  function aoClicar(e: ThreeEvent<MouseEvent>, o: ObjetoCena) {
    e.stopPropagation() // não deixa o clique "atravessar" para objetos atrás
    const estado = useCena.getState()
    if (e.nativeEvent.shiftKey) {
      if (!o.grupoId) estado.alternarMulti(o.id)
    } else if (o.grupoId) {
      estado.selecionarGrupo(o.grupoId)
    } else {
      estado.selecionar(o.id)
    }
  }

  function desenhar(o: ObjetoCena, travadoPeloGrupo: boolean) {
    // na apresentação nada é clicável: o mestre só olha
    const travado = travadoPeloGrupo || o.travado === true || apresentando || pincelAtivo
    const comum = {
      name: o.id,
      ref: o.id === selecionadoId ? setAlvo : undefined,
      position: o.posicao,
      rotation: o.rotacao,
      scale: o.escala,
      onClick: travado ? undefined : (e: ThreeEvent<MouseEvent>) => aoClicar(e, o),
    }

    if (o.assetId.startsWith("arte/")) {
      const arte = mapaArtes.get(o.assetId.slice("arte/".length))
      if (!arte) return null // artes ainda carregando, ou arte apagada
      return <Figura key={o.id} {...comum} arte={arte} />
    }

    const url = urls.get(o.assetId)
    if (!url) return null // catálogo ainda carregando, ou asset removido
    return <Modelo key={o.id} {...comum} arquivo={url} />
  }

  return (
    <>
      {objetos.filter((o) => !o.grupoId && !o.oculto).map((o) => desenhar(o, false))}

      {grupos.filter((g) => !g.oculto).map((g) => (
        <group
          key={g.id}
          name={g.id}
          ref={g.id === grupoSelecionadoId ? setAlvo : undefined}
          position={g.posicao}
          rotation={g.rotacao}
          scale={g.escala}
        >
          {objetos.filter((o) => o.grupoId === g.id && !o.oculto).map((o) => desenhar(o, g.travado))}
        </group>
      ))}

      {/* key: ao trocar de seleção, o destaque é recriado */}
      {!apresentando && (grupoSelecionadoId ?? selecionadoId) && (
        <Destaque key={grupoSelecionadoId ?? selecionadoId} nome={(grupoSelecionadoId ?? selecionadoId)!} cor="#ffd400" />
      )}
      {!apresentando && multiSelecao.map((id) => (
        <Destaque key={id} nome={id} cor="#00d5ff" />
      ))}

      {!apresentando && alvo && (selecionadoId || grupoSelecionadoId) && !bloqueado && (
        <TransformControls
          object={alvo}
          mode={modo}
          translationSnap={encaixe ? 0.5 : null}
          rotationSnap={encaixe ? Math.PI / 12 : null} // 15°
          scaleSnap={encaixe ? 0.1 : null}
          onMouseUp={aoSoltar}
        />
      )}
    </>
  )
}
