# Decisões

_Português | [English](../DECISIONS.md)_

> **Para quem:** o agente ou a pessoa prestes a "simplificar" algo que parece arbitrário.
> **O que tem aqui:** o que foi decidido e não se reabre, com a data, a alternativa recusada e o motivo, cada um apontando para onde é cobrado.
> **Onde ir para o resto:** a tabela resumida em [ARQUITETURA.md](ARQUITETURA.md#8-decisões-de-design), a história no [`CHANGELOG.md`](../../CHANGELOG.md).

## Sumário

1. [Identidade e armazenamento](#1-identidade-e-armazenamento)
2. [Imagens](#2-imagens)
3. [Leitura e falha](#3-leitura-e-falha)
4. [Build e textos](#4-build-e-textos)
5. [A saída do núcleo](#5-a-saída-do-núcleo)

## 1. Identidade e armazenamento

**28/09/2026. O id `whiteboard`, as coleções `quadros` e `indice` e o id do índice `whiteboards` são permanentes.** Recusado: renomear para casar com o nome do repositório. É por esses nomes que o RoqueOS acha as janelas, os atalhos e os quadros de quem já usa o app; renomear os perde ([CONTRIBUTING.md](CONTRIBUTING.md), [`src/quadros.js`](../../src/quadros.js)).

**28/09/2026. O formato gravado do quadro é aditivo.** Recusado: renomear um campo ou mudar o sentido dele. Os quadros estão gravados com os campos de hoje; mudar um apaga o que a pessoa tinha. Formato velho é lido no `migrateElement` e em nenhum outro lugar ([`src/elements.js`](../../src/elements.js)).

**28/09/2026. Um quadro é lido por vez com `ler(id)`.** Recusado: observar a coleção inteira. Um quadro chega perto do limite de 1 MB por documento do banco; observar baixaria todos para mostrar um ([`src/quadros.js`](../../src/quadros.js)).

**Gravar depois de 800 ms, sem tempo real.** Recusado: colaboração ao vivo nesta versão. O motor diz que colaboração é outra versão ([`src/useLousa.js`](../../src/useLousa.js), topo). Não há data registrada para esta.

## 2. Imagens

**28/09/2026, versão 0.1.0. Com conta, a imagem é um anexo e o elemento guarda só o id.** Recusado: embutir no quadro, que estouraria 1 MB; e o jeito de antes, um arquivo nas Imagens da pessoa com o endereço de download gravado no quadro. A imagem é do quadro, não um arquivo da pessoa, e o endereço não pode ficar gravado ([`CHANGELOG.md`](../../CHANGELOG.md), 0.1.0).

**28/09/2026, versão 0.1.1. O `.rosboard` leva as imagens dentro.** Recusado: manter o id do anexo no arquivo. Só a conta que guardou abre o anexo, então quem recebe o arquivo veria caixas vazias.

**28/09/2026, versão 0.1.1. A imagem acima de 10 MiB é redesenhada menor.** Recusado: recusá-la. Dentro do RoqueOS a imagem ia inteira para as Imagens e a colagem nunca falhava; recusar perderia uma funcionalidade.

## 3. Leitura e falha

**28/09/2026. Erro de leitura vira a tela de erro, nunca "nenhum quadro".** Recusado: tratar a falha como lista vazia. Esse caminho já criou um quadro novo e gravou o índice só com ele, por cima da lista da pessoa ([`CHANGELOG.md`](../../CHANGELOG.md), 0.1.0; teste `falha ao ler o índice mostra o erro e NÃO cria um quadro por cima da lista`).

**28/09/2026, versão 0.1.1. A troca de quadro que falha mantém o quadro aberto e o id dele.** Recusado: trocar o id antes de ler. A tela ficava com o quadro antigo sob o id novo, e a próxima gravação copiava um quadro por cima do outro ([`src/useLousa.js`](../../src/useLousa.js), `switchBoard`).

## 4. Build e textos

**25/09/2026, medido nos jogos. Os textos carregam com `?raw` e `JSON.parse`.** Recusado: importar JSON direto. O build do RoqueOS quebra com import de JSON fora do `src/i18n/` dele; é também por isso que o [`src/index.js`](../../src/index.js) repete as capacidades do `app.json` e um teste confere que batem ([`src/textos.js`](../../src/textos.js)).

**Chave de texto não tem ponto.** Recusado: chaves aninhadas. O `app check` lê o ponto como caminho ([`CLAUDE.md`](../../CLAUDE.md)).

**Do tema do RoqueOS, só as variáveis CSS do contrato do SDK; as cores do app são `--lousa-*`.** Recusado: usar os estilos do RoqueOS direto, que não existem fora do RoqueOS ([`CLAUDE.md`](../../CLAUDE.md)).

## 5. A saída do núcleo

**28/09/2026. Nenhuma funcionalidade se perde na saída do núcleo.** O founder pediu, e o [`paridade.json`](../../paridade.json) é o mecanismo: 86 itens, cada um provado por teste ou evidência, perda só com decisão escrita. Nenhuma se perdeu.

**MIT e DCO para os apps da roqueos-apps.** Decisão do founder registrada no check de repo aberto do doctor do `roqueos-kit`, sem data neste repo. Todo commit leva `Signed-off-by`, conferido pelo workflow `dco` ([`.github/workflows/dco.yml`](../../.github/workflows/dco.yml)).
