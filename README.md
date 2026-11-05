# Tabletop 3D --- Documento de Visão do Projeto

> **Status:** MVP funcional; em evolução\
> **Versão do documento:** 0.2\
> **Objetivo:** Criar uma ferramenta própria, leve e de baixo custo para
> ambientar sessões de RPG de mesa por meio de cenários tridimensionais.

------------------------------------------------------------------------

## Como rodar

**Requisitos:** [Node.js](https://nodejs.org/) **24 ou mais novo** (o app usa o
SQLite embutido do Node, `node:sqlite`; ele pode mostrar um aviso de recurso
experimental no terminal, o que é normal).

``` bash
npm install        # instala as dependências
npm run dev        # abre em http://localhost:3000
```

Outros comandos:

| Comando | O que faz |
|---|---|
| `npm run build` | Compila para produção |
| `npm start` | Roda a versão compilada |
| `npm run catalogo` | Refaz o catálogo de modelos (`public/models/catalogo.json`) depois de adicionar ou remover modelos |

### Onde ficam os seus dados

Tudo o que você cria fica na pasta `data/`, **que não vai para o git**:

| O quê | Onde |
|---|---|
| Cenas, catálogo, artes e sons (banco SQLite) | `data/tabletop.db` |
| Modelos 3D que você importa | `data/importados/` |
| Artes 2D de personagens | `data/artes/` |
| Sons e músicas | `data/audios/` |

A pasta é criada sozinha na primeira execução. **Faça cópias dela de vez em
quando**: é o seu backup. Para levar uma cena a outro computador, use os
botões de exportar e importar `.json` da barra do topo.

### Cenas de exemplo

A pasta `exemplos/` traz cenas prontas: a **Taverna do Javali** (exterior, salão
e quartos) e **Innsmouth** (uma ilha-cidade sombria). Abra o app, clique em
importar (seta para cima, na barra do topo) e escolha um dos arquivos
`.tabletop.json`.

### Atalhos

| Tecla | Ação |
|---|---|
| W, E, R | Mover, girar e escalar |
| Delete | Exclui o selecionado |
| Ctrl+D | Duplica |
| Ctrl+G | Agrupa os objetos marcados |
| Esc | Limpa a seleção (ou sai do pincel) |
| Ctrl+Z | Desfaz a pincelada (com o pincel ligado) |
| P | Alterna o modo de apresentação |

### Adicionar novos pacotes de modelos

1. Coloque os modelos em `public/models/<nome-do-pacote>/` (formato `.glb` ou `.gltf`).
2. Acrescente o pacote na lista `PACOTES` de `scripts/gerar-catalogo.mjs` (estilo, escala e,
   se precisar, palavras novas no dicionário de tradução).
3. Rode `npm run catalogo`.

Ferramentas para pacotes que não vêm prontos:
- `node scripts/obj-para-glb.mjs <pasta com .obj e .mtl> <pasta de saída>` converte OBJ em GLB.
- `node scripts/otimizar-gltf.mjs <pasta> [--max 1024]` reduz texturas pesadas.

Cenas e testes por script: abrir o app com `?debug` na URL expõe as ações do
editor em `window.__tabletop`.

------------------------------------------------------------------------

## 1. Visão geral

O **Tabletop 3D** será uma aplicação para mestres de RPG criarem,
organizarem e apresentarem ambientes tridimensionais durante suas
sessões.

A proposta é combinar a praticidade de um virtual tabletop como o
Owlbear Rodeo com a liberdade visual de um editor de cenários 3D. O foco
não é simular regras de RPG nem controlar o movimento dos personagens. O
foco é **apresentar o espaço, a atmosfera e os elementos narrativos de
cada cena**.

O mestre poderá construir uma taverna, floresta, masmorra, vila, templo
ou qualquer outro ambiente usando peças modulares e modelos 3D
importados. Durante a sessão, poderá alternar entre diferentes ângulos
de câmera, controlar a ambientação e exibir artes 2D dos personagens.

### Objetivo principal

Dar ao mestre uma maneira acessível de transformar descrições narrativas
em ambientes visuais tridimensionais, aumentando a imersão e ajudando os
jogadores a compreenderem o espaço da cena.

### Princípio central

**A ferramenta deve servir à narração, não substituir a narração nem
transformar a sessão em um videogame.**

------------------------------------------------------------------------

## 2. Escopo do produto

### O que o produto deve oferecer

