# Reference

_[Português](pt-BR/REFERENCIA.md) | English_

> **Who this is for:** whoever needs one exact name, number or field and does not want to read prose.
> **What is here:** commands, scripts, files and folders, configuration and constants, keyboard shortcuts, and the stored formats field by field.
> **Where to go for the rest:** how the pieces fit in [ARCHITECTURE.md](ARCHITECTURE.md), the system capabilities in [INTEGRATIONS.md](INTEGRATIONS.md), terms in [GLOSSARY.md](GLOSSARY.md).

## Contents

1. [Commands](#commands)
2. [Scripts](#scripts)
3. [Files and folders](#files-and-folders)
4. [Configuration and constants](#configuration-and-constants)
5. [Keyboard and pointer](#keyboard-and-pointer)
6. [Formats](#formats)

## Commands

All of them from the repository root, with Yarn 1 ([`package.json`](../package.json), `packageManager: yarn@1.22.22`).

| Command                                           | What it does                                                       | Example                             |
| ------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------- |
| `yarn install --ignore-scripts`                   | installs the dependencies with no install script running           | first step after cloning            |
| `yarn install --frozen-lockfile --ignore-scripts` | the same, failing if `yarn.lock` would change                      | what CI runs                        |
| `yarn dev`                                        | Vite on `http://localhost:5173/`, the app in a fake RoqueOS window | `yarn dev`, then `?idioma=ar-AR`    |
| `yarn verificar`                                  | lint, format check, tests and `app check`, in that order           | the gate, before every push         |
| `yarn test`                                       | `vitest run`, every `test/**/*.spec.js`                            | `yarn test -t "rosboard"`           |
| `yarn lint`                                       | `eslint .`                                                         |                                     |
| `yarn format`                                     | `prettier --write .`                                               | fixes what `format:check` points at |
| `yarn format:check`                               | `prettier --check .` (Markdown included)                           |                                     |
| `yarn app:check`                                  | `app check`: the repo against the RoqueOS app contract             | `npx app check --json`              |

## Scripts

| Script                                       | Input                                                                    | Output                                                                                                                        | Exit codes                                      |
| -------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| `app check` (bin of `@roqueos-apps/app-sdk`) | the current folder, or a folder argument; `--json`                       | one line per section, `ok` or `REPROVOU` with the problems under it, then `ok, o repo cumpre o contrato.` or `N problema(s).` | 0 clean, 1 any problem, 2 wrong usage           |
| `vitest run`                                 | [`vite.config.js`](../vite.config.js) `test` block                       | one line per spec file and the totals                                                                                         | 0 green, 1 any failure                          |
| `prettier --check .`                         | [`.prettierrc`](../.prettierrc), [`.prettierignore`](../.prettierignore) | `[warn] <file>` per badly formatted file                                                                                      | 0 clean, 1 something to format                  |
| `eslint .`                                   | [`eslint.config.js`](../eslint.config.js)                                | file, line, rule                                                                                                              | 0 clean, 1 errors                               |
| workflow `dco`                               | the commits of the pull request                                          | `::error::commit <sha> sem Signed-off-by...` per commit                                                                       | job fails on any commit without `Signed-off-by` |

The sections of `app check`, as it printed them on 18/11/2026 on this repo: `scripts de instalação`, `manifesto`, `textos nos idiomas`, `origem dos assets`, `o app não fala com banco`, `o app não importa o RoqueOS`, `variáveis do sistema no contrato`, `capacidades opcionais declaradas`, `pastas declaradas`.

## Files and folders

| Path                                                | What it holds                                                         | Who writes it                                                | Who reads it                                            |
| --------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------- |
| [`app.json`](../app.json)                           | the manifest                                                          | you, rarely; `id` never                                      | RoqueOS, `app check`, `dev/main.js`, `test/app.spec.js` |
| [`src/`](../src/index.js)                           | the app                                                               | you                                                          | RoqueOS build, Vite, Vitest                             |
| [`i18n/`](../i18n/en-US.json)                       | interface texts, one JSON per language, same keys in all ten          | you                                                          | `src/textos.js`, `app check`                            |
| [`paridade.json`](../paridade.json)                 | parity inventory: 86 items, 73 `mantida`, 13 `mudou`, 0 `perdida`     | you, in the same commit as a feature or a cited test changes | RoqueOS before accepting a version                      |
| [`dev/main.js`](../dev/main.js)                     | the `yarn dev` entry                                                  | you                                                          | Vite through [`index.html`](../index.html)              |
| [`test/`](../test/preparar.js)                      | Vitest specs and the jsdom setup                                      | you                                                          | Vitest                                                  |
| [`ASSETS.md`](../ASSETS.md)                         | origin and license of every file in `public/` (there is no `public/`) | you                                                          | `app check`                                             |
| [`CHANGELOG.md`](../CHANGELOG.md)                   | Keep a Changelog, in Portuguese                                       | you                                                          | people, RoqueOS when bumping                            |
| [`docs/`](INDEX.md)                                 | this documentation and `capa.jpg`                                     | you                                                          | people; not shipped in the package                      |
| `docs/docs.json`, `docs/.docs-hash.json`            | the documentation manifest and the hashes of the reviewed pairs       | you; `roqueos-docs --update`                                 | `roqueos-docs`, `roqueos-doctor`                        |
| [`.github/workflows/`](../.github/workflows/ci.yml) | `verificar` and `dco`                                                 | maintainer                                                   | GitHub Actions                                          |
| [`.nvmrc`](../.nvmrc)                               | Node `24`                                                             | maintainer                                                   | `actions/setup-node`, nvm                               |
| `node_modules/`, `dist/`                            | install and build output                                              | Yarn, Vite                                                   | ignored by git                                          |

## Configuration and constants

There are no environment variables. What changes behavior is the URL of `yarn dev` and constants in the code.

| Name                                                                  | Default                                 | What it changes                                                                                            |
| --------------------------------------------------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `?idioma=<code>` on `yarn dev`                                        | the language of the development system  | opens in one of the ten languages; `ar-AR` turns right to left                                             |
| `?leve=1` on `yarn dev`                                               | off                                     | the light profile: no grid, no blur                                                                        |
| `?convidado=1` on `yarn dev`                                          | off                                     | no account: the board lives in memory                                                                      |
| `?abertura=<json>` on `yarn dev`                                      | `{}`                                    | the opening request the development system hands over ([app-sdk](https://github.com/roqueos-apps/app-sdk)) |
| `window.__ROS_E2E__.whiteboard`                                       | absent                                  | E2E mode: the array is the seed board, nothing goes to the account                                         |
| `SAVE_DEBOUNCE` ([`src/useLousa.js`](../src/useLousa.js))             | `800` ms                                | wait before writing the open board                                                                         |
| `LIMITE_DO_QUADRO` ([`src/quadros.js`](../src/quadros.js))            | `900_000` bytes                         | above it, decimation; still above, no write                                                                |
| `ID_DO_INDICE` ([`src/quadros.js`](../src/quadros.js))                | `whiteboards`                           | the index document id; permanent                                                                           |
| `TAMANHO_MAXIMO_DE_ANEXO` (app-sdk)                                   | 10 MiB                                  | above it, the image is redrawn smaller before `anexos.guardar`                                             |
| image width on the board                                              | 480                                     | a wider image is scaled down keeping proportion                                                            |
| zoom                                                                  | 0.1 to 8                                | limits of wheel, buttons and pinch                                                                         |
| `createBoardHistory({ max })` ([`src/history.js`](../src/history.js)) | `60`                                    | undo steps kept                                                                                            |
| `LARGURA_ESTREITA` ([`src/Lousa.vue`](../src/Lousa.vue))              | `700` px                                | below it, the narrow layout: short bar, tools in a sheet                                                   |
| `boardToText` ([`src/elements.js`](../src/elements.js))               | `maxChars 12000`, `rowTolerance 60`     | what the AI panel receives as context                                                                      |
| `janela` ([`app.json`](../app.json))                                  | 1200 x 800, minimum 400 x 300           | the window RoqueOS opens                                                                                   |
| `TIPO_DO_ROSBOARD` ([`src/useLousa.js`](../src/useLousa.js))          | `application/vnd.roqueos.rosboard+json` | type of the saved file, and the one declared in `abre`                                                     |

## Keyboard and pointer

Shortcuts only act while the window is active and the focus is not in a text field ([`src/Lousa.vue`](../src/Lousa.vue), `onKeyDown`).

| Key                                 | Action                                        |
| ----------------------------------- | --------------------------------------------- |
| `Ctrl` or `Cmd` + `Z`               | undo; with `Shift`, redo                      |
| `Ctrl` or `Cmd` + `Y`               | redo                                          |
| `Ctrl` or `Cmd` + `C`, `V`          | copy, paste (24 px offset)                    |
| `Ctrl` or `Cmd` + `D`               | duplicate the selection                       |
| `Ctrl` or `Cmd` + `A`               | select all                                    |
| `Delete`, `Backspace`               | delete the selection                          |
| `Escape`                            | clear the selection                           |
| `Space` held, middle button         | pan the view                                  |
| `v` `h` `p` `b` `l` `a`             | select, pan, pencil, pen, line, arrow         |
| `r` `o` `t` `s` `e`                 | rectangle, ellipse, text, sticky note, eraser |
| wheel, two-finger pinch             | zoom around the pointer                       |
| double click on text or sticky note | edit it                                       |

## Formats

**Board** (collection `quadros`, id `wb_<genId>`), written by `salvarQuadro` in [`src/quadros.js`](../src/quadros.js):

| Field          | Type                   | Meaning                                                           |
| -------------- | ---------------------- | ----------------------------------------------------------------- |
| `name`         | string                 | board name; `Untitled` when empty                                 |
| `elements`     | array                  | the elements below, without `_raw` and without `undefined` fields |
| `view`         | `{ zoom, panX, panY }` | the view to restore; `{ 1, 0, 0 }` by default                     |
| `atualizadoEm` | timestamp              | stamped by the system, never by the app                           |

**Index** (collection `indice`, document `whiteboards`): `lastBoardId` (string or `null`) and `boards`, an array of `{ id, name }`.

**Element** ([`src/elements.js`](../src/elements.js), `createElement`):

| Field                           | Types                            | Meaning                                                                                        |
| ------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------- |
| `id`                            | all                              | `el_<time base36>_<seq>_<random>`                                                              |
| `type`                          | all                              | `rectangle`, `ellipse`, `diamond`, `line`, `arrow`, `pencil`, `pen`, `text`, `sticky`, `image` |
| `x`, `y`, `w`, `h`              | all                              | the box in world coordinates, positive after finishing                                         |
| `angle`                         | all                              | degrees around the box center                                                                  |
| `stroke`, `strokeWidth`, `fill` | all                              | `#1e1e1e`, `2`, `null` by default                                                              |
| `z`                             | all                              | `0`; present, not used for ordering (array order is the drawing order)                         |
| `points`                        | `pencil`, `pen`, `line`, `arrow` | flat array of fractions of the box; segments have four values                                  |
| `text`, `fontSize`              | `text`, `sticky`                 | text 24 by default, sticky note 18                                                             |
| `bg`                            | `sticky`                         | `#ffe27a` by default; sticky notes start at 180 x 180                                          |
| `src`                           | `image`                          | data URL (guest, E2E, `.rosboard`) or an old address; empty with `anexo`                       |
| `anexo`                         | `image`                          | attachment id in `sistema.anexos`                                                              |

**`.rosboard`** (saved by `saveRosboard`): `{ "version": 2, "name": string, "elements": [...] }`, images embedded as data URLs and without `anexo`. Opening accepts any JSON object with an `elements` array; older elements go through `migrateElement`.
