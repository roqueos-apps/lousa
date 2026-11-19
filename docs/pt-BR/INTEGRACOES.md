# Integrações

_Português | [English](../INTEGRATIONS.md)_

> **Para quem:** quem muda como o Quadro Branco fala com o RoqueOS, ou o lado do RoqueOS que o hospeda.
> **O que tem aqui:** cada capacidade do `sistema` que o app usa e para quê, os arquivos que ele troca, as ações do painel de IA, e o que o RoqueOS confere antes de aceitar uma versão.
> **Onde ir para o resto:** o contrato em si está documentado no [app-sdk](https://github.com/roqueos-apps/app-sdk); os formatos gravados em [REFERENCIA.md](REFERENCIA.md#formatos).

## Sumário

1. [A superfície](#1-a-superfície)
2. [Capacidades usadas](#2-capacidades-usadas)
3. [O painel de IA](#3-o-painel-de-ia)
4. [Arquivos que entram e saem](#4-arquivos-que-entram-e-saem)
5. [O que o RoqueOS confere](#5-o-que-o-roqueos-confere)

## 1. A superfície

O app expõe uma coisa: o export padrão do [`src/index.js`](../../src/index.js), feito com `definirApp({ id: 'whiteboard', capacidades, montar })`, mais o `./app.json` ([`package.json`](../../package.json), `exports`). O `montar(el, sistema, { ativo })` devolve `{ ativar(sim), desmontar() }`. Não há API HTTP, CLI, servidor MCP nem webhook. O resto vai no sentido contrário: o app chama o sistema.

## 2. Capacidades usadas

| Capacidade   | Chamadas                                                                                       | Para quê                                                                         |
| ------------ | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `colecoes`   | `abrir('quadros')`, `abrir('indice')`, depois `ler(id)`, `atualizar(id, campos)`, `apagar(id)` | os quadros um de cada vez, e o índice ([`src/quadros.js`](../../src/quadros.js)) |
| `anexos`     | `guardar(blob)` devolve `{ id }`, `ler(id)` devolve um Blob                                    | as imagens coladas ([`src/useLousa.js`](../../src/useLousa.js))                  |
| `arquivos`   | `salvar({ nome, conteudo, tipo, pasta: 'Documentos' })`, `ler(ref)`                            | Salvar como `.rosboard`, e ler o arquivo que o Finder entrega                    |
| `abertura`   | `atual()`, `aoMudar(fn)`                                                                       | o `.rosboard` do Finder, ao montar e com a janela aberta                         |
| `ia`         | `abrirPainel({ ancora, tipo: 'read', contexto, acento, titulo, acoes, aoFechar })`             | o painel de IA só de leitura ([`src/Lousa.vue`](../../src/Lousa.vue))            |
| `identidade` | `atual().uid`, `aoMudar(fn)`                                                                   | a conta e a troca dela                                                           |
| `idioma`     | `atual()`, `aoMudar(fn)`                                                                       | qual dos dez arquivos de texto carregar ([`src/index.js`](../../src/index.js))   |
| `desempenho` | `modoLeve()`                                                                                   | o perfil leve                                                                    |
| `avisar`     | `avisar(mensagem, { tipo, titulo })`                                                           | os avisos; tipos `sucesso`, `info`, `aviso`, `erro`                              |
| `metricas`   | `evento('save')`                                                                               | o evento de uso, o mesmo de antes de sair do núcleo                              |

As cinco primeiras são opcionais e declaradas em `capacidades` no [`app.json`](../../app.json); o `app check` reprova quando o código usa uma que não está declarada. As falhas voltam como erro com um `codigo` do SDK (`sem-conta`, `sem-rede`, `nao-encontrado`, `grande-demais` e outros); o app registra o `e?.codigo` e nunca o conteúdo.

## 3. O painel de IA

O painel é do sistema. O app passa o contexto como função, `boardToText(elements)`: só os elementos com texto, em linhas de 60 unidades, da esquerda para a direita, unidos por `|`, cortado em 12000 caracteres ([`src/elements.js`](../../src/elements.js)). Sobre o catálogo de leitura do sistema ele acrescenta duas ações, com o rótulo no idioma de quem usa:

| id      | Rótulo (pt-BR)   | Pedido enviado, em português como o catálogo do sistema                                  |
| ------- | ---------------- | ---------------------------------------------------------------------------------------- |
| `temas` | Agrupar em temas | agrupar as ideias em temas com um título curto cada, responder só com a lista agrupada   |
| `acoes` | Extrair ações    | extrair as ações concretas, uma por linha, começando por verbo, responder só com a lista |

Nenhum agente, escolha de modelo ou chave chega ao app. O texto exato dos pedidos está no [`src/Lousa.vue`](../../src/Lousa.vue), `alternarIa`.

## 4. Arquivos que entram e saem

| Sentido | O quê                  | Tipo                                                | Onde                                                                                  |
| ------- | ---------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| sai     | `.rosboard` (Salvar)   | `application/vnd.roqueos.rosboard+json`             | `Documentos` pelo `arquivos.salvar`; um download para o convidado                     |
| entra   | `.rosboard` do Finder  | declarado em `abre` no [`app.json`](../../app.json) | o RoqueOS também reconhece a extensão quando ele foi guardado como `application/json` |
| sai     | exportar PNG, SVG, PDF | `image/png`, `image/svg+xml`, `application/pdf`     | download do navegador ([`src/export.js`](../../src/export.js))                        |
| entra   | imagem colada ou solta | qualquer `image/*`                                  | vira `anexo` com conta, data URL sem                                                  |

## 5. O que o RoqueOS confere

O RoqueOS instala o pacote por tag e roda, no repositório dele (fechado), o teste de arquitetura `apps-fora-do-nucleo` sobre o pacote instalado: o app só pode importar `vue`, o SDK, o kit ui e os próprios arquivos, e o `paridade.json` tem de ser válido, todo teste citado tem de existir com o título exato, e uma funcionalidade perdida precisa de decisão escrita. As mesmas regras rodam aqui, em parte, no `app check`. Quando o RoqueOS acrescenta uma conferência, este repo fica sabendo por uma falha do lado do RoqueOS, não por um check daqui.
