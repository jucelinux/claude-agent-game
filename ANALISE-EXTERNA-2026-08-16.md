# Análise externa — 16/08/2026

_Escrita a seu pedido, de fora do método: sem Taste Loop, sem STE-100, sem o papel de
executor do projeto. Quatro perguntas suas, quatro seções, mais uma sobre o processo de
colaboração que você levantou na nota avulsa. Fontes externas citadas no final._

---

## 1. Você está avançando no seu propósito?

**Sim — e mais rápido do que o próprio repositório deixa transparecer.** Vale nomear um
fato que os documentos não enfatizam: este projeto inteiro tem **três dias** (14–16/08).
Nesses três dias saíram 81 commits, 17 mil linhas de TypeScript, 410 locks verdes, 17 runs,
5 micro games jogáveis e 7 capacidades novas de desenho (z-buffer, primitiva lobada, taper,
squash, yaw, roll, cut). Quando você diz "já estou a várias runs e me sinto travado", parte
disso é compressão temporal: você está medindo o progresso em runs, e runs aqui duram horas.
Em tempo de calendário, a velocidade é excepcional.

Separando por subsistema, porque o avanço não é uniforme:

**Onde o avanço é real e composto:**

- **O harness é a parte mais valiosa do repo, e está praticamente pronto.** Simulação
  determinística, canal de percepção textual, canal de achados (findings), replay de input,
  locks que compilam veredito em teste. Isso é exatamente o que um agente precisa para
  construir um jogo sem um humano no loop — e é a parte que **nenhum concorrente tem**.
  Ferramentas de arte por IA existem aos montes; um harness onde o agente *verifica o
  próprio jogo* praticamente não existe no mercado.
- **O padrão "miss é especificação" está funcionando de verdade.** A tabela é eloquente:
  membro sumido → z-buffer; "ficou horrível" na árvore → primitiva lobada; "não é uma
  caveira" → subtração (`cut`); astronauta de costas → yaw completo. Cada falha virou
  vocabulário permanente. Isso é o oposto de girar em círculos.
- **O custo por peça está caindo.** Batch 2: 1 ciclo, 3 leituras. Batch 4: 1 ciclo, 1
  leitura, sem ida-e-volta. Essa é a métrica que você declarou como risco central, e ela
  está melhorando.

**Onde o avanço é mais lento do que parece:**

- **O gate tem n=4.** Hit rate 2/4 não diz quase nada — nem a favor, nem contra. Com
  amostras desse tamanho, qualquer leitura de tendência é ruído. O que os batches produzem
  de valioso hoje não é a taxa; é a especificação que cada miss carrega.
- **A qualidade de superfície ("parece a coisa que deveria ser") avança por correção do
  seu olho, não por capacidade do modelo.** Os dados do próprio repo: 14 defeitos achados
  por contagem, 10 achados só por você — e os 10 seus são todos da classe "não parece o que
  é". Essa classe não está diminuindo por batch. Ela é o gargalo real, e trato dela na
  seção 3.

**Veredito da seção: o propósito "suíte de gamedev para agentes" está avançando. O
sub-propósito "Claude como desenhista" avançou muito em estrutura e animação, e está num
platô previsível em correspondência visual — previsível porque o método atual terceiriza
essa verificação para o oráculo mais caro que existe: você.**

---

## 2. Deveria considerar outras abordagens?

Minha resposta é: **não troque a abordagem; troque uma premissa dentro dela.**

A escolha central do projeto — desenho como satisfação de restrições sobre uma gramática,
animação como transformação de partes ancoradas, nunca retoque de pixel — está **certa e é
fronteira genuína**. Nenhuma ferramenta de difusão entrega o que essa arquitetura entrega:
determinismo, editabilidade por agente, consistência entre frames de graça, um sprite que é
*dado* e não *imagem*. Para o produto que você declarou (engine dirigida por agente), essa é
a aposta correta e eu a manteria.

A premissa que eu trocaria é **a cegueira do loop interno**. E aqui os dados do seu próprio
repositório já discordam da regra:

1. A divisão medida em 16/08 é categórica: contagem acha defeitos de **execução**; olho acha
   defeitos de **correspondência**. O canal cego, por construção, nunca vai achar a segunda
   classe — a intenção não está nos pixels, como o check `swallowed` provou.
