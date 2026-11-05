# Tabletop 3D · Plano de sprints

- **Projeto:** Tabletop 3D
- **Chave:** TT3D
- **Descrição:** Editor e apresentador de cenários 3D para mestres de RPG, construído à mão para aprender.

## 1. Contexto

### 1.1 Fonte

- Documento de visão: `README.md` (v0.1).
- Este arquivo organiza o roadmap do README em sprints executáveis.

### 1.2 Regra do projeto

- O código é escrito à mão por quem está aprendendo.
- Cada tarefa descreve o que construir e o que estudar. Não traz código pronto.
- Quando travar: colar o código, descrever o sintoma e pedir revisão.

### 1.3 Como ler

| Termo | Significado |
|---|---|
| Sprint | Bloco que termina com algo visível funcionando |
| Pontos | Esforço relativo (1 · 2 · 3 · 5 · 8) |
| Crítica | Sem isso o resto não anda |
| Baixa | Pode ser adiada sem prejuízo |

### 1.4 Stack instalada

| Tecnologia | Versão | Responsabilidade |
|---|---|---|
| Next.js | 16 | Estrutura da aplicação |
| React | 19 | Interface |
| TypeScript | 7 | Tipagem e lógica |
| Three.js | 0.187 | Renderização 3D |
| React Three Fiber | 9 | React ↔ Three.js |
| Drei | 10 | Componentes prontos para o R3F |
| Zustand | 5 | Estado da cena |
| SQLite (node:sqlite) | embutido no Node 24 | Banco de dados local |

## 2. Mapa do README → sprints

| Requisito (seção do README) | Sprint |
|---|---|
| Cena 3D com câmera controlável (13, 14 Fase 0) | 1 |
| Piso e iluminação básica (14 Fase 1) | 1 |
| Câmera híbrida: isométrica e cinematográfica (4) | 1 |
| Importar e carregar GLB (6, 14 Fase 1) | 1, 4 |
| Estado da cena separado da interface (10) | 2 |
| Selecionar, mover, girar, escalar (6) | 3 |
| Duplicar e excluir (6) | 3 |
| Biblioteca local de assets e licenças (7) | 4 |
| Salvar e carregar cena (6, 13) | 5 |
| Taverna de teste e desempenho (12, 13) | 5 |
| Luzes, névoa, partículas, áudio (8) | 6 |
| Estados alternativos da cena (8) | 6 |
| Modo de apresentação e painel do mestre (9) | 7 |
| Artes 2D de personagens (5) | 7 |
| Grupos, travar, atalhos (14 Fase 5) | Acréscimo, ver seção 6 |
| Desfazer/refazer (14 Fase 5) | Fora do escopo |
| Multiplayer, contas, nuvem, combate (2) | Fora do escopo |

## 3. Decisões

### 3.1 Já tomadas

| Tema | Decisão |
|---|---|
| Stack | Next.js + React + TypeScript + R3F + Drei |
| Estado da cena | Zustand |
| Formato 3D | GLB (os pacotes do projeto usam glTF; a importação aceita só GLB) |
| Câmera | Híbrida (isométrica e perspectiva), com zoom suave e pontos salvos |
| Escala | Livre, com encaixe opcional em passos |
| Armazenamento | Banco local SQLite em `data/` e exportação/importação em `.json` |
| Personagens | Artes 2D: cartão lateral na apresentação e figura em pé na cena |
| Áudio | Arquivos locais (MP3, OGG, WAV, M4A, FLAC, WebM) |
| Custo | R$ 0 |
| Multiplayer | Adiado |

### 3.2 Em aberto

| Questão | Resolver em |
|---|---|
| Estilo visual padrão | Sprint 4 |
| Tela do mestre separada da tela dos jogadores | Sprint 7 |
| Nuvem (ex.: Supabase) para sincronizar entre computadores | Depois do MVP |

## 4. Pontos de atenção

- Licença de cada asset deve ser verificada antes de uso.
- Assets de terceiros ficam fora do código-fonte e do repositório quando a licença não permitir redistribuição.
- Computador sem GPU dedicada: medir desempenho a cada sprint.
- Git é executado só pelo dono do projeto.

---

## Sprint 0 — Fundamentos e decisões

- **Status:** Ativo
- **Objetivo:** Entender os conceitos de 3D e React que o projeto usa e fechar as decisões de arquitetura.
- **Critério de aceite:**
  - Você consegue explicar Canvas, mesh, geometria, material e luz sem consultar.
  - As três decisões em aberto da seção 3.2 para este sprint estão registradas.
