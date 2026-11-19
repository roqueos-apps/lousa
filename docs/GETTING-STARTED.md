# Getting started

_[Português](pt-BR/COMECAR.md) | English_

> **Who this is for:** someone with nothing installed who wants to see the Whiteboard running and the gate green.
> **What is here:** prerequisites with the command that checks each one, install, the first board on screen, the gate, and the first-time errors.
> **Where to go for the rest:** daily work in [OPERATIONS.md](OPERATIONS.md), how it is built in [ARCHITECTURE.md](ARCHITECTURE.md), every command in [REFERENCE.md](REFERENCE.md).

## Contents

1. [What you need](#1-what-you-need)
2. [Download and install](#2-download-and-install)
3. [The first result](#3-the-first-result)
4. [Check that everything is right](#4-check-that-everything-is-right)
5. [Next steps](#5-next-steps)
6. [When something does not work](#when-something-does-not-work)

## 1. What you need

| Tool      | Minimum version | How to check    | Source of the number                                                  |
| --------- | --------------- | --------------- | --------------------------------------------------------------------- |
| Node      | 22 (CI uses 24) | `node -v`       | `engines` in [`package.json`](../package.json), [`.nvmrc`](../.nvmrc) |
| Yarn      | 1.22            | `yarn -v`       | `packageManager: yarn@1.22.22` in [`package.json`](../package.json)   |
| git       | any recent      | `git --version` | the dependencies come from GitHub by tag                              |
| A browser | any current     |                 | `yarn dev` opens a page                                               |

No account, key or token is needed. The two private-looking dependencies (`app-sdk` and `ui`) are public repositories fetched over HTTPS ([`CHANGELOG.md`](../CHANGELOG.md), unreleased).

## 2. Download and install

```bash
git clone https://github.com/roqueos-apps/lousa.git
cd lousa
yarn install --ignore-scripts
```

`--ignore-scripts` keeps any install script of any dependency from running; CI installs the same way. It worked when it ends with `Done in ...s.` and a `warning Ignored scripts due to flag.` line before it.

## 3. The first result

```bash
yarn dev
```

Vite prints `Local:   http://localhost:5173/`. Open it: a fake RoqueOS window shows the Whiteboard on a local account, with a language selector. Press `r`, drag on the board, and a rectangle appears. Press `F5`: the board is still there, because on `yarn dev` boards live in the browser `localStorage`. Pasted images live only in memory and disappear on `F5` ([`dev/main.js`](../dev/main.js)).

Try the variations on the URL: `?idioma=ar-AR` (right to left), `?leve=1` (light profile, no grid), `?convidado=1` (no account, the board lives in memory). Drag the window edge below 700 px wide and the narrow layout appears, with the tools in a sheet. The AI button shows a notice where the RoqueOS panel would open, with the labels of the two Whiteboard actions.

## 4. Check that everything is right

```bash
yarn verificar
```

It runs lint, the Prettier check, the tests and `app check`. Green looks like this (measured on 18/11/2026 on `main`): `Test Files  8 passed (8)`, `Tests  106 passed (106)`, then nine `ok` lines from `app check` and `ok, o repo cumpre o contrato.`. The test count changes as tests are added; what matters is no failure and the last line.

## 5. Next steps

- Change something visible: open it in `yarn dev` before calling it done, as [`.claude/loop.md`](../.claude/loop.md) asks.
- Contribute: [`CONTRIBUTING.md`](../CONTRIBUTING.md), every commit with `git commit -s`.
- Understand the engine: [ARCHITECTURE.md](ARCHITECTURE.md), section 5.
- Add a tool or an element type: [EXTENDING.md](EXTENDING.md).

## When something does not work

| What appears                                         | Where to look                                                 |
| ---------------------------------------------------- | ------------------------------------------------------------- |
| `The engine "node" is incompatible with this module` | [WHEN-IT-BREAKS.md, installing](WHEN-IT-BREAKS.md#installing) |
| `Permission denied (publickey)` during install       | [WHEN-IT-BREAKS.md, installing](WHEN-IT-BREAKS.md#installing) |
| `[warn] Code style issues found` in `yarn verificar` | [WHEN-IT-BREAKS.md, the gate](WHEN-IT-BREAKS.md#the-gate)     |
| `REPROVOU  textos nos idiomas`                       | [WHEN-IT-BREAKS.md, the gate](WHEN-IT-BREAKS.md#the-gate)     |