-   Criar e editar cenários 3D.
-   Montar ambientes com peças modulares e objetos independentes.
-   Importar modelos 3D próprios, preferencialmente no formato GLB.
-   Organizar modelos em uma biblioteca de assets.
-   Posicionar, girar, redimensionar, duplicar e remover objetos.
-   Visualizar o cenário em uma câmera híbrida: visão geral/isométrica e
    perspectiva próxima/cinematográfica.
-   Configurar iluminação, névoa, partículas e outros efeitos
    ambientais.
-   Reproduzir sons ambientes e música.
-   Criar diferentes estados ou versões de uma mesma cena.
-   Salvar e carregar projetos.
-   Exibir artes 2D de personagens, NPCs e outros elementos narrativos.
-   Oferecer controles rápidos ao mestre durante a sessão.

### O que não é objetivo inicial

-   Sistema de combate.
-   Regras ou fichas automatizadas de RPG.
-   Iniciativa, turnos ou cálculo de dano.
-   Movimentação automatizada de personagens.
-   Física ou colisão avançada entre miniaturas.
-   Multiplayer e sincronização online.
-   Criação de modelos 3D do zero dentro da aplicação.
-   Mercado próprio de assets.
-   Dependência de serviços pagos ou APIs comerciais.

Esses itens podem ser reconsiderados futuramente, mas não fazem parte do
MVP.

------------------------------------------------------------------------

## 3. Experiência de uso

O fluxo principal imaginado é:

1.  O mestre cria uma campanha ou projeto.
2.  Cria uma cena ou seleciona uma cena existente.
3.  Abre o editor 3D.
4.  Adiciona pisos, paredes, estruturas, móveis, objetos e decorações.
5.  Ajusta a câmera e a composição visual.
6.  Configura iluminação, atmosfera e áudio.
7.  Adiciona artes 2D e informações de personagens, caso necessário.
8.  Salva a cena.
9.  Durante a sessão, abre o modo de apresentação e controla a cena sem
    precisar reconstruí-la.

### Exemplo: criar uma taverna

O mestre poderá:

-   Montar a estrutura com pisos, paredes, portas e janelas modulares.
-   Adicionar balcão, mesas, cadeiras, barris, caixas, velas e lareira a
    partir da biblioteca.
-   Duplicar e girar objetos para compor o ambiente.
-   Ajustar materiais e cores quando suportado pelo asset.
-   Configurar luz quente, sombras e sons de taverna.
-   Salvar uma versão normal e outra com a taverna tomada por fumaça ou
    em situação de combate narrativo.

A ideia é montar cenários por composição de assets, sem precisar modelar
cada objeto manualmente.

------------------------------------------------------------------------

## 4. Câmera e visualização

**Decisão definida: modo híbrido.**

A aplicação deverá permitir alternar entre:

### Visão geral / isométrica

-   Mostrar o cenário como uma maquete 3D.
-   Facilitar a compreensão da disposição espacial.
-   Permitir girar, aproximar e afastar a câmera.
-   Ser útil para apresentar uma sala, construção ou área inteira.

### Perspectiva próxima / cinematográfica

-   Aproximar a câmera de pontos de interesse.
-   Destacar detalhes do ambiente.
-   Criar enquadramentos dramáticos para momentos narrativos.
-   Permitir observar o cenário em uma perspectiva mais imersiva.

A câmera não precisa simular o controle de um personagem. Ela é uma
ferramenta de apresentação controlada pelo mestre.

------------------------------------------------------------------------

## 5. Personagens e elementos narrativos

Os personagens serão representados principalmente por **artes 2D**, não
por miniaturas 3D.

Possibilidades para uma etapa posterior:

-   Importar retratos e ilustrações.
-   Exibir nome e descrição.
-   Organizar personagens por campanha.
-   Criar cartões ou painéis visuais.
-   Exibir NPCs relevantes durante uma cena.
-   Associar personagens a cenas ou eventos.

Não é necessário implementar fichas completas ou regras de sistema no
MVP.

------------------------------------------------------------------------

## 6. Editor de cenários

O editor é uma das partes centrais do produto.

### Funcionalidades desejadas

-   Inserir objetos na cena.
-   Selecionar objetos com o mouse.
-   Mover, girar e redimensionar objetos.
-   Duplicar e excluir objetos.
-   Ajustar posição com precisão.
-   Organizar objetos em grupos ou categorias.
-   Salvar e reabrir cenas.
-   Desfazer e refazer ações (pode ficar para uma etapa posterior).
-   Exibir uma biblioteca de assets pesquisável.

### Construção modular

O cenário deverá poder ser montado com peças reutilizáveis, como:

