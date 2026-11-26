# Documentação do Quadro Branco

_Português | [English](../INDEX.md)_

O Quadro Branco (repositório `lousa`) é o app de quadro infinito do RoqueOS, instalado por tag e falando com o sistema só pelo `app-sdk`. Todo documento abaixo tem o par em inglês em [`docs/`](../INDEX.md), que é o principal.

Por onde começar depende do que você quer.

| Quero...                                                          | Leia                                                                                           |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| **Instalar e ver funcionando**                                    | [COMECAR.md](COMECAR.md): do zero ao primeiro quadro                                           |
| **Manter rodando e entregar uma versão**                          | [OPERACAO.md](OPERACAO.md): rotina, versão, atualizar, desfazer, backup                        |
| **Entender uma falha**                                            | [QUANDO-QUEBRA.md](QUANDO-QUEBRA.md): sintoma, causa, o que fazer                              |
| **Ver como ele é por dentro**                                     | [ARQUITETURA.md](ARQUITETURA.md): contexto, componentes, fluxos, dados, decisões, limites      |
| **Consultar um comando, constante, atalho ou campo**              | [REFERENCIA.md](REFERENCIA.md)                                                                 |
| **Saber como ele fala com o RoqueOS**                             | [INTEGRACOES.md](INTEGRACOES.md): capacidades, painel de IA, arquivos, o que o RoqueOS confere |
| **Saber o que os testes provam**                                  | [TESTES.md](TESTES.md)                                                                         |
| **Revisar uma mudança sensível de segurança**                     | [MODELO-DE-AMEACAS.md](MODELO-DE-AMEACAS.md)                                                   |
| **Saber o que não se reabre, e por quê**                          | [DECISOES.md](DECISOES.md)                                                                     |
| **Acrescentar ferramenta, tipo de elemento, texto ou ação de IA** | [ESTENDER.md](ESTENDER.md)                                                                     |
| **Achar um termo**                                                | [GLOSSARIO.md](GLOSSARIO.md)                                                                   |
| **Contribuir**                                                    | [CONTRIBUTING.md](CONTRIBUTING.md)                                                             |
| **Relatar uma vulnerabilidade**                                   | [../../SECURITY.md](../../SECURITY.md)                                                         |
| **Ver o que mudou**                                               | [../../CHANGELOG.md](../../CHANGELOG.md)                                                       |

## Diagramas

Todos são Mermaid dentro do Markdown, renderizados pelo GitHub; a fonte é o texto do documento.

| Diagrama                         | Fonte                     | Onde é explicado                                                            |
| -------------------------------- | ------------------------- | --------------------------------------------------------------------------- |
| Contexto                         | Mermaid na ARQUITETURA.md | [ARQUITETURA, seção 2](ARQUITETURA.md#2-contexto-quem-usa-e-do-que-depende) |
| Abrir a janela                   | Mermaid na ARQUITETURA.md | [ARQUITETURA, seção 5.1](ARQUITETURA.md#51-abrir-a-janela)                  |
| Desenhar e salvar sozinho        | Mermaid na ARQUITETURA.md | [ARQUITETURA, seção 5.2](ARQUITETURA.md#52-desenhar-e-salvar-sozinho)       |
| Colar uma imagem                 | Mermaid na ARQUITETURA.md | [ARQUITETURA, seção 5.3](ARQUITETURA.md#53-colar-uma-imagem)                |
| Abrir um `.rosboard` pelo Finder | Mermaid na ARQUITETURA.md | [ARQUITETURA, seção 5.4](ARQUITETURA.md#54-abrir-um-rosboard-pelo-finder)   |
| Como o app chega ao RoqueOS      | Mermaid no README         | [../../README.pt-BR.md](../../README.pt-BR.md#como-ele-fala-com-o-roqueos)  |
