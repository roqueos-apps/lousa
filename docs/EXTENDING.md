# Extending

_[Português](pt-BR/ESTENDER.md) | English_

> **Who this is for:** whoever adds a drawing tool, an element type, an interface text or an AI action.
> **What is here:** the files each kind of addition touches, in order, and the check that proves each step.
> **Where to go for the rest:** the element fields in [REFERENCE.md](REFERENCE.md#formats), the permanent rules in [DECISIONS.md](DECISIONS.md).

## Contents

1. [A new element type and its tool](#1-a-new-element-type-and-its-tool)
2. [A new interface text](#2-a-new-interface-text)
3. [A new AI action](#3-a-new-ai-action)
4. [A new system capability](#4-a-new-system-capability)

## 1. A new element type and its tool

| Step | File                                                            | What changes                                                                                                                                 | What proves it                                                |
| ---- | --------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| 1    | [`src/elements.js`](../src/elements.js)                         | add the type to `SHAPE_TYPES`, `SEGMENT_TYPES` or `FREEHAND_TYPES` if it fits one; otherwise a branch in `createElement` and `finalizeDraft` | a spec in [`test/elements.spec.js`](../test/elements.spec.js) |
| 2    | [`src/geometry.js`](../src/geometry.js)                         | hit test and bounds if its geometry is not a plain box                                                                                       | [`test/geometry.spec.js`](../test/geometry.spec.js)           |
| 3    | [`src/Lousa.vue`](../src/Lousa.vue)                             | how it renders in the stage, and the draft while drawing; optionally a shortcut in `onKeyDown`                                               | [`test/app.spec.js`](../test/app.spec.js) or `yarn dev`       |
| 4    | [`src/serialize.js`](../src/serialize.js)                       | the same rendering in the exported SVG                                                                                                       | [`test/serialize.spec.js`](../test/serialize.spec.js)         |
| 5    | [`src/Ferramentas.vue`](../src/Ferramentas.vue)                 | the tool in `lista`, with an icon that exists in Material Icons                                                                              | `yarn dev`                                                    |
| 6    | [`i18n/`](../i18n/en-US.json)                                   | the tool name key in all ten files                                                                                                           | `app check`                                                   |
| 7    | [`CHANGELOG.md`](../CHANGELOG.md), [REFERENCE.md](REFERENCE.md) | the entry, and the type in the element table                                                                                                 | `roqueos-docs`                                                |

New fields are additive. If the new type replaces an old way of storing something, the old shape is read in `migrateElement`, with a test that loads it. Icons come from the ui kit: `ink_eraser` once showed its name instead of an icon because it is a Material Symbols name ([`src/Ferramentas.vue`](../src/Ferramentas.vue)).

## 2. A new interface text

```bash
# the same key, no dot, in every language file
ls i18n/
yarn app:check
```

Add the key to all ten `i18n/*.json` in the same commit, translated. Use it with `t('key')`. `app check` fails on a missing language, an extra key or a dot in the key; a key missing from the loaded texts shows as the key itself, which tests catch ([`src/textos.js`](../src/textos.js)).

## 3. A new AI action

Actions live in `acoes` of `abrirPainel` in [`src/Lousa.vue`](../src/Lousa.vue), each with `id`, `icone`, `rotulo` (a text key) and `prompt` (in Portuguese, like the system catalog). The context is `boardToText`; if the action needs something else from the board, change [`src/elements.js`](../src/elements.js) and its spec. The test `o painel de IA é o do sistema, só de leitura, com as ações da Lousa no idioma` in [`test/app.spec.js`](../test/app.spec.js) lists the actions and must change with them.

## 4. A new system capability

1. Confirm the pinned `app-sdk` tag offers it; if not, bump the SDK first ([OPERATIONS.md](OPERATIONS.md#3-updating-without-breaking)).
2. Declare it in `capacidades` of [`app.json`](../app.json) and in `CAPACIDADES` of [`src/index.js`](../src/index.js), together.
3. Use it only through `sistema`, never by importing RoqueOS.
4. Document it in [INTEGRATIONS.md](INTEGRATIONS.md), both languages.
5. `yarn verificar`: `app check` section `capacidades opcionais declaradas` and the manifest test in `test/app.spec.js`.
