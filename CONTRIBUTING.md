# Contributing

_[Português](docs/pt-BR/CONTRIBUTING.md) | English_

Thank you for wanting to help. The common rules of the organization are in the [roqueos-apps CONTRIBUTING](https://github.com/roqueos-apps/.github/blob/main/CONTRIBUTING.md); here goes only what belongs to the Whiteboard.

## How to contribute

1. Open an issue before changing what people see or what a board stores. A small fix can go straight to a pull request.
2. Fork, create a branch and run `yarn install --ignore-scripts`.
3. Every commit carries `Signed-off-by` (`git commit -s`, the DCO). The `dco` check of the pull request fails without it; `git rebase --signoff main` fixes a branch.
4. Every fix comes with a test that fails without it. What goes to the account (and when it does not) is in `test/lousa.spec.js`; the screen, in `test/app.spec.js`.
5. **The board format is permanent.** People's boards are stored with today's fields (`name`, `elements`, `view`, and in each element `type`, `x`, `y`, `w`, `h`, `angle`, `points`...). A new field is additive; changing the name or the meaning of an existing one erases what the person had. `migrateElement` is the place to read an old format.
6. An image with an account goes through `sistema.anexos`, never embedded in the board: the document has 1 MB.
7. New text goes into the ten `i18n/*.json`, with the same keys. `app check` fails if a language is missing.
8. Run `yarn verificar` before opening the pull request. It is what CI runs. `yarn dev` opens the Whiteboard in a fake RoqueOS window, on a local account.

Never change the `id` in `app.json` (`whiteboard`), the collection names (`quadros`, `indice`) or the index id (`whiteboards`): RoqueOS finds the windows, shortcuts and boards of people who already use the app by them.

## Language

New code, comments and commit messages are in Brazilian Portuguese (the engine that came from RoqueOS has English names, and stays that way). Issues and pull requests in English are welcome. By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md).

## Where to read more

The documentation starts at [docs/INDEX.md](docs/INDEX.md): [EXTENDING](docs/EXTENDING.md) for a new tool or text, [TESTING](docs/TESTING.md) for where a test goes, [DECISIONS](docs/DECISIONS.md) for what is not reopened.