- **Depende de:** —

### Tarefas

- [ ] Estudar os conceitos básicos de Three.js
  - **Prioridade:** Crítica
  - **Pontos:** 3

  Ler a documentação oficial do Three.js e do R3F.

  - [ ] Entender cena, câmera e renderer
  - [ ] Entender mesh como geometria mais material
  - [ ] Entender o sistema de coordenadas (Y para cima)
  - [ ] Entender rotação em radianos
- [ ] Estudar os conceitos de React usados no projeto
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [ ] Componentes e props
  - [ ] useState e useRef
  - [ ] Diferença entre componente de servidor e de cliente no Next.js
  - [ ] Quando usar a diretiva use client
- [x] Rodar o projeto e ver a página inicial
  - **Prioridade:** Crítica
  - **Pontos:** 1

  - [x] Executar npm run dev
  - [x] Abrir localhost:3000
  - [x] Entender a estrutura de pastas src/app
- [x] Limpar o arquivo scene.tsx
  - **Prioridade:** Alta
  - **Pontos:** 1

  - [x] Remover os imports automáticos incorretos
  - [x] Manter só o essencial para recomeçar
- [x] Decidir biblioteca de estado, escala e formato de salvamento
  - **Prioridade:** Alta
  - **Pontos:** 2

  - [x] Comparar Zustand, Context e useReducer
  - [x] Escolher escala livre ou grade
  - [x] Escolher JSON, IndexedDB ou ambos
  - [x] Anotar as escolhas e o motivo na seção 3 deste arquivo

---

## Sprint 1 — Visualizador 3D

- **Status:** Ativo
- **Objetivo:** Uma página com piso, luz, câmera controlável e um modelo GLB carregado.
- **Critério de aceite:**
  - A cena roda de forma fluida no computador de desenvolvimento.
  - Dá para girar, aproximar e afastar a câmera.
  - Um GLB aparece sobre o piso.
  - Dá para alternar entre visão isométrica e perspectiva.
- **Depende de:** Sprint 0

### Tarefas

- [x] Criar o componente Scene com um Canvas vazio
  - **Prioridade:** Crítica
  - **Pontos:** 2

  - [x] Marcar o arquivo como componente de cliente
  - [x] Dar altura ao elemento pai na página
  - [x] Ver a área do Canvas na tela
- [x] Desenhar uma caixa de teste com iluminação
  - **Prioridade:** Crítica
  - **Pontos:** 2

  - [x] Criar um mesh com geometria e material
  - [x] Adicionar luz ambiente
  - [x] Adicionar luz direcional
  - [x] Entender por que sem luz o objeto fica preto
- [x] Adicionar controle de câmera com o mouse
  - **Prioridade:** Crítica
  - **Pontos:** 1

  - [x] Usar OrbitControls do Drei
  - [x] Limitar o ângulo para não passar por baixo do piso
  - [x] Limitar zoom mínimo e máximo
- [x] Criar o piso da cena
  - **Prioridade:** Alta
  - **Pontos:** 2

  - [x] Plano deitado com rotação em radianos
  - [x] Material e cor
  - [x] Opção de grade visual
- [x] Carregar um modelo GLB
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Baixar um modelo CC0 de Kenney ou Quaternius
  - [x] Colocar o arquivo em public/models
  - [x] Carregar com useGLTF
  - [x] Tratar o estado de carregamento
  - [x] Ajustar escala e posição do modelo
- [x] Implementar a câmera híbrida
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Câmera ortográfica para a visão de maquete
  - [x] Câmera em perspectiva para a visão próxima
  - [x] Botão para alternar entre as duas
  - [x] Manter o ponto de foco ao alternar
- [ ] Medir desempenho da cena
  - **Prioridade:** Média
  - **Pontos:** 1

  - [ ] Ver FPS no computador de desenvolvimento
  - [ ] Anotar o resultado

---

## Sprint 2 — Estado e modelo de dados

- **Status:** Concluído
- **Objetivo:** A cena passa a ser descrita por dados, e a interface 3D apenas desenha esses dados.
- **Critério de aceite:**
  - Adicionar um item à lista de dados faz o objeto aparecer na cena.
  - Alterar a posição no estado move o objeto.
  - A estrutura de dados é serializável em JSON.
- **Depende de:** Sprint 1

### Tarefas

