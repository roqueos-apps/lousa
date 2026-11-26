# When it breaks

_[Português](pt-BR/QUANDO-QUEBRA.md) | English_

> **Who this is for:** whoever sees a red gate, a failed install or a person saying the board did not open.
> **What is here:** the first diagnostic command, then symptom, cause and fix by area, with the literal message. Messages printed by the tools are quoted as they appear, several of them in Portuguese.
> **Where to go for the rest:** what each suite proves in [TESTING.md](TESTING.md), the flows in [ARCHITECTURE.md](ARCHITECTURE.md), shipping in [OPERATIONS.md](OPERATIONS.md).

## Contents

1. [First, the diagnosis](#first-the-diagnosis)
2. [Installing](#installing)
3. [The gate](#the-gate)
4. [Using the app](#using-the-app)
5. [Shipping](#shipping)

## First, the diagnosis

```bash
node -v && yarn -v && yarn verificar
```

It tells in one run whether the toolchain is right and which step of the gate is red: lint, format, tests or `app check`, in that order. The first red one stops the rest.

## Installing

| What appears                                                                                                                | Cause                                                                                    | What to do                                                                                                                                                      |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `error @roqueos-apps/lousa@0.1.3: The engine "node" is incompatible with this module. Expected version ">=22". Got "20..."` | Node older than 22                                                                       | `nvm use` (reads [`.nvmrc`](../.nvmrc), Node 24) and install again                                                                                              |
| `Permission denied (publickey)` while fetching `@roqueos-apps/ui`                                                           | the dependency was pinned by `git+ssh`; CI has no key (measured on 29/09 in `verificar`) | fixed: it is `github:roqueos-apps/ui#v0.6.0` over HTTPS ([`CHANGELOG.md`](../CHANGELOG.md)). If it returns, check the line in [`package.json`](../package.json) |
| install changes `yarn.lock`, CI fails on `--frozen-lockfile`                                                                | a dependency changed without the lockfile in the commit                                  | `yarn install --ignore-scripts` and commit `yarn.lock` with the change                                                                                          |
| `npm` used by mistake creates `package-lock.json`                                                                           | this repo is Yarn 1                                                                      | delete `package-lock.json`, use `yarn`                                                                                                                          |

## The gate

| What appears                                                                          | Cause                                                                                                      | What to do                                |
| ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| `[warn] Code style issues found in the above file. Run Prettier with --write to fix.` | a file out of the Prettier format, Markdown included                                                       | `yarn format`, review the diff, commit    |
| `REPROVOU  textos nos idiomas` with `i18n/ja-JP.json sem: aiThemes`                   | a key missing in one language                                                                              | add the key in every `i18n/*.json`        |
| `REPROVOU  textos nos idiomas` with `com texto vazio em: a.b`                         | a key with a dot: `app check` reads the dot as a path                                                      | rename the key without a dot              |
| `REPROVOU  o app não importa o RoqueOS` or `o app não fala com banco`                 | an import outside `vue`, the SDK, the ui kit and this repo                                                 | go through a `sistema` capability instead |
| `test/app.spec.js` fails on `o id e as capacidades são os do manifesto`               | `CAPACIDADES` in [`src/index.js`](../src/index.js) and `capacidades` in [`app.json`](../app.json) disagree | change both together                      |
| a key shows instead of a label in a test                                              | `traduzir` returns the key when it is missing from the loaded texts                                        | add the key to the JSON files             |

## Using the app

| What appears                                                                                     | Cause                                                                                                       | What to do                                                                                                                        |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| "Error saving board" / "An unexpected error occurred" with Retry, on opening                     | reading the index or the board failed (network, session); the title reuses `saveError` though it was a read | Retry; nothing was written over the list. Covered by `falha ao ler o índice mostra o erro e NÃO cria um quadro por cima da lista` |
| "Couldn't open the board / Check your connection and try again. The open board stays as it was." | switching to another board failed                                                                           | try again; the open board keeps its id and content                                                                                |
| "Board simplified"                                                                               | the board passed 900 KB; long freehand strokes kept half of their points                                    | nothing: it was saved                                                                                                             |
| "Board too large / This board is too big to autosave..."                                         | still above 900 KB after decimation; nothing was written                                                    | delete elements or export; Save keeps a `.rosboard`                                                                               |
| "Could not add image"                                                                            | decoding failed, the attachment was refused, or the image does not fit even at 1024 px                      | try another image; the board was not changed                                                                                      |
| an image box is empty after opening                                                              | the attachment no longer exists or belongs to another account                                               | the rest of the board opens; paste the image again                                                                                |
| "Couldn't open the file / This file isn't a Whiteboard board, or it's damaged."                  | the file is not JSON or has no `elements` array                                                             | nothing changed; check the file                                                                                                   |
| "Couldn't open the file" without an account                                                      | the system reads files only with an account                                                                 | sign in, then open the file again                                                                                                 |

## Shipping

| What appears                                                                                           | Cause                                                        | What to do                                                                                       |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `::error::commit <sha> sem Signed-off-by. Refaça com: git commit --amend -s (ou git rebase --signoff)` | a commit of the pull request has no DCO line                 | `git rebase --signoff main` and push the branch again                                            |
| RoqueOS rejects the new version on `paridade.json`                                                     | a cited test was renamed or removed, or an item has no proof | fix `paridade.json` with the exact titles, cut a new tag                                         |
| RoqueOS still runs the old version                                                                     | the pin in the RoqueOS `package.json` was not moved          | move the pin in RoqueOS, in its own commit ([OPERATIONS.md](OPERATIONS.md#2-shipping-a-version)) |