2. O único olhar permitido da rodada 4 pegou **três defeitos de cena que nenhum instrumento
   via** (weave invisível no asfalto, ausência de sombra de contato, escala).
3. Todos os misses do gate até hoje foram, no fundo, de correspondência: a caveira que não
   era caveira, o visor virado para a câmera, o solo lunar que era "chão preto com pedras".

Ou seja: **a classe de defeito que decide o veredito dele é exatamente a classe que o canal
não enxerga.** A regra da cegueira foi adotada porque funcionou em outros repos, e a
justificativa dela (forçar todo conserto para a gramática) é válida — mas há uma
confusão entre dois mecanismos: a cegueira impedia o *retoque*; ela não é o que faz o
conserto ser *estrutural*. Hoje o retoque já é impossível por arquitetura (não existe outra
coisa a editar além da gramática). A cegueira ficou pagando um custo sem entregar mais o
benefício que a justificava.

A literatura recente aponta na mesma direção: os trabalhos de 2025–26 sobre geração de
gráficos por código (RefineSVG, Render-in-the-Loop, RLRF, ReLook) mostram ganhos
consistentes quando o modelo **vê o render e corrige o código** em loop fechado — que é
precisamente o arranjo "olha, mas só conserta pela gramática". A emenda de 16/08 (um olhar
por rodada, só para decidir se embarca) foi um passo nessa direção; minha recomendação é
acelerá-la, com a proposta concreta na seção 3.

**Outras abordagens que avaliei e NÃO recomendo trocar:**

- **Difusão como pipeline** (Retro Diffusion, PixelLab): entregam superfície bonita e
  animação rasa, mas quebram tudo que faz seu produto ser um produto — determinismo, locks,
  edição por agente, consistência de conjunto. Como *pipeline*, não. Como *referência
  visual* que o agente olha, sim (seção 3).
- **Fine-tuning de um modelo para pixel art**: custo alto, ganho incerto, e mata a tese do
  projeto — que um agente de código *geral* constrói jogos. Se precisar de fine-tuning, a
  tese já falhou.
- **Multi-agente para produção**: o método já responde certo — o gargalo é validação, não
  produção. Mais produção é estoque.

---

## 3. O travamento no "bom desenhista" — o que eu faria

Primeiro, um reenquadramento estratégico honesto: **desenho é a parte menos defensável do
seu produto, e verificação é a mais defensável.** O mercado de arte por IA é lotado e bom;
o mercado de "agente que constrói e verifica um jogo inteiro" é quase vazio. Se o Claude
chegar a "desenhista bom o suficiente, consistente e animável" — e ele já está perto disso
para corpos e cenas — o produto se sustenta mesmo sem ele virar um artista excepcional.
Vale calibrar quanto do seu orçamento de atenção esse subsistema merece.

Dito isso, dá para subir o teto. Quatro movimentos, em ordem de retorno esperado:

**3.1 — Visão estruturada no bench loop (a mudança de maior alavancagem).**
Deixe o modelo ver o render *durante* a iteração, dezenas de vezes por rodada, mantendo
duas regras invioláveis: (a) todo conserto entra pela gramática — que já é a única
superfície editável; (b) o canal de contagem continua rodando, porque ele acha o que o olho
não acha (o membro ausente não deixa rastro na imagem). O custo é de 1–2 mil tokens por
olhada contra rodadas de centenas de milhares — desprezível. A medição que decide se pagou:
a classe "correspondência" aparecendo nos *seus* feedbacks deve cair. Se em 3 batches os
seus misses continuarem sendo "não parece a coisa", a mudança não pagou e volta-se atrás.
O experimento é barato, reversível e ataca exatamente o gargalo medido.