- [x] Definir os tipos TypeScript da cena
  - **Prioridade:** Crítica
  - **Pontos:** 3

  - [x] Tipo do objeto com id, modelo, posição, rotação e escala
  - [x] Tipo da cena com lista de objetos
  - [x] Tipo do projeto com lista de cenas
  - [x] Garantir que tudo é serializável, sem funções nem instâncias do Three.js
- [x] Criar o store de estado
  - **Prioridade:** Crítica
  - **Pontos:** 3

  - [x] Instalar a biblioteca escolhida no Sprint 0
  - [x] Guardar a lista de objetos
  - [x] Guardar o id do objeto selecionado
- [x] Criar as ações do store
  - **Prioridade:** Crítica
  - **Pontos:** 3

  - [x] Adicionar objeto
  - [x] Remover objeto
  - [x] Atualizar transformação
  - [x] Duplicar objeto
- [x] Renderizar a cena a partir do estado
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Componente que recebe um objeto e desenha o modelo
  - [x] Percorrer a lista e desenhar todos
  - [x] Usar o id como key
- [x] Criar um painel temporário para testar as ações
  - **Prioridade:** Média
  - **Pontos:** 2

  - [x] Botões de adicionar e remover
  - [x] Campos numéricos de posição

---

## Sprint 3 — Editor básico

- **Status:** Concluído
- **Objetivo:** Selecionar um objeto na cena e manipulá-lo com o mouse.
- **Critério de aceite:**
  - Clicar em um objeto o seleciona e mostra destaque.
  - Mover, girar e redimensionar funcionam e atualizam o estado.
  - Duplicar e excluir funcionam.
  - Clicar no vazio remove a seleção.
- **Depende de:** Sprint 2

### Tarefas

- [x] Selecionar objetos por clique
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Tratar o evento de clique do R3F
  - [x] Impedir que o clique atravesse para objetos atrás
  - [x] Limpar a seleção ao clicar no fundo
- [x] Destacar o objeto selecionado
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Escolher uma técnica de destaque leve
  - [x] Testar em máquina sem GPU dedicada
- [x] Mover, girar e redimensionar com o gizmo
  - **Prioridade:** Crítica
  - **Pontos:** 8

  - [x] Usar TransformControls do Drei
  - [x] Alternar entre os três modos
  - [x] Desativar a câmera enquanto arrasta
  - [x] Gravar o resultado no estado ao soltar o mouse
- [x] Ajustar valores com precisão
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Painel de propriedades do objeto selecionado
  - [x] Campos numéricos para posição, rotação e escala
  - [x] Converter graus e radianos
- [x] Duplicar e excluir o objeto selecionado
  - **Prioridade:** Alta
  - **Pontos:** 2

  - [x] Botões no painel
  - [x] Tecla Delete para excluir
- [x] Encaixar objetos em uma grade
  - **Prioridade:** Baixa
  - **Pontos:** 3

  - [x] Opção de ligar e desligar o encaixe
  - [x] Tamanho do passo configurável

---

## Sprint 4 — Biblioteca de assets

- **Status:** Concluído
- **Objetivo:** Uma biblioteca local de modelos, com busca, categorias e registro de licença.
- **Critério de aceite:**
  - O usuário importa um arquivo GLB e ele aparece na biblioteca.
  - Clicar em um item da biblioteca o insere na cena.
  - Cada asset tem origem, autor e licença registrados.
- **Depende de:** Sprint 3

### Tarefas

- [x] Definir o formato de metadados do asset
  - **Prioridade:** Crítica
  - **Pontos:** 2

  - [x] Nome, categoria, arquivo, miniatura
  - [x] Origem, autor e licença
- [x] Reunir um pacote inicial de modelos
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Baixar modelos de taverna: mesa, cadeira, barril, vela, balcão
  - [x] Conferir a licença de cada pacote
  - [x] Registrar os metadados
- [x] Importar um GLB pelo navegador
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Seletor de arquivo
  - [x] Validar extensão e tamanho
  - [x] Tratar arquivo inválido sem quebrar a aplicação
- [x] Guardar os assets importados localmente
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Escolher onde guardar os arquivos importados
  - [x] Recarregar os assets ao reabrir a página
- [x] Criar a tela da biblioteca
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Lista por categoria
  - [x] Campo de busca
  - [x] Inserir na cena ao clicar
