# Quando quebra

_Português | [English](../WHEN-IT-BREAKS.md)_

> **Para quem:** quem vê o gate vermelho, a instalação falhar ou uma pessoa dizer que o quadro não abriu.
> **O que tem aqui:** o primeiro comando de diagnóstico, depois sintoma, causa e conserto por área, com a mensagem literal. As mensagens das ferramentas são citadas como aparecem, algumas em inglês.
> **Onde ir para o resto:** o que cada suíte prova em [TESTES.md](TESTES.md), os fluxos em [ARQUITETURA.md](ARQUITETURA.md), a entrega em [OPERACAO.md](OPERACAO.md).

## Sumário

1. [Primeiro, o diagnóstico](#primeiro-o-diagnóstico)
2. [Instalação](#instalação)
3. [O gate](#o-gate)
4. [Usando o app](#usando-o-app)
5. [Entrega](#entrega)

## Primeiro, o diagnóstico

```bash
node -v && yarn -v && yarn verificar
```

Diz numa rodada se as ferramentas estão certas e qual passo do gate está vermelho: lint, formato, testes ou `app check`, nessa ordem. O primeiro vermelho para o resto.

## Instalação

| O que aparece                                                                                                               | Causa                                                                                          | O que fazer                                                                                                                                                        |
| --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `error @roqueos-apps/lousa@0.1.3: The engine "node" is incompatible with this module. Expected version ">=22". Got "20..."` | Node anterior ao 22                                                                            | `nvm use` (lê o [`.nvmrc`](../../.nvmrc), Node 24) e instale de novo                                                                                               |
| `Permission denied (publickey)` ao buscar o `@roqueos-apps/ui`                                                              | a dependência estava pinada por `git+ssh`; o CI não tem chave (medido em 29/09 no `verificar`) | consertado: é `github:roqueos-apps/ui#v0.6.0` por HTTPS ([`CHANGELOG.md`](../../CHANGELOG.md)). Se voltar, confira a linha no [`package.json`](../../package.json) |
| a instalação muda o `yarn.lock`, o CI reprova no `--frozen-lockfile`                                                        | uma dependência mudou sem o lockfile no commit                                                 | `yarn install --ignore-scripts` e commit do `yarn.lock` junto com a mudança                                                                                        |
| `npm` usado por engano cria `package-lock.json`                                                                             | este repo é Yarn 1                                                                             | apague o `package-lock.json`, use `yarn`                                                                                                                           |

## O gate

| O que aparece                                                                         | Causa                                                                                                               | O que fazer                              |
| ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `[warn] Code style issues found in the above file. Run Prettier with --write to fix.` | um arquivo fora do formato do Prettier, Markdown incluído                                                           | `yarn format`, revise o diff, commit     |
| `REPROVOU  textos nos idiomas` com `i18n/ja-JP.json sem: aiThemes`                    | falta uma chave num idioma                                                                                          | acrescente a chave em todo `i18n/*.json` |
| `REPROVOU  textos nos idiomas` com `com texto vazio em: a.b`                          | uma chave com ponto: o `app check` lê o ponto como caminho                                                          | renomeie a chave sem ponto               |
| `REPROVOU  o app não importa o RoqueOS` ou `o app não fala com banco`                 | um import fora do `vue`, do SDK, do kit ui e deste repo                                                             | passe por uma capacidade do `sistema`    |
| `test/app.spec.js` falha em `o id e as capacidades são os do manifesto`               | o `CAPACIDADES` do [`src/index.js`](../../src/index.js) e as `capacidades` do [`app.json`](../../app.json) divergem | mude os dois juntos                      |
| uma chave aparece no lugar do rótulo num teste                                        | o `traduzir` devolve a chave quando ela falta nos textos carregados                                                 | acrescente a chave nos JSON              |

## Usando o app

| O que aparece                                                                                                | Causa                                                                                                                    | O que fazer                                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| "Erro ao salvar quadro" / "Ocorreu um erro inesperado" com Tentar novamente, ao abrir                        | a leitura do índice ou do quadro falhou (rede, sessão); o título reaproveita o `saveError` embora tenha sido uma leitura | Tentar novamente; nada foi gravado por cima da lista. Coberto por `falha ao ler o índice mostra o erro e NÃO cria um quadro por cima da lista` |
| "Não foi possível abrir o quadro / Confira a conexão e tente de novo. O quadro aberto continua como estava." | a troca para outro quadro falhou                                                                                         | tente de novo; o quadro aberto mantém o id e o conteúdo                                                                                        |
| "Quadro simplificado"                                                                                        | o quadro passou de 900 KB; os traços à mão longos ficaram com metade dos pontos                                          | nada: foi gravado                                                                                                                              |
| "Quadro muito grande / Este quadro é grande demais para salvar automaticamente..."                           | ainda acima de 900 KB depois da dizimação; nada foi gravado                                                              | apague elementos ou exporte; Salvar guarda um `.rosboard`                                                                                      |
| "Não foi possível adicionar a imagem"                                                                        | a decodificação falhou, o anexo foi recusado, ou a imagem não cabe nem em 1024 px                                        | tente outra imagem; o quadro não mudou                                                                                                         |
| a caixa de uma imagem fica vazia ao abrir                                                                    | o anexo não existe mais ou é de outra conta                                                                              | o resto do quadro abre; cole a imagem de novo                                                                                                  |
| "Não foi possível abrir o arquivo / Este arquivo não é um quadro do Quadro Branco, ou está danificado."      | o arquivo não é JSON ou não tem a lista `elements`                                                                       | nada mudou; confira o arquivo                                                                                                                  |
| "Não foi possível abrir o arquivo" sem conta                                                                 | o sistema só lê arquivo com conta                                                                                        | entre na conta e abra o arquivo de novo                                                                                                        |

## Entrega

| O que aparece                                                                                          | Causa                                                                | O que fazer                                                                                |
| ------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `::error::commit <sha> sem Signed-off-by. Refaça com: git commit --amend -s (ou git rebase --signoff)` | um commit do pull request não tem a linha do DCO                     | `git rebase --signoff main` e empurre o branch de novo                                     |
| o RoqueOS recusa a versão nova pelo `paridade.json`                                                    | um teste citado foi renomeado ou removido, ou um item está sem prova | conserte o `paridade.json` com os títulos exatos, tag nova                                 |
| o RoqueOS continua na versão velha                                                                     | o pino no `package.json` do RoqueOS não foi movido                   | mova o pino no RoqueOS, num commit dele ([OPERACAO.md](OPERACAO.md#2-entregar-uma-versão)) |
