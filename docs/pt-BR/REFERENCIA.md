# Referência

_Português | [English](../REFERENCE.md)_

> **Para quem:** quem precisa de um nome, número ou campo exato e não quer ler prosa.
> **O que tem aqui:** comandos, scripts, arquivos e pastas, configuração e constantes, atalhos de teclado, e os formatos gravados campo a campo.
> **Onde ir para o resto:** como as peças se ligam em [ARQUITETURA.md](ARQUITETURA.md), as capacidades do sistema em [INTEGRACOES.md](INTEGRACOES.md), os termos em [GLOSSARIO.md](GLOSSARIO.md).

## Sumário

1. [Comandos](#comandos)
2. [Scripts](#scripts)
3. [Arquivos e pastas](#arquivos-e-pastas)
4. [Configuração e constantes](#configuração-e-constantes)
5. [Teclado e ponteiro](#teclado-e-ponteiro)
6. [Formatos](#formatos)

## Comandos

Todos da raiz do repositório, com Yarn 1 ([`package.json`](../../package.json), `packageManager: yarn@1.22.22`).

| Comando                                           | O que faz                                                            | Exemplo                                |
| ------------------------------------------------- | -------------------------------------------------------------------- | -------------------------------------- |
| `yarn install --ignore-scripts`                   | instala as dependências sem rodar script de instalação nenhum        | primeiro passo depois do clone         |
| `yarn install --frozen-lockfile --ignore-scripts` | o mesmo, reprovando se o `yarn.lock` fosse mudar                     | o que o CI roda                        |
| `yarn dev`                                        | Vite em `http://localhost:5173/`, o app numa janela falsa do RoqueOS | `yarn dev`, depois `?idioma=ar-AR`     |
| `yarn verificar`                                  | lint, conferência de formato, testes e `app check`, nessa ordem      | o gate, antes de todo push             |
| `yarn test`                                       | `vitest run`, todo `test/**/*.spec.js`                               | `yarn test -t "rosboard"`              |
| `yarn lint`                                       | `eslint .`                                                           |                                        |
| `yarn format`                                     | `prettier --write .`                                                 | conserta o que o `format:check` aponta |
| `yarn format:check`                               | `prettier --check .` (Markdown incluído)                             |                                        |
| `yarn app:check`                                  | `app check`: o repo contra o contrato de app do RoqueOS              | `npx app check --json`                 |

## Scripts

| Script                                       | Entrada                                                                        | Saída                                                                                                                        | Códigos de saída                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `app check` (bin do `@roqueos-apps/app-sdk`) | a pasta atual, ou uma pasta como argumento; `--json`                           | uma linha por seção, `ok` ou `REPROVOU` com os problemas embaixo, depois `ok, o repo cumpre o contrato.` ou `N problema(s).` | 0 limpo, 1 qualquer problema, 2 uso errado         |
| `vitest run`                                 | o bloco `test` do [`vite.config.js`](../../vite.config.js)                     | uma linha por arquivo de spec e os totais                                                                                    | 0 verde, 1 qualquer falha                          |
| `prettier --check .`                         | [`.prettierrc`](../../.prettierrc), [`.prettierignore`](../../.prettierignore) | `[warn] <arquivo>` por arquivo fora do formato                                                                               | 0 limpo, 1 algo a formatar                         |
| `eslint .`                                   | [`eslint.config.js`](../../eslint.config.js)                                   | arquivo, linha, regra                                                                                                        | 0 limpo, 1 erros                                   |
| workflow `dco`                               | os commits do pull request                                                     | `::error::commit <sha> sem Signed-off-by...` por commit                                                                      | o job falha em qualquer commit sem `Signed-off-by` |

As seções do `app check`, como ele as imprimiu em 18/11/2026 neste repo: `scripts de instalação`, `manifesto`, `textos nos idiomas`, `origem dos assets`, `o app não fala com banco`, `o app não importa o RoqueOS`, `variáveis do sistema no contrato`, `capacidades opcionais declaradas`, `pastas declaradas`.

## Arquivos e pastas

| Caminho                                                | O que guarda                                                              | Quem escreve                                                            | Quem lê                                                         |
| ------------------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| [`app.json`](../../app.json)                           | o manifesto                                                               | você, raramente; o `id` nunca                                           | o RoqueOS, o `app check`, o `dev/main.js`, o `test/app.spec.js` |
| [`src/`](../../src/index.js)                           | o app                                                                     | você                                                                    | o build do RoqueOS, o Vite, o Vitest                            |
| [`i18n/`](../../i18n/pt-BR.json)                       | os textos da interface, um JSON por idioma, as mesmas chaves nos dez      | você                                                                    | o `src/textos.js`, o `app check`                                |
| [`paridade.json`](../../paridade.json)                 | o inventário de paridade: 86 itens, 73 `mantida`, 13 `mudou`, 0 `perdida` | você, no mesmo commit em que uma funcionalidade ou um teste citado muda | o RoqueOS antes de aceitar uma versão                           |
| [`dev/main.js`](../../dev/main.js)                     | a entrada do `yarn dev`                                                   | você                                                                    | o Vite, pelo [`index.html`](../../index.html)                   |
| [`test/`](../../test/preparar.js)                      | as specs do Vitest e o preparo do jsdom                                   | você                                                                    | o Vitest                                                        |
| [`ASSETS.md`](../../ASSETS.md)                         | origem e licença de cada arquivo de `public/` (não há `public/`)          | você                                                                    | o `app check`                                                   |
| [`CHANGELOG.md`](../../CHANGELOG.md)                   | Keep a Changelog, em português                                            | você                                                                    | as pessoas, o RoqueOS quando sobe a versão                      |
| [`docs/`](INDEX.md)                                    | esta documentação e a `capa.jpg`                                          | você                                                                    | as pessoas; não vai no pacote                                   |
| `docs/docs.json`, `docs/.docs-hash.json`               | o manifesto da documentação e os hashes dos pares revistos                | você; o `roqueos-docs --update`                                         | o `roqueos-docs`, o `roqueos-doctor`                            |
| [`.github/workflows/`](../../.github/workflows/ci.yml) | `verificar` e `dco`                                                       | o mantenedor                                                            | o GitHub Actions                                                |
| [`.nvmrc`](../../.nvmrc)                               | Node `24`                                                                 | o mantenedor                                                            | o `actions/setup-node`, o nvm                                   |
| `node_modules/`, `dist/`                               | saída da instalação e do build                                            | o Yarn, o Vite                                                          | ignorados pelo git                                              |

## Configuração e constantes

Não há variável de ambiente. O que muda o comportamento é a URL do `yarn dev` e constantes no código.

| Nome                                                                     | Padrão                                  | O que muda                                                                                                         |
| ------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `?idioma=<código>` no `yarn dev`                                         | o idioma do sistema de desenvolvimento  | abre num dos dez idiomas; `ar-AR` vira da direita para a esquerda                                                  |
| `?leve=1` no `yarn dev`                                                  | desligado                               | o perfil leve: sem malha, sem desfoque                                                                             |
| `?convidado=1` no `yarn dev`                                             | desligado                               | sem conta: o quadro vive na memória                                                                                |
| `?abertura=<json>` no `yarn dev`                                         | `{}`                                    | o pedido de abertura que o sistema de desenvolvimento entrega ([app-sdk](https://github.com/roqueos-apps/app-sdk)) |
| `window.__ROS_E2E__.whiteboard`                                          | ausente                                 | modo E2E: a lista é o quadro semeado, nada vai para a conta                                                        |
| `SAVE_DEBOUNCE` ([`src/useLousa.js`](../../src/useLousa.js))             | `800` ms                                | espera antes de gravar o quadro aberto                                                                             |
| `LIMITE_DO_QUADRO` ([`src/quadros.js`](../../src/quadros.js))            | `900_000` bytes                         | acima dele, dizimação; ainda acima, não grava                                                                      |
| `ID_DO_INDICE` ([`src/quadros.js`](../../src/quadros.js))                | `whiteboards`                           | o id do documento do índice; permanente                                                                            |
| `TAMANHO_MAXIMO_DE_ANEXO` (app-sdk)                                      | 10 MiB                                  | acima dele, a imagem é redesenhada menor antes do `anexos.guardar`                                                 |
| largura da imagem no quadro                                              | 480                                     | imagem mais larga encolhe mantendo a proporção                                                                     |
| zoom                                                                     | 0.1 a 8                                 | limites da roda, dos botões e da pinça                                                                             |
| `createBoardHistory({ max })` ([`src/history.js`](../../src/history.js)) | `60`                                    | passos de desfazer guardados                                                                                       |
| `LARGURA_ESTREITA` ([`src/Lousa.vue`](../../src/Lousa.vue))              | `700` px                                | abaixo dela, a janela estreita: barra curta, ferramentas na folha                                                  |
| `boardToText` ([`src/elements.js`](../../src/elements.js))               | `maxChars 12000`, `rowTolerance 60`     | o que o painel de IA recebe como contexto                                                                          |
| `janela` ([`app.json`](../../app.json))                                  | 1200 x 800, mínimo 400 x 300            | a janela que o RoqueOS abre                                                                                        |
| `TIPO_DO_ROSBOARD` ([`src/useLousa.js`](../../src/useLousa.js))          | `application/vnd.roqueos.rosboard+json` | o tipo do arquivo gravado, e o declarado em `abre`                                                                 |

## Teclado e ponteiro

Os atalhos só agem com a janela ativa e o foco fora de campo de texto ([`src/Lousa.vue`](../../src/Lousa.vue), `onKeyDown`).

| Tecla                                 | Ação                                                     |
| ------------------------------------- | -------------------------------------------------------- |
| `Ctrl` ou `Cmd` + `Z`                 | desfazer; com `Shift`, refazer                           |
| `Ctrl` ou `Cmd` + `Y`                 | refazer                                                  |
| `Ctrl` ou `Cmd` + `C`, `V`            | copiar, colar (deslocado 24 px)                          |
| `Ctrl` ou `Cmd` + `D`                 | duplicar a seleção                                       |
| `Ctrl` ou `Cmd` + `A`                 | selecionar tudo                                          |
| `Delete`, `Backspace`                 | apagar a seleção                                         |
| `Escape`                              | limpar a seleção                                         |
| `Espaço` apertado, botão do meio      | arrastar a vista                                         |
| `v` `h` `p` `b` `l` `a`               | selecionar, arrastar a vista, lápis, caneta, linha, seta |
| `r` `o` `t` `s` `e`                   | retângulo, elipse, texto, nota adesiva, borracha         |
| roda, pinça de dois dedos             | zoom em torno do ponteiro                                |
| duplo clique em texto ou nota adesiva | editar                                                   |

## Formatos

**Quadro** (coleção `quadros`, id `wb_<genId>`), gravado pelo `salvarQuadro` do [`src/quadros.js`](../../src/quadros.js):

| Campo          | Tipo                   | Sentido                                                 |
| -------------- | ---------------------- | ------------------------------------------------------- |
| `name`         | texto                  | nome do quadro; `Untitled` quando vazio                 |
| `elements`     | lista                  | os elementos abaixo, sem `_raw` e sem campo `undefined` |
| `view`         | `{ zoom, panX, panY }` | a vista a restaurar; `{ 1, 0, 0 }` por padrão           |
| `atualizadoEm` | carimbo de data        | carimbado pelo sistema, nunca pelo app                  |

**Índice** (coleção `indice`, documento `whiteboards`): `lastBoardId` (texto ou `null`) e `boards`, uma lista de `{ id, name }`.

**Elemento** ([`src/elements.js`](../../src/elements.js), `createElement`):

| Campo                           | Tipos                            | Sentido                                                                                        |
| ------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                            | todos                            | `el_<tempo em base36>_<seq>_<aleatório>`                                                       |
| `type`                          | todos                            | `rectangle`, `ellipse`, `diamond`, `line`, `arrow`, `pencil`, `pen`, `text`, `sticky`, `image` |
| `x`, `y`, `w`, `h`              | todos                            | a caixa em coordenadas do mundo, positiva depois de terminar                                   |
| `angle`                         | todos                            | graus em torno do centro da caixa                                                              |
| `stroke`, `strokeWidth`, `fill` | todos                            | `#1e1e1e`, `2`, `null` por padrão                                                              |
| `z`                             | todos                            | `0`; presente, não usado para ordenar (a ordem da lista é a ordem do desenho)                  |
| `points`                        | `pencil`, `pen`, `line`, `arrow` | lista plana de frações da caixa; o segmento tem quatro valores                                 |
| `text`, `fontSize`              | `text`, `sticky`                 | texto 24 por padrão, nota adesiva 18                                                           |
| `bg`                            | `sticky`                         | `#ffe27a` por padrão; a nota adesiva nasce com 180 x 180                                       |
| `src`                           | `image`                          | data URL (convidado, E2E, `.rosboard`) ou um endereço antigo; vazio com `anexo`                |
| `anexo`                         | `image`                          | id do anexo no `sistema.anexos`                                                                |

**`.rosboard`** (gravado pelo `saveRosboard`): `{ "version": 2, "name": texto, "elements": [...] }`, imagens embutidas como data URL e sem `anexo`. Abrir aceita qualquer objeto JSON com uma lista `elements`; elementos antigos passam pelo `migrateElement`.