- [x] Carregar modelos sob demanda
  - **Prioridade:** Média
  - **Pontos:** 3

  - [x] Não manter na memória o que não está na cena
  - [x] Liberar recursos ao remover o último uso

---

## Sprint 5 — Salvar, carregar e validar o MVP

- **Status:** Ativo
- **Objetivo:** Montar uma pequena taverna, salvar, reabrir e navegar pelas duas câmeras.
- **Critério de aceite:**
  - Uma taverna com mesas, cadeiras e luz é montada com assets da biblioteca.
  - Salvar e reabrir devolve a cena idêntica.
  - As duas perspectivas de câmera funcionam na cena carregada.
  - Desempenho aceitável no computador de desenvolvimento.
- **Depende de:** Sprint 4

### Tarefas

- [x] Salvar a cena
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Converter o estado em JSON
  - [x] Gravar conforme a decisão do Sprint 0
  - [x] Nomear e listar cenas salvas
- [x] Carregar uma cena salva
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Ler o JSON e validar a estrutura
  - [x] Tratar arquivo corrompido ou de versão antiga
  - [x] Recriar os objetos na cena
- [x] Guardar a câmera e a luz na cena salva
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Posição e modo da câmera
  - [x] Parâmetros das luzes
- [x] Controles básicos de iluminação
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Intensidade e cor da luz ambiente
  - [x] Posição e intensidade das luzes pontuais
- [x] Montar a taverna de teste
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Piso e estrutura
  - [x] Mesas, cadeiras, balcão, barris
  - [x] Velas e lareira com luz quente
- [ ] Homologar o MVP
  - **Prioridade:** Crítica
  - **Pontos:** 3

  - [x] Montar, salvar e reabrir a taverna
  - [x] Navegar com a câmera isométrica
  - [x] Navegar com a câmera em perspectiva
  - [ ] Registrar o FPS obtido
  - [x] Atualizar o checklist do MVP no README

---

## Sprint 6 — Ambientação

- **Status:** Concluído
- **Objetivo:** A cena ganha atmosfera: luzes configuráveis, névoa, partículas, som e estados.
- **Critério de aceite:**
  - Névoa e partículas podem ser ligadas e desligadas.
  - Áudio ambiente toca e para por controle.
  - Uma cena tem pelo menos dois estados (ex.: dia e noite) e dá para alternar.
- **Depende de:** Sprint 5

### Tarefas

- [x] Configurar luzes por objeto
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Inserir luzes como objetos da cena
  - [x] Editar cor, intensidade e alcance
  - [x] Limitar a quantidade de luzes por custo
- [x] Ativar sombras com controle de qualidade
  - **Prioridade:** Média
  - **Pontos:** 3

  - [x] Ligar e desligar sombras
  - [x] Medir o custo no FPS
- [x] Adicionar névoa
  - **Prioridade:** Alta
  - **Pontos:** 2

  - [x] Cor e densidade configuráveis
- [x] Criar partículas simples
  - **Prioridade:** Média
  - **Pontos:** 5

  - [x] Fumaça, poeira ou chuva
  - [x] Quantidade configurável
- [x] Reproduzir áudio ambiente e música
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Importar arquivos de áudio
  - [x] Volume e repetição
  - [x] Respeitar a regra do navegador de exigir interação antes de tocar
- [x] Criar estados alternativos da cena
  - **Prioridade:** Alta
  - **Pontos:** 8

  - [x] Modelar o que muda entre estados: luz, névoa, áudio, objetos visíveis
  - [x] Salvar vários estados na mesma cena
  - [x] Alternar entre estados
- [x] Opção de qualidade gráfica
  - **Prioridade:** Média
  - **Pontos:** 3

  - [x] Níveis baixo, médio e alto
  - [x] Ajustar sombras, partículas e resolução

---

## Sprint 7 — Apresentação para sessões

- **Status:** Ativo
- **Objetivo:** Um modo de apresentação com painel do mestre para uso durante a sessão.
- **Critério de aceite:**
  - Um modo de apresentação mostra a cena sem as ferramentas de edição.
  - O mestre troca de cena, câmera e estado em poucos cliques.
  - Artes 2D de personagens podem ser exibidas e ocultadas.
- **Depende de:** Sprint 6

### Tarefas

- [x] Criar o modo de apresentação
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Esconder gizmos, grade e painéis de edição
  - [x] Alternar entre edição e apresentação
  - [x] Tela cheia
