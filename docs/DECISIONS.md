# Decisions

_[Português](pt-BR/DECISOES.md) | English_

> **Who this is for:** an agent or a contributor about to "simplify" something that looks arbitrary.
> **What is here:** what was decided and is not reopened, with the date, the refused alternative and the reason, each pointing at where it is enforced.
> **Where to go for the rest:** the summary table in [ARCHITECTURE.md](ARCHITECTURE.md#8-design-decisions), the history in [`CHANGELOG.md`](../CHANGELOG.md).

## Contents

1. [Identity and storage](#1-identity-and-storage)
2. [Images](#2-images)
3. [Reading and failure](#3-reading-and-failure)
4. [Build and texts](#4-build-and-texts)
5. [Leaving the core](#5-leaving-the-core)

## 1. Identity and storage

**28/09/2026. The id `whiteboard`, the collections `quadros` and `indice`, and the index id `whiteboards` are permanent.** Refused: renaming them to match the repository name. RoqueOS finds the windows, shortcuts and boards of people who already use the app by these names; a rename loses them ([`CONTRIBUTING.md`](../CONTRIBUTING.md), [`src/quadros.js`](../src/quadros.js)).

**28/09/2026. The stored board format is additive.** Refused: renaming a field or changing its meaning. Boards are stored with today's fields; changing one erases what the person had. Old shapes are read in `migrateElement` and nowhere else ([`src/elements.js`](../src/elements.js)).

**28/09/2026. One board is read at a time with `ler(id)`.** Refused: observing the whole collection. A board gets close to the 1 MB per document limit of the database; observing would download all of them to show one ([`src/quadros.js`](../src/quadros.js)).

**Save after 800 ms, no realtime.** Refused: live collaboration in this version. The engine says collaboration is another version ([`src/useLousa.js`](../src/useLousa.js), header). No date is recorded for this one.

## 2. Images

**28/09/2026, version 0.1.0. With an account, an image is an attachment and the element keeps only its id.** Refused: embedding it in the board, which would hit 1 MB; and the old way, a file in the person's Pictures with the download address stored in the board. The image is the board's, not a file of the person, and the address must not be stored ([`CHANGELOG.md`](../CHANGELOG.md), 0.1.0).

**28/09/2026, version 0.1.1. A `.rosboard` carries the images inside.** Refused: keeping the attachment id in the file. Only the account that saved it opens the attachment, so whoever receives the file would get empty boxes.

**28/09/2026, version 0.1.1. An image above 10 MiB is redrawn smaller.** Refused: rejecting it. Inside RoqueOS the full image went to Pictures and the paste never failed; rejecting would lose a feature.

## 3. Reading and failure

**28/09/2026. A read error becomes the error screen, never "no boards".** Refused: treating a failure as an empty list. That path once created a new board and wrote the index with only it, over the person's list ([`CHANGELOG.md`](../CHANGELOG.md), 0.1.0; test `falha ao ler o índice mostra o erro e NÃO cria um quadro por cima da lista`).

**28/09/2026, version 0.1.1. A failed board switch keeps the open board and its id.** Refused: changing the id before reading. The screen kept the old board under the new id, and the next save copied one board over the other ([`src/useLousa.js`](../src/useLousa.js), `switchBoard`).

## 4. Build and texts

**25/09/2026, measured on the games. Texts load with `?raw` and `JSON.parse`.** Refused: importing JSON directly. The RoqueOS build breaks on a JSON import outside its own `src/i18n/`; that is also why [`src/index.js`](../src/index.js) repeats the capabilities of `app.json` and a test checks they match ([`src/textos.js`](../src/textos.js)).

**Text keys have no dot.** Refused: nested keys. `app check` reads the dot as a path ([`CLAUDE.md`](../CLAUDE.md)).

**From the RoqueOS theme, only the CSS variables of the SDK contract; the app colors are `--lousa-*`.** Refused: using RoqueOS styles directly, which do not exist outside RoqueOS ([`CLAUDE.md`](../CLAUDE.md)).

## 5. Leaving the core

**28/09/2026. No feature is lost when leaving the core.** The founder asked for it, and [`paridade.json`](../paridade.json) is the mechanism: 86 items, each proven by a test or evidence, a loss only with a written decision. None was lost.

**MIT and DCO for the apps of roqueos-apps.** A founder decision recorded in the `roqueos-kit` doctor check for open repositories, with no date in this repo. Every commit carries `Signed-off-by`, checked by the `dco` workflow ([`.github/workflows/dco.yml`](../.github/workflows/dco.yml)).
