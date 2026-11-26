# Modelo de ameaças

_Português | [English](../THREAT-MODEL.md)_

> **Para quem:** quem revisa uma mudança que mexe em renderização, arquivos, imagens, dependências ou CI.
> **O que tem aqui:** o que o Quadro Branco protege, de quem, os controles com o arquivo que segura cada um, e o que ele não protege.
> **Onde ir para o resto:** como relatar uma vulnerabilidade no [`SECURITY.md`](../../SECURITY.md), os fluxos em [ARQUITETURA.md](ARQUITETURA.md).

## Sumário

1. [O que se protege](#1-o-que-se-protege)
2. [Quem são os adversários](#2-quem-são-os-adversários)
3. [Controles](#3-controles)
4. [O que não se protege](#4-o-que-não-se-protege)

## 1. O que se protege

O Quadro Branco roda na mesma origem do RoqueOS. Um script injetado por ele rodaria com a sessão de quem abriu a janela. O que está em jogo é essa sessão, os quadros e anexos da pessoa, e a integridade do pacote que o RoqueOS instala.

## 2. Quem são os adversários

| Adversário                                                  | Como entra                                                  | O que quer                                            |
| ----------------------------------------------------------- | ----------------------------------------------------------- | ----------------------------------------------------- |
| um `.rosboard` forjado                                      | alguém manda um arquivo, a pessoa dá duplo clique no Finder | rodar script por um campo de texto ou de imagem       |
| texto escrito num quadro por outro aparelho da mesma pessoa | quadros sincronizados                                       | o mesmo, pelo documento do quadro                     |
| o pull request de um fork                                   | o CI em `pull_request`                                      | ler segredo ou escrever no repo pelo CI               |
| uma dependência comprometida                                | script de instalação, tag movida                            | rodar código na instalação ou levar código ao RoqueOS |
| outro app ou outra conta                                    | um id de anexo                                              | abrir uma imagem que não é dele                       |

## 3. Controles

| Controle                                                                                                                                          | Onde é cobrado                                                                                                                                 |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| O texto do quadro só chega ao DOM como texto: interpolação do Vue na tela, `escapeXml` no SVG exportado                                           | [`src/Lousa.vue`](../../src/Lousa.vue), [`src/serialize.js`](../../src/serialize.js), [`test/serialize.spec.js`](../../test/serialize.spec.js) |
| Um arquivo aberto tem de ser JSON com uma lista `elements`, e todo elemento passa pelo `migrateElement`; o resto é recusado com aviso e nada muda | [`src/useLousa.js`](../../src/useLousa.js) `abrirArquivo`, teste `o que não é quadro avisa, e os quadros ficam como estavam`                   |
| Nenhum acesso próprio a banco ou Storage: coleções e anexos são do sistema; o `app check` reprova import de banco ou do RoqueOS                   | `app check`, seções `o app não fala com banco` e `o app não importa o RoqueOS`                                                                 |
| Anexos por id; o endereço no Storage nunca chega ao app; o sistema guarda o anexo por conta e app, então o id de outro app ou conta não abre nada | [`src/useLousa.js`](../../src/useLousa.js), o `anexos` do app-sdk                                                                              |
| O painel de IA é do sistema: agente e chave não chegam ao app, e o contexto é só o texto do quadro                                                | [`src/Lousa.vue`](../../src/Lousa.vue) `alternarIa`                                                                                            |
| CI em `pull_request`, nunca `pull_request_target`; `contents: read`; sem segredo                                                                  | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml), [`.github/workflows/dco.yml`](../../.github/workflows/dco.yml)                   |
| Nenhum script de instalação roda: `--ignore-scripts` local e no CI; seção `scripts de instalação` do `app check`                                  | [`.github/workflows/ci.yml`](../../.github/workflows/ci.yml)                                                                                   |
| Dependências pinadas por tag e travadas por commit no `yarn.lock`; o RoqueOS pina este app por tag exata                                          | [`package.json`](../../package.json), `yarn.lock`                                                                                              |
| Todo merge revisado pelo mantenedor; todo commit com `Signed-off-by`                                                                              | [`.github/CODEOWNERS`](../../.github/CODEOWNERS), workflow `dco`                                                                               |
| Erros registrados pelo `codigo`, não pelo conteúdo                                                                                                | `console.error('[lousa] ...', e?.codigo ?? e)` pelo [`src/useLousa.js`](../../src/useLousa.js)                                                 |

## 4. O que não se protege

- O `src` de imagem de um quadro antigo ou de um `.rosboard` é desenhado como está. Data URL ou endereço num `<image>` de SVG não roda script no navegador, mas isso não foi testado com conteúdo hostil neste repo.
- Exportar uma imagem antiga com endereço `http(s)` a busca com `credentials: 'omit'`, o que revela a esse servidor que o quadro foi exportado.
- O que o painel de IA faz com o texto é responsabilidade do sistema; o app só limita o que manda a 12000 caracteres de texto do quadro.
- Uma tag movida no remoto não é detectada aqui; a proteção depende do `yarn.lock` guardar o commit e do RoqueOS pinar uma tag exata.
- Nenhum fuzzing nem varredura de segurança roda no gate deste repo.