-   Pisos.
-   Paredes.
-   Portas.
-   Janelas.
-   Escadas.
-   Colunas.
-   Telhados.
-   Plataformas.
-   Cercas.
-   Elementos de terreno.

O uso de peças modulares facilita a criação de ambientes personalizados
e evita que o mestre precise modelar estruturas inteiras.

### Importação de modelos

O formato **GLB (glTF Binary)** é o candidato principal para importação
inicial, por ser adequado ao uso na web e permitir transportar
geometria, materiais e texturas em um único arquivo.

A aplicação deverá validar arquivos importados e lidar com modelos
grandes de maneira cuidadosa.

------------------------------------------------------------------------

## 7. Biblioteca de assets gratuitos

A aplicação deverá permitir que o usuário mantenha uma biblioteca de
modelos 3D local e reutilizável.

### Fontes iniciais para pesquisa

-   [Quaternius](https://quaternius.com/) --- pacotes de modelos e
    assets para jogos.
-   [Kenney](https://kenney.nl/assets) --- assets gratuitos, com muitos
    pacotes sob CC0.
-   [Poly Haven](https://polyhaven.com/) --- modelos, texturas e HDRIs
    sob CC0.
-   [Sketchfab](https://sketchfab.com/) --- catálogo amplo; a licença
    deve ser verificada individualmente em cada modelo.

Esses sites são fontes para obter arquivos, não dependências
obrigatórias da aplicação.

### Regras de licenciamento

-   Verificar a licença de cada asset antes de incluí-lo no projeto.
-   Não presumir que um modelo gratuito pode ser redistribuído.
-   Registrar, quando possível, a origem, o autor e a licença do asset.
-   Priorizar CC0 ou licenças que permitam o uso pretendido.
-   Manter assets de terceiros separados do código-fonte.
-   Não incluir no repositório modelos cuja licença não permita
    redistribuição.

### Categorias iniciais da biblioteca

-   Construções e estruturas.
-   Pisos e paredes.
-   Móveis.
-   Decorações.
-   Natureza.
-   Iluminação.
-   Objetos mágicos.
-   Props narrativos.
-   Texturas e materiais.
-   Efeitos visuais.

------------------------------------------------------------------------

## 8. Ambientação

A ambientação é um dos principais diferenciais do produto.

### Recursos desejados

-   Luzes posicionáveis.
-   Intensidade e cor da iluminação.
-   Sombras, conforme o custo de desempenho.
-   Névoa.
-   Partículas.
-   Efeitos visuais ambientais.
-   Sons ambientes.
-   Música de fundo.
-   Controles rápidos para ativar e desativar efeitos.

### Estados de cena

Uma mesma cena poderá ter diferentes configurações salvas.

Exemplo: **Floresta**

-   Dia: iluminação clara e ambiente tranquilo.
-   Noite: iluminação baixa e sons noturnos.
-   Tempestade: chuva, névoa e trovões.
-   Floresta amaldiçoada: iluminação alterada, partículas e áudio
    específico.

O mestre deverá conseguir alternar entre esses estados durante a sessão.

------------------------------------------------------------------------

## 9. Painel do mestre

A aplicação deverá ter uma interface prática para controlar a
apresentação.

Elementos previstos:

-   Lista de cenas da campanha.
-   Acesso à biblioteca de assets.
-   Controles de câmera.
-   Controles de iluminação.
-   Controles de efeitos ambientais.
-   Controles de áudio.
-   Acesso a personagens e artes 2D.
-   Ações para revelar ou ocultar elementos.
-   Alternância entre estados de uma cena.

O painel deve evitar excesso de informação e permitir que o mestre faça
alterações rapidamente enquanto narra.

------------------------------------------------------------------------

## 10. Tecnologias candidatas

A preferência é por tecnologias gratuitas, open source e compatíveis com
desenvolvimento web.

  Tecnologia          Responsabilidade
  ------------------- --------------------------------------------------
  Next.js             Estrutura da aplicação
  React               Interface
  TypeScript          Tipagem e lógica
  Three.js            Renderização 3D
  React Three Fiber   Integração entre React e Three.js
  Drei                Componentes e utilitários para React Three Fiber
  Blender             Modelagem e edição de assets 3D
  PostgreSQL          Persistência futura (hoje: SQLite local)
  GLB / glTF          Formato principal de modelos 3D

### Observações

-   A stack ainda é uma proposta inicial e pode ser ajustada durante um
    protótipo técnico.
-   Não é necessário instalar ou operar PostgreSQL no primeiro
    protótipo.
-   O armazenamento local pode ser usado inicialmente para validar o
    editor.
-   A aplicação deve manter separadas a interface, a lógica de edição e
    a representação da cena 3D.
-   Evitar criar um motor gráfico próprio: utilizar Three.js.

------------------------------------------------------------------------

## 11. Estratégia de custo: objetivo de R\$ 0

**Requisito central:** desenvolver e testar o projeto sem custos
obrigatórios, sempre que possível.

### Práticas para manter o custo baixo

1.  Utilizar ferramentas open source.
2.  Priorizar assets gratuitos com licenças compatíveis.
3.  Não depender de geração de modelos por IA paga.
4.  Não depender de APIs pagas.
5.  Desenvolver e executar localmente no início.
6.  Salvar cenas e arquivos localmente durante o MVP.
7.  Adiar hospedagem, multiplayer e infraestrutura online.
8.  Usar planos gratuitos somente quando houver necessidade real.

### Custos potenciais futuros

Mesmo com software gratuito, hospedagem, armazenamento, tráfego, domínio
e serviços externos podem gerar custos quando o projeto crescer. Nenhum
serviço pago deve ser adotado sem avaliar uma alternativa gratuita ou
local.

------------------------------------------------------------------------

## 12. Desempenho e limitações de hardware

O desenvolvimento deve considerar computadores sem placa de vídeo
dedicada.

Diretrizes:

-   Priorizar modelos 3D leves.
-   Evitar excesso de polígonos.
-   Otimizar texturas.
-   Carregar assets sob demanda.
-   Evitar manter modelos desnecessários na memória.
-   Controlar a quantidade e o custo de luzes e sombras.
-   Permitir reduzir a qualidade gráfica.
-   Testar cenários progressivamente mais complexos.
-   Não assumir que todos os usuários terão GPU dedicada.

O objetivo é que o tabletop seja utilizável em hardware modesto, ainda
que com limites de qualidade e complexidade.

------------------------------------------------------------------------

## 13. MVP --- primeira versão funcional

A primeira versão deve validar a experiência central: **montar um
ambiente 3D, salvar e apresentá-lo**.

### Escopo do MVP

-   [x] Criar uma aplicação web local.
-   [x] Exibir uma cena 3D com câmera controlável.
-   [x] Implementar visão geral/isométrica e aproximação
    cinematográfica.
-   [x] Adicionar um piso inicial.
-   [x] Importar modelos GLB.
-   [x] Inserir modelos na cena.
-   [x] Selecionar objetos.
-   [x] Mover, girar e redimensionar objetos.
-   [x] Duplicar e excluir objetos.
-   [x] Criar uma biblioteca local de assets.
-   [x] Salvar a composição da cena.
-   [x] Carregar uma cena salva.
-   [x] Criar controles básicos de iluminação.
-   [ ] Testar desempenho com uma pequena taverna.

### Critério de sucesso do MVP

O MVP será considerado validado quando for possível montar uma pequena
taverna utilizando modelos prontos, salvar o cenário, reabri-lo e
navegar pela cena com as duas perspectivas de câmera.

Não é necessário ter multiplayer, contas, nuvem ou sistemas de RPG para
atingir esse objetivo.

------------------------------------------------------------------------

## 14. Roadmap sugerido

### Fase 0 --- Preparação técnica

-   [ ] Criar repositório.
-   [x] Configurar Next.js e TypeScript.
-   [x] Instalar Three.js, React Three Fiber e Drei.
-   [x] Criar uma página com uma cena 3D mínima.
-   [ ] Testar desempenho no computador de desenvolvimento.

### Fase 1 --- Visualizador 3D

-   [x] Câmera e controles.
-   [x] Piso e iluminação básica.
-   [x] Importação de GLB.
-   [x] Carregamento e descarregamento de modelos.

### Fase 2 --- Editor básico

-   [x] Seleção de objetos.
-   [x] Transformações: mover, girar e redimensionar.
-   [x] Duplicação e exclusão.
-   [x] Biblioteca de assets.
-   [x] Salvamento e carregamento local.

### Fase 3 --- Ambientação

-   [x] Luzes configuráveis.
-   [x] Névoa.
-   [x] Partículas simples.
-   [x] Áudio ambiente.
-   [x] Estados alternativos da cena.

### Fase 4 --- Apresentação para sessões

-   [x] Modo de apresentação.
-   [x] Painel do mestre.
-   [x] Artes 2D dos personagens.
-   [x] Troca rápida de cenas.
-   [x] Controles rápidos de ambientação.

### Fase 5 --- Evolução

Possibilidades futuras, a priorizar conforme o uso real:

-   [ ] Mais ferramentas de construção modular.
-   [x] Agrupamento e organização de objetos.
-   [ ] Desfazer e refazer.
-   [x] Atalhos de teclado.
-   [ ] Mais efeitos ambientais.
-   [x] Exportação e importação de projetos.
-   [ ] Compartilhamento de cenas.
-   [ ] Multiplayer, somente se houver necessidade.

------------------------------------------------------------------------

## 15. Decisões já tomadas

  -----------------------------------------------------------------------
  Tema                                Decisão
  ----------------------------------- -----------------------------------
  Propósito                           Ambientação visual de sessões de
                                      RPG

  Referência conceitual               Owlbear Rodeo, mas com cenários 3D

  Câmera                              Híbrida: visão geral e perspectiva
                                      cinematográfica

  Personagens                         Artes 2D; modelos 3D não são
                                      necessários

  Movimento de personagens            Fora do escopo inicial

  Combate e regras                    Fora do escopo inicial

  Cenários                            Construídos com peças modulares e
                                      modelos importados

  Formato 3D                          GLB / glTF como primeira opção

  Custo                               Meta de R\$ 0 no desenvolvimento
                                      inicial

  Prioridade                          Editor de cenário, ambientação,
                                      salvamento e apresentação

  Multiplayer                         Adiado
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 16. Questões em aberto

Estas decisões ainda precisam ser discutidas antes de fechar uma
arquitetura definitiva:

-   [ ] O tabletop será usado em uma única tela compartilhada
    presencialmente, remotamente ou nos dois formatos?
-   [x] A câmera será controlada apenas pelo mestre?
-   [ ] Os jogadores verão a mesma tela do mestre ou haverá uma tela de
    apresentação separada?
-   [x] O cenário será construído em escala livre ou terá grade
    opcional?
-   [ ] O estilo visual padrão será realista, estilizado, dark fantasy
    ou livre por campanha?
-   [x] As artes 2D dos personagens aparecerão em cartões laterais,
    sobre o cenário ou em ambos?
-   [x] O salvamento será inicialmente em arquivos locais, IndexedDB ou
    outro mecanismo?
-   [x] Como serão organizados os pacotes de assets e seus metadados?
-   [x] O mestre poderá criar cenas alternativas e transições entre
    elas?

------------------------------------------------------------------------

## 17. Primeira tarefa recomendada

Não começar pelo editor completo.

A primeira entrega técnica deve ser extremamente pequena:

1.  Criar um projeto Next.js com TypeScript.
2.  Instalar React Three Fiber e Drei.
3.  Renderizar um piso 3D.
4.  Adicionar uma câmera com controles de rotação e zoom.
5.  Carregar um único arquivo GLB.
6.  Testar a fluidez no computador de desenvolvimento.

Depois disso, adicionar seleção e manipulação do modelo.

**Primeiro objetivo concreto:** colocar uma mesa, algumas cadeiras e uma
fonte de luz em uma cena 3D e conseguir navegar ao redor dela.

Quando isso funcionar, começa a construção do editor de verdade.

------------------------------------------------------------------------

## 18. Definição resumida

O Tabletop 3D é uma ferramenta web, personalizável e de baixo custo para
mestres de RPG criarem e apresentarem cenários tridimensionais.
Inspirado na praticidade de virtual tabletops como Owlbear Rodeo, o
projeto prioriza construção de ambientes, importação de modelos, câmera
híbrida, ambientação cinematográfica e exibição de artes 2D de
personagens. Não pretende ser um jogo nem automatizar regras: pretende
ser um palco visual para a narrativa.

**Direção do projeto: construir primeiro uma ferramenta pequena, útil e
funcional; expandir somente quando uma necessidade real aparecer.**


------------------------------------------------------------------------

## 19. Créditos e licenças

- **Código do projeto:** licença MIT (arquivo `LICENSE`).
- **Modelos 3D:** todos CC0 1.0 (domínio público), criados por
  [Quaternius](https://quaternius.com/). Cada pasta de `public/models/` traz o
  `LICENSE.txt` do autor. Os pacotes usados são:
  - Medieval Village MegaKit (`medieval`)
  - Modular SciFi MegaKit (`scifi`)
  - Ultimate Fantasy RTS (`rts`)
  - Ultimate Nature Pack (`natureza-lowpoly`, convertido de OBJ para GLB)
  - Ultimate Stylized Nature (`natureza-estilizada`, com texturas reduzidas)
- CC0 não exige crédito, mas o apoio ao autor é bem-vindo.
- **Bibliotecas:** Next.js, React, Three.js, React Three Fiber, Drei, Zustand e Lucide.
