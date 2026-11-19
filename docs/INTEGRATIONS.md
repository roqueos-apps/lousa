# Integrations

_[Português](pt-BR/INTEGRACOES.md) | English_

> **Who this is for:** whoever changes how the Whiteboard talks to RoqueOS, or the RoqueOS side that hosts it.
> **What is here:** every `sistema` capability the app uses and for what, the files it exchanges, the AI panel actions, and what RoqueOS checks before accepting a version.
> **Where to go for the rest:** the contract itself is documented in the [app-sdk](https://github.com/roqueos-apps/app-sdk); the stored formats are in [REFERENCE.md](REFERENCE.md#formats).

## Contents

1. [The surface](#1-the-surface)
2. [Capabilities used](#2-capabilities-used)
3. [The AI panel](#3-the-ai-panel)
4. [Files in and out](#4-files-in-and-out)
5. [What RoqueOS checks](#5-what-roqueos-checks)

## 1. The surface

The app exposes one thing: the default export of [`src/index.js`](../src/index.js), built with `definirApp({ id: 'whiteboard', capacidades, montar })`, plus `./app.json` ([`package.json`](../package.json), `exports`). `montar(el, sistema, { ativo })` returns `{ ativar(sim), desmontar() }`. There is no HTTP API, CLI, MCP server or webhook. Everything else goes the other way: the app calls the system.

## 2. Capabilities used

| Capability   | Calls                                                                                        | What for                                                                    |
| ------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| `colecoes`   | `abrir('quadros')`, `abrir('indice')`, then `ler(id)`, `atualizar(id, campos)`, `apagar(id)` | boards one at a time, and the index ([`src/quadros.js`](../src/quadros.js)) |
| `anexos`     | `guardar(blob)` returns `{ id }`, `ler(id)` returns a Blob                                   | pasted images ([`src/useLousa.js`](../src/useLousa.js))                     |
| `arquivos`   | `salvar({ nome, conteudo, tipo, pasta: 'Documentos' })`, `ler(ref)`                          | Save as `.rosboard`, and reading the file Finder hands over                 |
| `abertura`   | `atual()`, `aoMudar(fn)`                                                                     | the `.rosboard` from Finder, at mount and while open                        |
| `ia`         | `abrirPainel({ ancora, tipo: 'read', contexto, acento, titulo, acoes, aoFechar })`           | the read-only AI panel ([`src/Lousa.vue`](../src/Lousa.vue))                |
| `identidade` | `atual().uid`, `aoMudar(fn)`                                                                 | account and account change                                                  |
| `idioma`     | `atual()`, `aoMudar(fn)`                                                                     | which of the ten text files to load ([`src/index.js`](../src/index.js))     |
| `desempenho` | `modoLeve()`                                                                                 | the light profile                                                           |
| `avisar`     | `avisar(mensagem, { tipo, titulo })`                                                         | notices; types `sucesso`, `info`, `aviso`, `erro`                           |
| `metricas`   | `evento('save')`                                                                             | the usage event, the same as before leaving the core                        |

The first five are optional and declared in `capacidades` of [`app.json`](../app.json); `app check` fails when the code uses one that is not declared. Failures come back as errors with a `codigo` from the SDK (`sem-conta`, `sem-rede`, `nao-encontrado`, `grande-demais` and others); the app logs `e?.codigo` and never the payload.

## 3. The AI panel

The panel belongs to the system. The app passes the context as a function, `boardToText(elements)`: only elements with text, in rows of 60 units, left to right, joined by `|`, cut at 12000 characters ([`src/elements.js`](../src/elements.js)). On top of the system's read-only catalog it adds two actions, labeled in the user's language:

| id      | Label (en-US)     | Prompt sent, in Portuguese like the system catalog                                      |
| ------- | ----------------- | --------------------------------------------------------------------------------------- |
| `temas` | Group into themes | group the ideas into themes with a short title each, answer only with the grouped list  |
| `acoes` | Extract actions   | extract concrete actions, one per line, starting with a verb, answer only with the list |

No agent, model choice or key reaches the app. The exact prompt strings are in [`src/Lousa.vue`](../src/Lousa.vue), `alternarIa`.

## 4. Files in and out

| Direction | What                    | Type                                            | Where                                                                          |
| --------- | ----------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------ |
| out       | `.rosboard` (Save)      | `application/vnd.roqueos.rosboard+json`         | `Documentos` through `arquivos.salvar`; a download for a guest                 |
| in        | `.rosboard` from Finder | declared in `abre` of [`app.json`](../app.json) | RoqueOS also recognizes the extension when it was stored as `application/json` |
| out       | PNG, SVG, PDF export    | `image/png`, `image/svg+xml`, `application/pdf` | browser download ([`src/export.js`](../src/export.js))                         |
| in        | image paste or drop     | any `image/*`                                   | becomes an `anexo` with an account, a data URL without                         |

## 5. What RoqueOS checks

RoqueOS installs the package by tag and runs, in its own repository (closed), the architecture test `apps-fora-do-nucleo` over the installed package: the app may only import `vue`, the SDK, the ui kit and its own files, and `paridade.json` must be valid, every cited test must exist with its exact title, and a lost feature needs a written decision. The same rules run here, partly, in `app check`. When RoqueOS adds a check, this repo learns it from a failure on the RoqueOS side, not from a check here.
