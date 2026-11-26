# Glossary

_[Português](pt-BR/GLOSSARIO.md) | English_

> **Who this is for:** anyone reading the code or the conversations around it and meeting a word that means something specific here.
> **What is here:** each term as it appears in the code, what it is, and where it lives.
> **Where to go for the rest:** the fields of each format in [REFERENCE.md](REFERENCE.md#formats), the flows in [ARCHITECTURE.md](ARCHITECTURE.md).

The new code is in Portuguese and the engine that came from RoqueOS keeps its English names, so both appear ([`CONTRIBUTING.md`](../CONTRIBUTING.md)).

| Term                 | What it is                                                                                              | Where                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Lousa                | the repository and the code name; on screen the app is Quadro Branco / Whiteboard                       | [`package.json`](../package.json), [`app.json`](../app.json)          |
| `whiteboard`         | the permanent app id; RoqueOS finds windows, shortcuts and boards by it                                 | [`app.json`](../app.json), [`src/index.js`](../src/index.js)          |
| `sistema`            | the object RoqueOS (or `yarn dev`, or the tests) hands to `montar`; every capability goes through it    | [`src/index.js`](../src/index.js)                                     |
| capacidade           | an optional piece of the `sistema` the app declares: `colecoes`, `ia`, `arquivos`, `anexos`, `abertura` | `capacidades` in [`app.json`](../app.json)                            |
| quadro               | a board: one document in the `quadros` collection, `{ name, elements, view }`                           | [`src/quadros.js`](../src/quadros.js)                                 |
| índice               | the `whiteboards` document of the `indice` collection: the board list and the last one opened           | [`src/quadros.js`](../src/quadros.js)                                 |
| elemento             | one thing on the board: shape, line, stroke, text, sticky note or image                                 | [`src/elements.js`](../src/elements.js)                               |
| anexo                | an image kept by the system for this app, referenced by id; the address never reaches the app           | `sistema.anexos`, [`src/useLousa.js`](../src/useLousa.js)             |
| `.rosboard`          | the board saved as a file in Documents, `version: 2`, images embedded                                   | `saveRosboard` in [`src/useLousa.js`](../src/useLousa.js)             |
| abertura             | the capability through which Finder hands a `.rosboard` to the app (double click, "open with")          | `abre` in [`app.json`](../app.json)                                   |
| `soNaMemoria`        | true for a guest or an E2E session: nothing is written to the account                                   | [`src/useLousa.js`](../src/useLousa.js)                               |
| convidado            | guest, no account; the board lives in memory and images are embedded                                    | [`src/useLousa.js`](../src/useLousa.js)                               |
| desenho do convidado | what a guest drew before signing in with the window open; it becomes a new board in the account         | `adotarDesenhoDoConvidado` in [`src/useLousa.js`](../src/useLousa.js) |
| dizimação            | dropping half of the points of long freehand strokes so the board fits under 900 KB                     | `decimateForSave` in [`src/useLousa.js`](../src/useLousa.js)          |
| `commit()`           | one history step plus a scheduled save; not a git commit                                                | [`src/useLousa.js`](../src/useLousa.js)                               |
| janela estreita      | the narrow layout below 700 px: short bar, tools in a sheet                                             | `LARGURA_ESTREITA` in [`src/Lousa.vue`](../src/Lousa.vue)             |
| perfil leve          | the light profile of weak devices: no grid, no blur                                                     | `sistema.desempenho.modoLeve()`, [`src/index.js`](../src/index.js)    |
| janela falsa         | the RoqueOS-like window of the development system that `yarn dev` opens                                 | [`dev/main.js`](../dev/main.js)                                       |
| sistema falso        | the in-memory `sistema` of the app-sdk used by the tests                                                | [`test/lousa.spec.js`](../test/lousa.spec.js)                         |
| `app check`          | the SDK command that checks this repo against the RoqueOS app contract                                  | `yarn app:check`                                                      |
| paridade             | the inventory of what the app did inside RoqueOS and what happened to each item when it left            | [`paridade.json`](../paridade.json)                                   |
| `verificar`          | the gate: lint, format, tests, `app check`; also the name of the CI workflow                            | [`package.json`](../package.json)                                     |
| DCO                  | the `Signed-off-by` line every commit must carry                                                        | [`.github/workflows/dco.yml`](../.github/workflows/dco.yml)           |
| `migrateElement`     | the only place that reads the old element format                                                        | [`src/elements.js`](../src/elements.js)                               |
| `boardToText`        | the board as text for the AI panel, in reading order by rows                                            | [`src/elements.js`](../src/elements.js)                               |
