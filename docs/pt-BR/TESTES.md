# Testes

_Português | [English](../TESTING.md)_

> **Para quem:** quem acrescenta uma funcionalidade ou um conserto e precisa saber onde vai o teste e o que o gate já prova.
> **O que tem aqui:** o que cada suíte prova, os falsos que elas usam, o critério de aceite, e o que nenhum teste daqui cobre.
> **Onde ir para o resto:** gate vermelho em [QUANDO-QUEBRA.md](QUANDO-QUEBRA.md#o-gate), os comandos em [REFERENCIA.md](REFERENCIA.md#comandos).

## Sumário

1. [O critério de aceite](#1-o-critério-de-aceite)
2. [As suítes](#2-as-suítes)
3. [Falsos e preparo](#3-falsos-e-preparo)
4. [O que não está coberto](#4-o-que-não-está-coberto)

## 1. O critério de aceite

```bash
yarn verificar
```

Verde é lint limpo, Prettier limpo, toda spec do Vitest passando e o `app check` terminando em `ok, o repo cumpre o contrato.`. O CI roda o mesmo em todo push na `main` e em todo pull request ([`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)). Todo conserto vem com um teste que reprova sem ele, e check novo se prova por mutação: quebre o código de propósito e mostre o teste ficando vermelho ([`CLAUDE.md`](../../CLAUDE.md)). Mudança visível também é aberta no `yarn dev` antes de ser dada como pronta ([`.claude/loop.md`](../../.claude/loop.md)).

## 2. As suítes

Contagens medidas em 18/11/2026 na `main` com `yarn test`: 8 arquivos, 106 testes.

| Arquivo                                                  | Testes | O que prova                                                                                                                                                                                                                                |
| -------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`test/lousa.spec.js`](../../test/lousa.spec.js)         | 55     | o motor com o sistema falso: máquina de ponteiro, quadros na conta, texto e notas adesivas, caixa de seleção, o que vai para a conta e quando, imagens e anexos, exportar e Salvar, abrir um `.rosboard`                                   |
| [`test/app.spec.js`](../../test/app.spec.js)             | 11     | o app pelo SDK: manifesto e capacidades batem, o tipo de `abre`, montar na conta e no idioma, barra do carregando, troca de idioma, painel de IA, teclado só com a janela ativa, janelas estreita e larga, desmontar solta tudo, convidado |
| [`test/elements.spec.js`](../../test/elements.spec.js)   | 15     | fábricas de elemento, normalização, migração do formato velho, `boardToText`                                                                                                                                                               |
| [`test/geometry.spec.js`](../../test/geometry.spec.js)   | 11     | caixas, alças, teste de acerto com rotação, mover, redimensionar, girar                                                                                                                                                                    |
| [`test/quadros.spec.js`](../../test/quadros.spec.js)     | 5      | limpar elementos, estimar bytes, ids, índice vazio, padrões ao gravar                                                                                                                                                                      |
| [`test/serialize.spec.js`](../../test/serialize.spec.js) | 4      | o texto SVG e o escape                                                                                                                                                                                                                     |
| [`test/history.spec.js`](../../test/history.spec.js)     | 4      | desfazer, refazer, o teto                                                                                                                                                                                                                  |
| [`test/pdf.spec.js`](../../test/pdf.spec.js)             | 1      | os bytes do PDF                                                                                                                                                                                                                            |

Os títulos dos testes fazem parte de um contrato: o [`paridade.json`](../../paridade.json) os cita como `test/<arquivo> › <título exato>`, e o RoqueOS recusa a versão cujo título citado não existe mais. Renomear um teste é atualizar o inventário no mesmo commit.

## 3. Falsos e preparo

| Peça                                                             | Onde                                         | O que substitui                                                          |
| ---------------------------------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------ |
| `criarSistemaFalso`, `criarBancoDeAnexos`                        | `@roqueos-apps/app-sdk/sistema-falso`        | o `sistema` inteiro: conta, coleções, anexos, arquivos, avisos, abertura |
| as opções `criarUrl`, `soltarUrl`, `reduzirImagem` do `useLousa` | [`src/useLousa.js`](../../src/useLousa.js)   | `URL.createObjectURL`, `revokeObjectURL` e a redução no canvas           |
| `ResizeObserver`, `matchMedia` que não fazem nada                | [`test/preparar.js`](../../test/preparar.js) | o que falta no jsdom                                                     |
| `enableAutoUnmount(afterEach)`                                   | [`test/preparar.js`](../../test/preparar.js) | listener e timer que sobram entre testes                                 |
| `server.deps.inline` para o `@roqueos-apps/ui`                   | [`vite.config.js`](../../vite.config.js)     | o kit ui chega como fonte `.vue` e tem de passar pelo plugin do Vue      |

## 4. O que não está coberto

- Nenhum teste de navegador mora neste repo. Pixel, ponteiro e toque de verdade, a área de transferência e a exportação no canvas real não passam pelo `yarn test`; o jsdom não tem canvas.
- Nenhum teste roda contra o sistema de verdade do RoqueOS. O lado do sistema é coberto no RoqueOS, e a auditoria de paridade de 28/09/2026 anota que nada foi medido com sessão real naquela data ([`paridade.json`](../../paridade.json), `auditoria`).
- O `roqueos-docs` não faz parte do `yarn verificar`; a deriva da documentação só aparece quando alguém o roda.
