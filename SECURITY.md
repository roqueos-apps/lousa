# Segurança

## Como reportar

Não abra issue pública para falha de segurança. Use o
[relatório privado de vulnerabilidade](https://github.com/roqueos-apps/lousa/security/advisories/new)
do GitHub. A resposta vem em até sete dias. A política completa está no
[SECURITY da roqueos-apps](https://github.com/roqueos-apps/.github/blob/main/SECURITY.md).

## O que vale aqui

O Quadro Branco roda **na mesma origem** do RoqueOS e desenha o que a pessoa (ou outro aparelho
dela) escreveu num quadro. O que protege quem usa o RoqueOS é:

- o texto do quadro só entra na tela como texto (interpolação do Vue e `escapeXml` no SVG
  exportado), nunca como HTML;
- a Lousa não fala com banco nem com o Storage: as coleções e os anexos são do sistema, que
  decide onde moram e com que regra, e o `app check` reprova import do Firebase ou de dentro
  do RoqueOS;
- a imagem guardada é um anexo por id: o endereço do arquivo nunca chega ao app, e o id de
  outro app ou de outra conta não abre nada;
- a IA é o painel do sistema: agente e chave nunca chegam ao app;
- todo merge passa pela revisão do mantenedor (`CODEOWNERS`), e todo commit tem
  `Signed-off-by`;
- o RoqueOS instala o app por uma tag exata, com o commit travado no lockfile;
- nenhum script roda sozinho no install, e o CI de pull request não lê segredo nenhum.

---

## Security (English)

Do not open public issues for vulnerabilities; use GitHub's private vulnerability reporting.
The Whiteboard runs on the same origin as RoqueOS and only renders board text as text (Vue
interpolation, `escapeXml` in exported SVG). It has no database or storage access of its own
(the system owns the collections and attachments), images are attachments by id whose storage
address never reaches the app, it never sees AI agents or keys, is pinned by exact tag, and has
no install-time scripts or CI secrets.
