# Operação

_Português | [English](../OPERATIONS.md)_

> **Para quem:** o mantenedor que mantém o Quadro Branco saudável e entrega versões ao RoqueOS.
> **O que tem aqui:** a rotina de manutenção, como uma versão chega ao RoqueOS, atualizar dependências sem quebrar, como desfazer cada passo, onde os dados moram para backup, e o que acompanhar.
> **Onde ir para o resto:** falhas em [QUANDO-QUEBRA.md](QUANDO-QUEBRA.md), as suítes em [TESTES.md](TESTES.md), o lado do sistema em [INTEGRACOES.md](INTEGRACOES.md).

## Sumário

1. [A rotina](#1-a-rotina)
2. [Entregar uma versão](#2-entregar-uma-versão)
3. [Atualizar sem quebrar](#3-atualizar-sem-quebrar)
4. [Desfazer](#4-desfazer)
5. [Backup e restauração](#5-backup-e-restauração)
6. [Monitorar](#6-monitorar)

## 1. A rotina

Nada roda com horário neste repo. A rotina é o laço de manutenção do [`.claude/loop.md`](../../.claude/loop.md), um item por rodada, parando no primeiro que tiver trabalho:

1. Gate local vermelho: `yarn verificar`.
2. CI do GitHub vermelho: `gh run list --limit 3`. Os workflows `verificar` e `dco` rodam em todo push na `main` e em todo pull request, sem segredo.
3. Pull request sem `Signed-off-by`: quem contribui recebe o comando que conserta, `git rebase --signoff main`.
4. Issue ou pull request de fora sem resposta: `gh issue list`, `gh pr list`.
5. Asset sem origem: arquivo novo em `public/` precisa da linha dele no [`ASSETS.md`](../../ASSETS.md).
6. SDK atrás: tag nova do `app-sdk` com capacidade que este app usa vira bump.
7. Deriva de documentação: README, CONTRIBUTING e `app.json` dizem o mesmo sobre o que o app faz, as capacidades e os idiomas; o `roqueos-docs` do `roqueos-kit` termina em `roqueos-docs: ok`.

## 2. Entregar uma versão

Não há script de release nem workflow de tag neste repo. Uma versão é o `version` do [`package.json`](../../package.json), a entrada dela no [`CHANGELOG.md`](../../CHANGELOG.md) e uma tag `vX.Y.Z` num commit da `main`. O RoqueOS instala o app por essa tag (`@roqueos-apps/lousa` pinado em `#v0.1.3` no `package.json` do RoqueOS em 18/11/2026) e, antes de aceitar, confere o `paridade.json` no pacote instalado.

```bash
yarn verificar                      # verde, no commit que vai ganhar a tag
git switch main && git pull
git tag v0.1.4 <commit da main>     # número de exemplo
git push origin v0.1.4
```

Depois, no RoqueOS, o pino passa para a tag nova num commit dele, com o gate dele. Antes de taguear, o `paridade.json` tem de citar testes que existem com o título exato: o RoqueOS reprova teste citado que sumiu, estado fora de `mantida`, `mudou` ou `perdida`, e `perdida` sem decisão escrita.

## 3. Atualizar sem quebrar

| O quê                                                    | Como                                                                                                                  | Prova                                                                 |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `app-sdk` ou `ui`                                        | trocar a tag no [`package.json`](../../package.json), `yarn install --ignore-scripts`, ler o CHANGELOG da dependência | `yarn verificar` verde, uma linha neste CHANGELOG dizendo o que mudou |
| dependências de desenvolvimento                          | versões exatas no [`package.json`](../../package.json); uma de cada vez                                               | `yarn verificar` verde                                                |
| um texto novo de interface                               | a chave nos dez `i18n/*.json`, sem ponto na chave                                                                     | `app check`, seção `textos nos idiomas`                               |
| um campo gravado                                         | só aditivo, ler o dado velho no `migrateElement`                                                                      | um teste que carrega o formato velho                                  |
| uma funcionalidade ou um teste citado no `paridade.json` | atualizar o inventário no mesmo commit                                                                                | a conferência do RoqueOS no pacote instalado                          |

O id `whiteboard`, os nomes das coleções `quadros` e `indice` e o id do índice `whiteboards` nunca mudam ([DECISOES.md](DECISOES.md)).

## 4. Desfazer

| Passo irreversível                                  | Caminho de volta                                                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| tag empurrada no commit errado, ninguém pinou ainda | `git push origin :refs/tags/vX.Y.Z`, `git tag -d vX.Y.Z`, tag no commit certo, push de novo                      |
| tag já pinada pelo RoqueOS                          | não mexa nela: `git revert` na `main`, uma versão de correção, o RoqueOS move o pino                             |
| uma versão que quebra o RoqueOS                     | o RoqueOS volta para a tag anterior no `package.json` dele; o conserto vem como tag nova aqui                    |
| um campo gravado renomeado por engano e entregue    | entregar uma versão que lê os dois nomes no `migrateElement`; o dado já gravado com o nome novo continua legível |

## 5. Backup e restauração

Este repo não guarda dado de ninguém. Os quadros estão no banco da conta do RoqueOS (`users/<uid>/roqueos/whiteboards` e `.../whiteboards/boards/<id>`) e os anexos no Storage dele (`users/<uid>/apps/whiteboard/anexos/<id>`); o backup deles é assunto do RoqueOS. A pessoa pode guardar uma cópia de um quadro com Salvar (um `.rosboard` em Documentos, com as imagens dentro) e trazê-la de volta com um duplo clique no Finder, que cria um quadro novo na conta. No `yarn dev`, os quadros ficam no `localStorage`, com o prefixo `roqueos:whiteboard:` do sistema de desenvolvimento.

## 6. Monitorar

| O quê        | Saudável                                                | Onde                                                                     |
| ------------ | ------------------------------------------------------- | ------------------------------------------------------------------------ |
| CI na `main` | a última rodada do `verificar` verde                    | `gh run list --workflow verificar --limit 1`                             |
| o gate local | `ok, o repo cumpre o contrato.` e nenhum teste falhando | `yarn verificar`                                                         |
| documentação | `roqueos-docs: ok`                                      | o `roqueos-docs` do `roqueos-kit`                                        |
| uso          | o evento de métrica `save`, um por Salvar               | `sistema.metricas` do lado do RoqueOS; nenhum número é medido neste repo |