**3.2 — Referência visual na entrada, não só correção na saída.**
A caveira falhou em parte porque o modelo nunca *olhou* uma caveira de pixel art antes de
autorar. Hoje `refs/` é gitignorado e referência é coisa que só você olha. Inverta: para
cada encomenda, o agente busca/recebe 2–3 referências visuais (fotos, arte CC0 tipo Kenney,
ou até saída de Retro Diffusion usada *só como referência*) e extrai delas **especificações
estruturais** — proporções, marcos, razões ("o crânio é 2× a caixa torácica", "as órbitas
ocupam ⅓ da face") — que entram na gramática como números ancorados. Isso mantém o
no-retouching intacto e ataca o miss antes de ele chegar em você. É o que você mesmo fez
verbalmente na árvore ("variação no tronco, na ramificação, na circunferência da copa") —
sistematizado.

**3.3 — Colheita inversa: ajustar a gramática a arte existente.**
O render é determinístico e roda em ~50–170 ms. Isso permite *inverse graphics*: pegar um
sprite sheet CC0 bom, e otimizar os parâmetros da gramática até a silhueta e o mapa de
valores baterem. O que se colhe não é a imagem — são **proporções, paletas e curvas de
timing como dados**, exatamente no espírito "harvest, don't design". Hoje o único professor
de gosto do sistema é você, um veredito por vez; isso adicionaria um segundo professor que
não gasta a sua atenção.

**3.4 — Busca no espaço da gramática, com os locks como fitness.**
Vocês já construíram, sem nomear assim, uma função de fitness: os locks + o findings
channel. Com render barato e espaço discreto, uma busca populacional (N variantes de
tunables, seleção pelos instrumentos, olhar multimodal só nos finalistas) explora o espaço
que hoje o modelo explora um palpite por vez. É o "probe de 4 amostras" do método,
industrializado para dezenas.

O que **não** subiria o teto: mais primitivas especulativas (o método está certo — espere o
miss especificar), mais locks de execução (essa classe já está bem coberta), mais rodadas
do loop atual esperando resultado diferente.

---

## 4. Feedback honesto sobre o projeto

**O que é genuinamente excepcional** — e digo isso tendo visto muitos projetos
humano-agente: a disciplina de transformar veredito em estrutura (knob/lock/prosa) é rara e
funciona; o registro de previsões *antes* do seu olhar, com pontuação depois, é honestidade
epistêmica que quase ninguém pratica; "miss é especificação" é a melhor regra do repo; e a
deleção de 16/08 (962 linhas, segunda superfície inteira) mostra uma saúde que projetos de
3 dias nunca têm. O CLAUDE.md deste repo é um dos documentos de colaboração humano-agente
mais sofisticados que já li.

Agora os riscos, sem amaciar:

**R1 — O método está ficando caro em relação ao produto.** São ~250 KB de prosa de método e
registro contra 17 mil linhas de código. Cada sessão fria precisa ler ~100 KB antes da
primeira linha de código, e uma fração relevante de cada rodada é gasta mantendo a
narrativa do método — previsões, vieses, ledger, decisões em estilo literário. Esse estilo
(frases-aforismo, referências cruzadas densas, ironia estruturada) é bonito e *eu* o
navego bem — mas note a assimetria: o repo exige STE-100 nos relatórios para você e escreve
seus próprios arquivos num barroco crescente. O teste decisivo que o próprio projeto
definiu — **um agente fresco, só com o repo, constrói um jogo?** — está adiado, e o estilo
dos documentos é hoje o maior risco de reprovação nesse teste. Sugestão barata: uma passada
de destilação separando *estado duro* (regras, números, contratos — em linguagem seca) de
*narrativa* (que vai para log e não precisa ser relida). Não porque a narrativa seja errada,
mas porque ela virou custo fixo de cada sessão.

**R2 — TASTE.md §2a/§2b descrevem um modelo, não "o modelo".** As entradas de viés e teto
de capacidade são observações do Opus em agosto de 2026. Um upgrade de modelo (este texto é
prova de que eles acontecem) invalida parte disso silenciosamente — o teto de "densidade de
articulação", por exemplo, pode simplesmente mudar. Vale marcar essas entradas com o modelo
que as produziu, como já se marca portable/stack, e re-testar as mais decisivas a cada troca.

**R3 — Você é o recurso em exaustão, e nada instrumenta isso.** O projeto mede o custo da
sua atenção por peça, mas três dias com 17 runs e dezenas de leituras é um ritmo que o
método declara insustentável por definição ("a parte sem fadiga não pode decidir quando
parar"). O risco simétrico existe: a parte *com* fadiga também não está medindo a própria.
Não proponho métrica — você já vetou isso, com razão. Proponho só que o ritmo de batches
seja uma decisão sua explícita, não uma consequência da disponibilidade do agente.

**R4 — A tese de mercado merece um teste mais cedo do que "quando o motor estiver pronto".**
"O GameMaker dos agentes" tem concorrência se formando (Rosebud, ferramentas de engine com
IA embutida), e o seu diferencial real — percepção de jogo rodando + verificação — só vira
diferencial quando alguém de fora o usa. O teste do agente fresco está adiado por decisão
sua, e a razão dada é boa; ainda assim, uma versão *mínima* dele (um agente fresco tenta
apenas *modificar* um micro game existente, não criar um) custaria uma tarde e informaria o
R1 e o produto ao mesmo tempo.

---

## 5. Sobre a sua nota: o modo "big bang" e a colaboração

Sua sensação está certa, e curiosamente o método já contém a regra que a valida — §3.6,
atribuibilidade — e o gate v3, ao comprar "uma frase, uma palavra", forçou o modo caixa-preta
como efeito colateral. O batch 1 voltando com cinco falhas em uma mensagem é exatamente a
acumulação que a regra proíbe.

O que eu montaria, aproveitando o que já existe:

1. **A prateleira já é o mecanismo de transparência — falta só cadência.** Toda rota
   renderiza do código atual a cada refresh. Ou seja: você *já pode* abrir `/skate` no meio
   de uma rodada e ver o estado. O que falta é o agente **anunciar marcos**: "o skatista
   está de pé na rota, ainda sem pista" — uma linha, sem pergunta anexada.
2. **Checkpoints assíncronos, nunca síncronos.** A ressalva do método é real: interrupção
   treina carimbo. A solução é o meio-termo: o agente publica o marco e **continua
   trabalhando**; você olha se e quando quiser; silêncio significa "prossiga"; um comentário
   seu entra como insight na rodada em andamento, não como leitura formal. Isso te dá a
   janela para os "insights valiosos que evitariam retrabalho" sem criar dependência da sua
   resposta.
3. **Fatiar a encomenda em features visíveis** — o esqueleto na cena → o ambiente → a
   mecânica → o polimento — com cada fatia aparecendo na rota quando fica de pé. Isso é a
   proposta "duas leituras" de 16/08 generalizada, e o número a observar continua sendo o
   que já foi definido: **suas notas ficam mais curtas?** Se cada nota sua passa a caber em
   uma linha porque chegou cedo, o processo pagou.

Isso não atrapalha a forma de construir — o agente já trabalha incrementalmente por baixo;
hoje ele só esconde os incrementos até o fim.

---

## Recomendações, em ordem

1. **Visão estruturada no bench loop** (3.1) — reversível, barato, ataca o gargalo medido.
   É a resposta principal para "me sinto travado em transformar o Claude num bom desenhista".
2. **Checkpoints assíncronos na prateleira** (5) — resolve o big bang sem violar as regras
   de atenção do método.
3. **Referências visuais na entrada de cada encomenda** (3.2) — mata a classe "não parece a
   coisa" antes dela chegar em você.
4. **Passada de destilação nos documentos** (R1) — estado seco separado de narrativa, antes
   que o teste do agente fresco chegue.
5. **Manter a gramática como está.** Não trocar por difusão, não parametrizar
   especulativamente, não retocar pixel. Essa fundação está certa.
6. **Guardar 3.3 e 3.4** (colheita inversa, busca populacional) para quando a atenção
   permitir — são multiplicadores, não urgências.

---

## 6. Pergunta final sua: o Taste Loop ainda é útil, ou atrapalha?

_Adicionada após sua pergunta de 16/08._

**Resposta curta: o núcleo do Taste Loop é o motivo de este projeto funcionar. A camada
meta dele virou custo. São coisas separáveis, e vale separá-las.**

O teste que uso para dividir: **o que cada parte do método produziu nestes três dias?**

**O núcleo — mantém, é ele que está pagando:**

- **Veredito compilado em lock.** 410 locks são o seu gosto transformado em estrutura que
  não evapora. O lock do joelho-dobra-para-um-lado pegou três clipes; o lock de ausência
  achou o membro invisível; o lock de transferência do yaw provou o que teria sido só
  alegação. Isso é o Taste Loop funcionando como projetado, e nenhum processo alternativo
  entrega isso.
- **Canal de percepção + achados.** Sem ele não há loop nenhum, só geração com checagem de
  sintaxe. É round zero do método e é a parte mais defensável do produto.
- **Miss como especificação.** A melhor regra do repo, e ela nasceu de uma correção sua
  *ao* método — o que mostra que o método aceita ser corrigido, que é sua melhor qualidade.
- **Perguntas binárias em lote, atribuibilidade.** É o que mantém seu custo por leitura
  baixo, e o batch 4 (um ciclo, uma leitura) é a prova.

**A camada meta — é aqui que está o atrito:**

- **O aparato de previsão.** Quatro previsões formais, quatro erradas — e cada erro gerou
  parágrafos de autoanálise em TASTE.md §2a que são individualmente interessantes e
  coletivamente um imposto. O propósito original (impedir veredito escrito antes do seu
  olhar) já foi atingido; hoje o ritual produz mais prosa do que correção. Uma linha de
  previsão bastaria.
- **O metabolismo de manutenção do método.** TASTE-LOOP-LEARNING, CHANGELOG, propostas
  numeradas, cycle open de oito itens, round close de quatro perguntas — para um projeto
  de uma pessoa e um agente, isso é governança de comitê. Note o placar: os *instrumentos*
  do método acertaram repetidamente; a *metacamada* falhou repetidamente (três gates
  desenhados, três aposentados sem rodar; o próprio método precisou de você para se
  corrigir todas as vezes). A parte que funciona é a barata; a parte que falha é a cara.
- **O estilo dos registros.** DECISIONS.md diz "never prose" no cabeçalho e tem 535 linhas
  de aforismos com negrito. É o log mais bonito que já li, e cada sessão fria paga por ele.

**O diagnóstico estrutural:** o Taste Loop foi desenhado para *polir qualidade em poucos
eixos* gastando o mínimo do seu julgamento — "late and narrow", nas palavras dele. Este
projeto o está usando como *sistema operacional de tudo*: gate, formato de entrega, língua
dos relatórios, cerimônia de abertura e fechamento. Nos eixos onde ele foi apontado como
projetado (a tinta, a silhueta, o peso do gorila), pagou. Onde ele virou administração de
si mesmo, cobra.

**O que eu faria:** congelar o método em vez de evoluí-lo — declarar o Taste Loop
"assentado" por algumas semanas, sem novas propostas, sem round close formal, sem
manutenção de §2a além de uma linha por evento. Manter locks, canal, misses-como-spec,
lotes binários. Se em três batches a falta da metacamada custar algo observável, ela volta
com essa evidência. Meu palpite: não vai custar nada, e vai liberar uma fração relevante
de cada rodada para o produto.

---

### Fontes externas consultadas

- [RefineSVG: Visual Feedback-Driven RL for Image-to-SVG Generation](https://arxiv.org/abs/2607.27699v1)
- [Render-in-the-Loop: Vector Graphics Generation via Visual Self-Feedback](https://arxiv.org/html/2604.20730v1)
- [Rendering-Aware Reinforcement Learning for Vector Graphics Generation (NeurIPS 2025)](https://papers.nips.cc/paper_files/paper/2025/file/57126328c3b40cf618a34f1c5df24d8a-Paper-Conference.pdf)
- [ReLook: Vision-Grounded RL with a Multimodal LLM Critic](https://arxiv.org/html/2510.11498v1)
- [Retro Diffusion vs PixelLab (2026)](https://gamedevaihub.com/retro-diffusion-vs-pixellab/)
- [Best AI pixel art generators 2026](https://spritelab.dev/guides/best-ai-pixel-art-generators)
- [Can LLMs Design a Language-to-Sprite Pipeline?](https://www.kokutech.com/blog/insights/technology-experiments/sprite-pipeline-with-llm-critics)
- [texel-studio — agente de pixel art por ferramentas, não difusão](https://github.com/EYamanS/texel-studio)
