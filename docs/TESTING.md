# Testing

_[Português](pt-BR/TESTES.md) | English_

> **Who this is for:** whoever adds a feature or a fix and needs to know where its test goes and what the gate already proves.
> **What is here:** what each suite proves, the fakes they use, the acceptance criterion, and what no test here covers.
> **Where to go for the rest:** a red gate in [WHEN-IT-BREAKS.md](WHEN-IT-BREAKS.md#the-gate), the commands in [REFERENCE.md](REFERENCE.md#commands).

## Contents

1. [The acceptance criterion](#1-the-acceptance-criterion)
2. [The suites](#2-the-suites)
3. [Fakes and setup](#3-fakes-and-setup)
4. [What is not covered](#4-what-is-not-covered)

## 1. The acceptance criterion

```bash
yarn verificar
```

Green means lint clean, Prettier clean, every Vitest spec passing and `app check` ending in `ok, o repo cumpre o contrato.`. CI runs the same on every push to `main` and every pull request ([`.github/workflows/ci.yml`](../.github/workflows/ci.yml)). Every fix comes with a test that fails without it, and a new check is proven by mutation: break the code on purpose and show the test going red ([`CLAUDE.md`](../CLAUDE.md)). A visible change is also opened in `yarn dev` before it is called done ([`.claude/loop.md`](../.claude/loop.md)).

## 2. The suites

Counts measured on 18/11/2026 on `main` with `yarn test`: 8 files, 106 tests.

| File                                                  | Tests | What it proves                                                                                                                                                                                                                                      |
| ----------------------------------------------------- | ----- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`test/lousa.spec.js`](../test/lousa.spec.js)         | 55    | the engine with the fake system: pointer machine, boards in the account, text and sticky notes, selection box, what goes to the account and when, images and attachments, export and Save, opening a `.rosboard`                                    |
| [`test/app.spec.js`](../test/app.spec.js)             | 11    | the app through the SDK: manifest and capabilities match, the `abre` type, mount in the account and in the language, loading bar, language switch, AI panel, keyboard only when active, narrow and wide layouts, unmount releases everything, guest |
| [`test/elements.spec.js`](../test/elements.spec.js)   | 15    | element factories, normalization, migration of the old format, `boardToText`                                                                                                                                                                        |
| [`test/geometry.spec.js`](../test/geometry.spec.js)   | 11    | bounds, handles, rotation-aware hit test, move, resize, rotate                                                                                                                                                                                      |
| [`test/quadros.spec.js`](../test/quadros.spec.js)     | 5     | cleaning elements, byte estimate, ids, empty index, defaults on save                                                                                                                                                                                |
| [`test/serialize.spec.js`](../test/serialize.spec.js) | 4     | the SVG string and escaping                                                                                                                                                                                                                         |
| [`test/history.spec.js`](../test/history.spec.js)     | 4     | undo, redo, the cap                                                                                                                                                                                                                                 |
| [`test/pdf.spec.js`](../test/pdf.spec.js)             | 1     | the PDF bytes                                                                                                                                                                                                                                       |

The test titles are part of a contract: [`paridade.json`](../paridade.json) cites them as `test/<file> › <exact title>`, and RoqueOS rejects a version whose cited title no longer exists. Renaming a test means updating the inventory in the same commit.

## 3. Fakes and setup

| Piece                                                          | Where                                     | What it replaces                                                                |
| -------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------- |
| `criarSistemaFalso`, `criarBancoDeAnexos`                      | `@roqueos-apps/app-sdk/sistema-falso`     | the whole `sistema`: account, collections, attachments, files, notices, opening |
| `criarUrl`, `soltarUrl`, `reduzirImagem` options of `useLousa` | [`src/useLousa.js`](../src/useLousa.js)   | `URL.createObjectURL`, `revokeObjectURL` and the canvas reduction               |
| `ResizeObserver`, `matchMedia` no-ops                          | [`test/preparar.js`](../test/preparar.js) | what jsdom lacks                                                                |
| `enableAutoUnmount(afterEach)`                                 | [`test/preparar.js`](../test/preparar.js) | leftover listeners and timers between tests                                     |
| `server.deps.inline` for `@roqueos-apps/ui`                    | [`vite.config.js`](../vite.config.js)     | the ui kit arrives as `.vue` source and must go through the Vue plugin          |

## 4. What is not covered

- No browser test lives in this repo. Pixels, real pointer and touch, the clipboard and the real canvas export are not exercised by `yarn test`; jsdom has no canvas.
- No test runs against the real RoqueOS system. The system side is covered in RoqueOS, and the parity audit of 28/09/2026 notes that nothing was measured with a real session at that time ([`paridade.json`](../paridade.json), `auditoria`).
- `roqueos-docs` is not part of `yarn verificar`; documentation drift is caught only when someone runs it.
