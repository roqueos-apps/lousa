# Estender

_Português | [English](../EXTENDING.md)_

> **Para quem:** quem acrescenta uma ferramenta de desenho, um tipo de elemento, um texto de interface ou uma ação de IA.
> **O que tem aqui:** os arquivos que cada tipo de acréscimo toca, em ordem, e o check que prova cada passo.
> **Onde ir para o resto:** os campos do elemento em [REFERENCIA.md](REFERENCIA.md#formatos), as regras permanentes em [DECISOES.md](DECISOES.md).

## Sumário

1. [Um tipo de elemento novo e a ferramenta dele](#1-um-tipo-de-elemento-novo-e-a-ferramenta-dele)
2. [Um texto de interface novo](#2-um-texto-de-interface-novo)
3. [Uma ação de IA nova](#3-uma-ação-de-ia-nova)
4. [Uma capacidade nova do sistema](#4-uma-capacidade-nova-do-sistema)

## 1. Um tipo de elemento novo e a ferramenta dele

| Passo | Arquivo                                                              | O que muda                                                                                                                              | O que prova                                                        |
| ----- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| 1     | [`src/elements.js`](../../src/elements.js)                           | o tipo em `SHAPE_TYPES`, `SEGMENT_TYPES` ou `FREEHAND_TYPES` se ele cabe num deles; senão, um ramo em `createElement` e `finalizeDraft` | uma spec em [`test/elements.spec.js`](../../test/elements.spec.js) |
| 2     | [`src/geometry.js`](../../src/geometry.js)                           | teste de acerto e caixa, se a geometria não é uma caixa simples                                                                         | [`test/geometry.spec.js`](../../test/geometry.spec.js)             |
| 3     | [`src/Lousa.vue`](../../src/Lousa.vue)                               | como ele aparece no palco, e o rascunho enquanto desenha; se quiser, um atalho no `onKeyDown`                                           | [`test/app.spec.js`](../../test/app.spec.js) ou `yarn dev`         |
| 4     | [`src/serialize.js`](../../src/serialize.js)                         | o mesmo desenho no SVG exportado                                                                                                        | [`test/serialize.spec.js`](../../test/serialize.spec.js)           |
| 5     | [`src/Ferramentas.vue`](../../src/Ferramentas.vue)                   | a ferramenta em `lista`, com um ícone que existe no Material Icons                                                                      | `yarn dev`                                                         |
| 6     | [`i18n/`](../../i18n/pt-BR.json)                                     | a chave do nome da ferramenta nos dez arquivos                                                                                          | `app check`                                                        |
| 7     | [`CHANGELOG.md`](../../CHANGELOG.md), [REFERENCIA.md](REFERENCIA.md) | a entrada, e o tipo na tabela de elemento                                                                                               | `roqueos-docs`                                                     |

Campo novo é aditivo. Se o tipo novo substitui um jeito velho de guardar alguma coisa, o formato velho é lido no `migrateElement`, com um teste que o carrega. Os ícones vêm do kit ui: o `ink_eraser` já apareceu escrito no lugar do ícone porque é nome do Material Symbols ([`src/Ferramentas.vue`](../../src/Ferramentas.vue)).

## 2. Um texto de interface novo

```bash
# a mesma chave, sem ponto, em cada arquivo de idioma
ls i18n/
yarn app:check
```

Acrescente a chave nos dez `i18n/*.json` no mesmo commit, traduzida. Use com `t('chave')`. O `app check` reprova idioma faltando, chave sobrando ou ponto na chave; chave que falta nos textos carregados aparece como a própria chave, e os testes pegam ([`src/textos.js`](../../src/textos.js)).

## 3. Uma ação de IA nova

As ações moram em `acoes` do `abrirPainel` no [`src/Lousa.vue`](../../src/Lousa.vue), cada uma com `id`, `icone`, `rotulo` (uma chave de texto) e `prompt` (em português, como o catálogo do sistema). O contexto é o `boardToText`; se a ação precisa de outra coisa do quadro, mude o [`src/elements.js`](../../src/elements.js) e a spec dele. O teste `o painel de IA é o do sistema, só de leitura, com as ações da Lousa no idioma` no [`test/app.spec.js`](../../test/app.spec.js) lista as ações e muda junto com elas.

## 4. Uma capacidade nova do sistema

1. Confirme que a tag pinada do `app-sdk` a oferece; se não, suba o SDK antes ([OPERACAO.md](OPERACAO.md#3-atualizar-sem-quebrar)).
2. Declare em `capacidades` no [`app.json`](../../app.json) e em `CAPACIDADES` no [`src/index.js`](../../src/index.js), juntos.
3. Use só pelo `sistema`, nunca importando o RoqueOS.
4. Documente em [INTEGRACOES.md](INTEGRACOES.md), nos dois idiomas.
5. `yarn verificar`: a seção `capacidades opcionais declaradas` do `app check` e o teste do manifesto no `test/app.spec.js`.
