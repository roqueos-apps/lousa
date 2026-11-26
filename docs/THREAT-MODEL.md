# Threat model

_[Português](pt-BR/MODELO-DE-AMEACAS.md) | English_

> **Who this is for:** whoever reviews a change that touches rendering, files, images, dependencies or CI.
> **What is here:** what the Whiteboard protects, from whom, the controls with the file that holds each one, and what it does not protect.
> **Where to go for the rest:** how to report a vulnerability in [`SECURITY.md`](../SECURITY.md), the flows in [ARCHITECTURE.md](ARCHITECTURE.md).

## Contents

1. [What is protected](#1-what-is-protected)
2. [Who the adversaries are](#2-who-the-adversaries-are)
3. [Controls](#3-controls)
4. [What is not protected](#4-what-is-not-protected)

## 1. What is protected

The Whiteboard runs on the same origin as RoqueOS. A script injected through it would run with the session of whoever opened the window. What is at stake is that session, the person's boards and attachments, and the integrity of the package RoqueOS installs.

## 2. Who the adversaries are

| Adversary                                                    | How it gets in                                              | What it wants                                    |
| ------------------------------------------------------------ | ----------------------------------------------------------- | ------------------------------------------------ |
| a crafted `.rosboard`                                        | someone sends a file, the person double-clicks it in Finder | run script through text or an image field        |
| text written on a board by another device of the same person | synced boards                                               | the same, through the board document             |
| a contributor's pull request from a fork                     | CI on `pull_request`                                        | read a secret or write to the repo through CI    |
| a compromised dependency                                     | install scripts, a moved tag                                | run code at install time or ship code to RoqueOS |
| another app or account                                       | an attachment id                                            | open an image that is not theirs                 |

## 3. Controls

| Control                                                                                                                                                           | Where it is enforced                                                                                                                  |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Board text reaches the DOM only as text: Vue interpolation on screen, `escapeXml` in the exported SVG                                                             | [`src/Lousa.vue`](../src/Lousa.vue), [`src/serialize.js`](../src/serialize.js), [`test/serialize.spec.js`](../test/serialize.spec.js) |
| An opened file must be JSON with an `elements` array, and every element goes through `migrateElement`; anything else is refused with a notice and nothing changes | [`src/useLousa.js`](../src/useLousa.js) `abrirArquivo`, test `o que não é quadro avisa, e os quadros ficam como estavam`              |
| No database or storage access of its own: collections and attachments are the system's; `app check` fails on a database or RoqueOS import                         | `app check`, sections `o app não fala com banco` and `o app não importa o RoqueOS`                                                    |
| Attachments by id; the storage address never reaches the app; the system keys attachments by account and app, so an id from another app or account opens nothing  | [`src/useLousa.js`](../src/useLousa.js), the app-sdk `anexos`                                                                         |
| The AI panel is the system's: no agent or key reaches the app, and the context is only the board text                                                             | [`src/Lousa.vue`](../src/Lousa.vue) `alternarIa`                                                                                      |
| CI on `pull_request`, never `pull_request_target`; `contents: read`; no secret                                                                                    | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml), [`.github/workflows/dco.yml`](../.github/workflows/dco.yml)                |
| No install script runs: `--ignore-scripts` locally and in CI; `app check` section `scripts de instalação`                                                         | [`.github/workflows/ci.yml`](../.github/workflows/ci.yml)                                                                             |
| Dependencies pinned by tag and locked by commit in `yarn.lock`; RoqueOS pins this app by exact tag                                                                | [`package.json`](../package.json), `yarn.lock`                                                                                        |
| Every merge reviewed by the maintainer; every commit signed off                                                                                                   | [`.github/CODEOWNERS`](../.github/CODEOWNERS), workflow `dco`                                                                         |
| Errors are logged by `codigo`, not by payload                                                                                                                     | `console.error('[lousa] ...', e?.codigo ?? e)` across [`src/useLousa.js`](../src/useLousa.js)                                         |

## 4. What is not protected

- An image `src` from an old board or a `.rosboard` is drawn as is. A data URL or an address in an SVG `<image>` does not run script in the browser, but this was not tested with a hostile payload in this repo.
- Exporting an old image with an `http(s)` address fetches it with `credentials: 'omit'`, which reveals to that host that the board was exported.
- What the AI panel does with the text is the system's responsibility; the app only limits what it sends to 12000 characters of board text.
- A tag moved on the remote is not detected here; protection relies on `yarn.lock` holding the commit and on RoqueOS pinning an exact tag.
- No fuzzing or security scan runs in this repo's gate.