- [x] Criar o painel do mestre
  - **Prioridade:** Crítica
  - **Pontos:** 5

  - [x] Lista de cenas da campanha
  - [x] Controles de câmera, luz, efeitos e áudio
  - [x] Interface enxuta para uso durante a narração
- [x] Salvar pontos de câmera
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Guardar posição e foco
  - [x] Transição suave entre pontos
- [x] Trocar de cena rapidamente
  - **Prioridade:** Alta
  - **Pontos:** 3

  - [x] Carregar a próxima cena sem tela travada
- [x] Exibir artes 2D de personagens
  - **Prioridade:** Alta
  - **Pontos:** 5

  - [x] Importar imagem com nome e descrição
  - [x] Exibir e ocultar durante a cena
  - [x] Decidir cartão lateral, sobre a cena ou ambos
- [x] Revelar e ocultar elementos da cena
  - **Prioridade:** Média
  - **Pontos:** 3

  - [x] Marcar objetos como ocultos
  - [x] Alternar a visibilidade na apresentação
- [ ] Decidir se a tela de apresentação é separada
  - **Prioridade:** Média
  - **Pontos:** 2

  - [ ] Avaliar uma segunda janela sincronizada no mesmo computador

---

## 5. Riscos

| Risco | Resposta |
|---|---|
| Desempenho fraco sem GPU dedicada | Medir a cada sprint; oferecer qualidade gráfica reduzida |
| Modelos pesados travam a cena | Limitar tamanho na importação; carregar sob demanda |
| Licença incompatível em um asset | Registrar licença no Sprint 4; não versionar o que não permitir |
| Escopo crescer antes do MVP | Só entra no MVP o que está nos sprints 1 a 5 |
| Travar em conceito de 3D ou React | Voltar ao Sprint 0; pedir revisão do código |
| Dados salvos quebrarem após mudar o formato | Guardar número de versão no JSON |

## 6. Acréscimos ao plano

Itens feitos que não estavam nos sprints originais.

| Acréscimo | O que faz |
|---|---|
| Banco SQLite local | Guarda catálogo, cenas, modelos, artes e sons em `data/`, no lugar do IndexedDB |
| Tipo e estilo dos assets | Filtros por estilo (Medieval, Sci-Fi...) e tipo, com nomes em português |
| Grupos e travas | Agrupar objetos, mover o grupo inteiro, travar para não selecionar nem mexer |
| Luzes móveis | Sol e luzes pontuais são objetos que se arrastam na cena |
| Pontos de câmera | Enquadramentos salvos, com viagem suave entre eles |
| Revelar e ocultar | Oculta grupos e objetos na edição e na apresentação |
| Nova cena vazia | Botão para começar do zero |
| Contador de FPS | FPS, chamadas de desenho e triângulos na tela |
| Cena de exemplo | Taverna montada com os assets do projeto |
| Áudio com fade | Trilhas com volume, repetição e transição suave, ligadas aos estados da cena |
| Packs de natureza e RTS | Fantasy RTS (128 prédios), Nature Pack (150) e Stylized Nature (36): 680 assets no total |
| Escala padrão por pack | O catálogo define o tamanho de entrada na cena (o RTS entra 4 vezes maior) |
| Conversor OBJ para GLB | `scripts/obj-para-glb.mjs` converte packs sem glTF, sem precisar do Blender |
| Otimizador de glTF | `scripts/otimizar-gltf.mjs` reduz texturas e remove mapas de relevo (103 MB viraram 5 MB) |
| Pintar o chão | Pincel com 8 materiais (grama, terra, areia, neve, pedra, lama, cascalho, musgo), cor lisa, borracha, tamanho, opacidade, borda, desfazer e preencher; a pintura é salva com a cena |
| Céu | Presets (dia, amanhecer, entardecer, noite, nublado, tempestade), cores livres e estrelas; entra nos estados da cena |
| Interface nova | Tema escuro com barra superior, biblioteca à esquerda e painel à direita em abas (Cena, Mundo, Mídia) |
| Cenas de exemplo | "Taverna do Javali": exterior, salão e quartos, com estados Dia, Entardecer, Noite e Tempestade; arquivos em `exemplos/` |
| Cena de exemplo: Innsmouth | Ilha-cidade vista de longe, sombria e nebulosa, com porto, praça, Ordem Esotérica de Dagon, farol, refinaria, igreja, cemitério e recife; estados Crepúsculo cinzento, Noite sem lua, Maré de tempestade e Ritual de Dagon; arquivo em `exemplos/` |

