# Como contribuir

Obrigado por querer ajudar. A régua comum da organização está no
[CONTRIBUTING da roqueos-apps](https://github.com/roqueos-apps/.github/blob/main/CONTRIBUTING.md);
aqui entra só o que é do Quadro Branco.

1. Abra uma issue antes de mudar o que a pessoa vê ou o que um quadro guarda. Correção pequena
   pode ir direto para o PR.
2. Faça o fork, crie um branch e rode `yarn install --ignore-scripts`.
3. Todo commit leva `Signed-off-by` (`git commit -s`, o DCO). O check `dco` do pull request
   reprova sem.
4. Toda correção vem com um teste que reprova sem ela. O que vai para a conta (e quando não
   vai) está em `test/lousa.spec.js`; a tela, em `test/app.spec.js`.
5. **O formato do quadro é permanente.** Os quadros das pessoas estão gravados com os campos de
   hoje (`name`, `elements`, `view`, e em cada elemento `type`, `x`, `y`, `w`, `h`, `angle`,
   `points`...). Campo novo é aditivo; mudar o nome ou o sentido de um que existe apaga o que a
   pessoa tinha. O `migrateElement` é o lugar de ler formato velho.
6. Imagem com conta vai por `sistema.anexos`, nunca embutida no quadro: o documento tem 1 MB.
7. Texto novo entra nos dez `i18n/*.json`, com as mesmas chaves. O `app check` reprova se
   faltar um idioma.
8. Rode `yarn verificar` antes de abrir o PR. É o mesmo que o CI roda. `yarn dev` abre a Lousa
   numa janela falsa do RoqueOS, numa conta local.

Não mude o `id` do `app.json` (`whiteboard`), o nome das coleções (`quadros`, `indice`) nem o
id do índice (`whiteboards`): é por eles que o RoqueOS acha as janelas, os atalhos e os quadros
de quem já usa.

O código novo, os comentários e as mensagens de commit são em português do Brasil (o motor que
veio do RoqueOS tem nomes em inglês, e fica assim). Issue e PR em inglês são bem-vindos. Ao
participar você concorda com o [código de conduta](CODE_OF_CONDUCT.md).

---

## Contributing (English)

The organization-wide guide is the
[roqueos-apps CONTRIBUTING](https://github.com/roqueos-apps/.github/blob/main/CONTRIBUTING.md).
Open an issue before changing what people see or what a board stores; fork, branch,
`yarn install --ignore-scripts`; sign off every commit (`git commit -s`); every fix comes with
a test that fails without it. The stored board format is permanent: new fields are additive,
never rename one. Images go through `sistema.anexos`, never embedded in the board document. New
text goes into all ten `i18n/*.json`; run `yarn verificar` before the pull request. Never change
the `id` in `app.json`, the collection names or the index document id.
