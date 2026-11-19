# Whiteboard documentation

_[Português](pt-BR/INDEX.md) | English_

The Whiteboard (repository `lousa`) is the infinite board app of RoqueOS, installed by tag and talking to the system only through the `app-sdk`. Every document below has its Portuguese pair under [`docs/pt-BR/`](pt-BR/INDEX.md).

Where to start depends on what you want.

| I want to...                                       | Read                                                                                    |
| -------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Install it and see it working**                  | [GETTING-STARTED.md](GETTING-STARTED.md): from nothing to the first board               |
| **Keep it running and ship a version**             | [OPERATIONS.md](OPERATIONS.md): routine, release, update, undo, backup                  |
| **Understand a failure**                           | [WHEN-IT-BREAKS.md](WHEN-IT-BREAKS.md): symptom, cause, what to do                      |
| **See how it is built inside**                     | [ARCHITECTURE.md](ARCHITECTURE.md): context, components, flows, data, decisions, limits |
| **Look up a command, constant, shortcut or field** | [REFERENCE.md](REFERENCE.md)                                                            |
| **Know how it talks to RoqueOS**                   | [INTEGRATIONS.md](INTEGRATIONS.md): capabilities, AI panel, files, what RoqueOS checks  |
| **Know what the tests prove**                      | [TESTING.md](TESTING.md)                                                                |
| **Review a security-sensitive change**             | [THREAT-MODEL.md](THREAT-MODEL.md)                                                      |
| **Know what is not reopened, and why**             | [DECISIONS.md](DECISIONS.md)                                                            |
| **Add a tool, element type, text or AI action**    | [EXTENDING.md](EXTENDING.md)                                                            |
| **Find a term**                                    | [GLOSSARY.md](GLOSSARY.md)                                                              |
| **Contribute**                                     | [../CONTRIBUTING.md](../CONTRIBUTING.md)                                                |
| **Report a vulnerability**                         | [../SECURITY.md](../SECURITY.md)                                                        |
| **See what changed**                               | [../CHANGELOG.md](../CHANGELOG.md)                                                      |

## Diagrams

All of them are Mermaid inside the Markdown, rendered by GitHub; the source is the text of the document.

| Diagram                           | Source                     | Where it is explained                                                                   |
| --------------------------------- | -------------------------- | --------------------------------------------------------------------------------------- |
| Context                           | Mermaid in ARCHITECTURE.md | [ARCHITECTURE, section 2](ARCHITECTURE.md#2-context-who-uses-it-and-what-it-depends-on) |
| Opening the window                | Mermaid in ARCHITECTURE.md | [ARCHITECTURE, section 5.1](ARCHITECTURE.md#51-opening-the-window)                      |
| Drawing and autosave              | Mermaid in ARCHITECTURE.md | [ARCHITECTURE, section 5.2](ARCHITECTURE.md#52-drawing-and-autosave)                    |
| Pasting an image                  | Mermaid in ARCHITECTURE.md | [ARCHITECTURE, section 5.3](ARCHITECTURE.md#53-pasting-an-image)                        |
| Opening a `.rosboard` from Finder | Mermaid in ARCHITECTURE.md | [ARCHITECTURE, section 5.4](ARCHITECTURE.md#54-opening-a-rosboard-from-finder)          |
| How the app reaches RoqueOS       | Mermaid in the README      | [../README.md](../README.md#how-it-talks-to-roqueos)                                    |
