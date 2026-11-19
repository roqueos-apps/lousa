# Operations

_[Português](pt-BR/OPERACAO.md) | English_

> **Who this is for:** the maintainer who keeps the Whiteboard healthy and ships versions to RoqueOS.
> **What is here:** the maintenance routine, how a version reaches RoqueOS, updating dependencies without breaking, how to undo each step, where the data lives for backup, and what to watch.
> **Where to go for the rest:** failures in [WHEN-IT-BREAKS.md](WHEN-IT-BREAKS.md), the suites in [TESTING.md](TESTING.md), the system side in [INTEGRATIONS.md](INTEGRATIONS.md).

## Contents

1. [The routine](#1-the-routine)
2. [Shipping a version](#2-shipping-a-version)
3. [Updating without breaking](#3-updating-without-breaking)
4. [Undo](#4-undo)
5. [Backup and restore](#5-backup-and-restore)
6. [Monitoring](#6-monitoring)

## 1. The routine

Nothing runs on a schedule in this repo. The routine is the maintenance loop of [`.claude/loop.md`](../.claude/loop.md), one item per round, stopping at the first one with work:

1. Local gate red: `yarn verificar`.
2. GitHub CI red: `gh run list --limit 3`. Workflows `verificar` and `dco` run on every push to `main` and every pull request, with no secret.
3. Pull request without `Signed-off-by`: the contributor gets the command that fixes it, `git rebase --signoff main`.
4. Issue or outside pull request with no answer: `gh issue list`, `gh pr list`.
5. Asset without origin: a new file in `public/` needs its line in [`ASSETS.md`](../ASSETS.md).
6. SDK behind: a new `app-sdk` tag with a capability this app uses becomes a bump.
7. Documentation drift: README, CONTRIBUTING and `app.json` say the same about what the app does, the capabilities and the languages; `roqueos-docs` from the `roqueos-kit` ends in `roqueos-docs: ok`.

## 2. Shipping a version

There is no release script and no tag workflow in this repo. A version is the `version` in [`package.json`](../package.json), its entry in [`CHANGELOG.md`](../CHANGELOG.md) and a `vX.Y.Z` tag on a commit of `main`. RoqueOS installs the app by that tag (`@roqueos-apps/lousa` pinned to `#v0.1.3` in the RoqueOS `package.json` on 18/11/2026) and, before accepting it, checks `paridade.json` in the installed package.

```bash
yarn verificar                      # green, on the commit that will be tagged
git switch main && git pull
git tag v0.1.4 <commit on main>     # example number
git push origin v0.1.4
```

Then, in RoqueOS, the pin moves to the new tag in its own commit, with its own gate. Before tagging, `paridade.json` must still cite tests that exist with their exact titles: RoqueOS rejects a cited test that disappeared, any state other than `mantida`, `mudou` or `perdida`, and a `perdida` without a written decision.

## 3. Updating without breaking

| What                                         | How                                                                                                                        | Proof                                                                |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `app-sdk` or `ui`                            | change the tag in [`package.json`](../package.json), `yarn install --ignore-scripts`, read the CHANGELOG of the dependency | `yarn verificar` green, a line in this CHANGELOG saying what changed |
| dev dependencies                             | exact versions in [`package.json`](../package.json); one at a time                                                         | `yarn verificar` green                                               |
| a new interface text                         | the key in all ten `i18n/*.json`, no dot in the key                                                                        | `app check`, section `textos nos idiomas`                            |
| a stored field                               | additive only, read old data in `migrateElement`                                                                           | a test that loads the old shape                                      |
| a feature or a test cited in `paridade.json` | update the inventory in the same commit                                                                                    | RoqueOS check on the installed package                               |

The id `whiteboard`, the collection names `quadros` and `indice` and the index id `whiteboards` never change ([DECISIONS.md](DECISIONS.md)).

## 4. Undo

| Irreversible step                                    | Way back                                                                                                        |
| ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| tag pushed on the wrong commit, nobody pinned it yet | `git push origin :refs/tags/vX.Y.Z`, `git tag -d vX.Y.Z`, tag the right commit, push again                      |
| tag already pinned by RoqueOS                        | do not move it: `git revert` on `main`, a new patch version, RoqueOS moves its pin                              |
| a version that breaks RoqueOS                        | RoqueOS goes back to the previous tag in its `package.json`; the fix comes as a new tag here                    |
| a stored field renamed by mistake and shipped        | ship a version that reads both names in `migrateElement`; data already written with the new name stays readable |

## 5. Backup and restore

This repo holds no user data. The boards are in the account database of RoqueOS (`users/<uid>/roqueos/whiteboards` and `.../whiteboards/boards/<id>`) and the attachments in its Storage (`users/<uid>/apps/whiteboard/anexos/<id>`); their backup is a RoqueOS concern. The person can keep a copy of a board with Save (a `.rosboard` in Documents, images inside) and bring it back with a double click in Finder, which creates a new board in the account. On `yarn dev`, boards are in `localStorage` under the `roqueos:whiteboard:` prefix of the development system.

## 6. Monitoring

| What           | Healthy                                            | Where                                                                      |
| -------------- | -------------------------------------------------- | -------------------------------------------------------------------------- |
| CI on `main`   | last `verificar` run green                         | `gh run list --workflow verificar --limit 1`                               |
| the local gate | `ok, o repo cumpre o contrato.` and no failed test | `yarn verificar`                                                           |
| documentation  | `roqueos-docs: ok`                                 | `roqueos-docs` from the `roqueos-kit`                                      |
| usage          | the `save` metric event, one per Save              | `sistema.metricas` on the RoqueOS side; no number is measured in this repo |
