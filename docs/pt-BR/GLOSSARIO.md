# Glossário

_Português | [English](../GLOSSARY.md)_

> **Para quem:** quem lê o código ou as conversas em volta dele e encontra uma palavra que aqui significa coisa específica.
> **O que tem aqui:** cada termo como aparece no código, o que é, e onde mora.
> **Onde ir para o resto:** os campos de cada formato em [REFERENCIA.md](REFERENCIA.md#formatos), os fluxos em [ARQUITETURA.md](ARQUITETURA.md).

O código novo é em português e o motor que veio do RoqueOS mantém os nomes em inglês, então os dois aparecem ([CONTRIBUTING.md](CONTRIBUTING.md)).

| Termo                | O que é                                                                                                   | Onde                                                                     |
| -------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Lousa                | o repositório e o nome de código; na tela o app é o Quadro Branco / Whiteboard                            | [`package.json`](../../package.json), [`app.json`](../../app.json)       |
| `whiteboard`         | o id permanente do app; é por ele que o RoqueOS acha janelas, atalhos e quadros                           | [`app.json`](../../app.json), [`src/index.js`](../../src/index.js)       |
| `sistema`            | o objeto que o RoqueOS (ou o `yarn dev`, ou os testes) entrega ao `montar`; toda capacidade passa por ele | [`src/index.js`](../../src/index.js)                                     |
| capacidade           | uma peça opcional do `sistema` que o app declara: `colecoes`, `ia`, `arquivos`, `anexos`, `abertura`      | `capacidades` no [`app.json`](../../app.json)                            |
| quadro               | um documento na coleção `quadros`, `{ name, elements, view }`                                             | [`src/quadros.js`](../../src/quadros.js)                                 |
| índice               | o documento `whiteboards` da coleção `indice`: a lista de quadros e o último aberto                       | [`src/quadros.js`](../../src/quadros.js)                                 |
| elemento             | uma coisa no quadro: forma, linha, traço, texto, nota adesiva ou imagem                                   | [`src/elements.js`](../../src/elements.js)                               |
| anexo                | uma imagem guardada pelo sistema para este app, referida pelo id; o endereço nunca chega ao app           | `sistema.anexos`, [`src/useLousa.js`](../../src/useLousa.js)             |
| `.rosboard`          | o quadro guardado como arquivo em Documentos, `version: 2`, imagens embutidas                             | `saveRosboard` no [`src/useLousa.js`](../../src/useLousa.js)             |
| abertura             | a capacidade pela qual o Finder entrega um `.rosboard` ao app (duplo clique, "abrir com")                 | `abre` no [`app.json`](../../app.json)                                   |
| `soNaMemoria`        | verdadeiro para convidado ou sessão de E2E: nada é gravado na conta                                       | [`src/useLousa.js`](../../src/useLousa.js)                               |
| convidado            | sem conta; o quadro mora na memória e as imagens vão embutidas                                            | [`src/useLousa.js`](../../src/useLousa.js)                               |
| desenho do convidado | o que um convidado desenhou antes de entrar com a janela aberta; vira um quadro novo na conta             | `adotarDesenhoDoConvidado` no [`src/useLousa.js`](../../src/useLousa.js) |
| dizimação            | tirar metade dos pontos dos traços à mão longos para o quadro caber em 900 KB                             | `decimateForSave` no [`src/useLousa.js`](../../src/useLousa.js)          |
| `commit()`           | um passo de histórico mais um salvamento agendado; não é commit de git                                    | [`src/useLousa.js`](../../src/useLousa.js)                               |
| janela estreita      | o layout abaixo de 700 px: barra curta, ferramentas numa folha                                            | `LARGURA_ESTREITA` no [`src/Lousa.vue`](../../src/Lousa.vue)             |
| perfil leve          | o perfil do aparelho fraco: sem malha, sem desfoque                                                       | `sistema.desempenho.modoLeve()`, [`src/index.js`](../../src/index.js)    |
| janela falsa         | a janela parecida com a do RoqueOS que o sistema de desenvolvimento abre no `yarn dev`                    | [`dev/main.js`](../../dev/main.js)                                       |
| sistema falso        | o `sistema` em memória do app-sdk que os testes usam                                                      | [`test/lousa.spec.js`](../../test/lousa.spec.js)                         |
| `app check`          | o comando do SDK que confere este repo contra o contrato de app do RoqueOS                                | `yarn app:check`                                                         |
| paridade             | o inventário do que o app fazia dentro do RoqueOS e do que aconteceu com cada item na saída               | [`paridade.json`](../../paridade.json)                                   |
| `verificar`          | o gate: lint, formato, testes, `app check`; também o nome do workflow de CI                               | [`package.json`](../../package.json)                                     |
| DCO                  | a linha `Signed-off-by` que todo commit tem de levar                                                      | [`.github/workflows/dco.yml`](../../.github/workflows/dco.yml)           |
| `migrateElement`     | o único lugar que lê o formato velho de elemento                                                          | [`src/elements.js`](../../src/elements.js)                               |
| `boardToText`        | o quadro como texto para o painel de IA, em ordem de leitura por linhas                                   | [`src/elements.js`](../../src/elements.js)                               |
