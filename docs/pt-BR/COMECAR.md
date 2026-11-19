# Começar

_Português | [English](../GETTING-STARTED.md)_

> **Para quem:** quem não tem nada instalado e quer ver o Quadro Branco rodando e o gate verde.
> **O que tem aqui:** pré-requisitos com o comando que confere cada um, instalação, o primeiro quadro na tela, o gate, e os erros de primeira vez.
> **Onde ir para o resto:** o dia a dia em [OPERACAO.md](OPERACAO.md), como é por dentro em [ARQUITETURA.md](ARQUITETURA.md), todo comando em [REFERENCIA.md](REFERENCIA.md).

## Sumário

1. [O que você precisa](#1-o-que-você-precisa)
2. [Baixar e instalar](#2-baixar-e-instalar)
3. [O primeiro resultado](#3-o-primeiro-resultado)
4. [Conferir que está tudo certo](#4-conferir-que-está-tudo-certo)
5. [Próximos passos](#5-próximos-passos)
6. [Quando algo não funciona](#quando-algo-não-funciona)

## 1. O que você precisa

| Ferramenta   | Versão mínima    | Como conferir   | De onde vem o número                                                        |
| ------------ | ---------------- | --------------- | --------------------------------------------------------------------------- |
| Node         | 22 (o CI usa 24) | `node -v`       | `engines` no [`package.json`](../../package.json), [`.nvmrc`](../../.nvmrc) |
| Yarn         | 1.22             | `yarn -v`       | `packageManager: yarn@1.22.22` no [`package.json`](../../package.json)      |
| git          | qualquer recente | `git --version` | as dependências vêm do GitHub por tag                                       |
| Um navegador | qualquer atual   |                 | o `yarn dev` abre uma página                                                |

Não precisa de conta, chave nem token. As duas dependências que parecem privadas (`app-sdk` e `ui`) são repositórios públicos baixados por HTTPS ([`CHANGELOG.md`](../../CHANGELOG.md), não lançado).

## 2. Baixar e instalar

```bash
git clone https://github.com/roqueos-apps/lousa.git
cd lousa
yarn install --ignore-scripts
```

O `--ignore-scripts` impede que qualquer script de instalação de qualquer dependência rode; o CI instala do mesmo jeito. Deu certo quando termina com `Done in ...s.` e, antes, uma linha `warning Ignored scripts due to flag.`.

## 3. O primeiro resultado

```bash
yarn dev
```

O Vite imprime `Local:   http://localhost:5173/`. Abra: uma janela falsa do RoqueOS mostra o Quadro Branco numa conta local, com um seletor de idioma. Aperte `r`, arraste no quadro, e aparece um retângulo. Aperte `F5`: o quadro continua lá, porque no `yarn dev` os quadros moram no `localStorage` do navegador. Imagens coladas moram só na memória e somem no `F5` ([`dev/main.js`](../../dev/main.js)).

Experimente as variações na URL: `?idioma=ar-AR` (da direita para a esquerda), `?leve=1` (perfil leve, sem malha), `?convidado=1` (sem conta, o quadro mora na memória). Arraste a borda da janela para menos de 700 px de largura e aparece a janela estreita, com as ferramentas numa folha. O botão de IA mostra um aviso onde o painel do RoqueOS abriria, com os rótulos das duas ações do Quadro Branco.

## 4. Conferir que está tudo certo

```bash
yarn verificar
```

Ele roda o lint, a conferência do Prettier, os testes e o `app check`. Verde é assim (medido em 18/11/2026 na `main`): `Test Files  8 passed (8)`, `Tests  106 passed (106)`, depois nove linhas `ok` do `app check` e `ok, o repo cumpre o contrato.`. O número de testes muda quando entram testes; o que importa é nenhuma falha e a última linha.

## 5. Próximos passos

- Mudar algo visível: abra no `yarn dev` antes de dizer que está pronto, como o [`.claude/loop.md`](../../.claude/loop.md) pede.
- Contribuir: [CONTRIBUTING.md](CONTRIBUTING.md), todo commit com `git commit -s`.
- Entender o motor: [ARQUITETURA.md](ARQUITETURA.md), seção 5.
- Acrescentar uma ferramenta ou um tipo de elemento: [ESTENDER.md](ESTENDER.md).

## Quando algo não funciona

| O que aparece                                        | Onde olhar                                                  |
| ---------------------------------------------------- | ----------------------------------------------------------- |
| `The engine "node" is incompatible with this module` | [QUANDO-QUEBRA.md, instalação](QUANDO-QUEBRA.md#instalação) |
| `Permission denied (publickey)` na instalação        | [QUANDO-QUEBRA.md, instalação](QUANDO-QUEBRA.md#instalação) |
| `[warn] Code style issues found` no `yarn verificar` | [QUANDO-QUEBRA.md, o gate](QUANDO-QUEBRA.md#o-gate)         |
| `REPROVOU  textos nos idiomas`                       | [QUANDO-QUEBRA.md, o gate](QUANDO-QUEBRA.md#o-gate)         |
