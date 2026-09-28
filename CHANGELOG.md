# Changelog

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/), e o projeto
usa [versionamento semântico](https://semver.org/lang/pt-BR/).

## [0.1.1] - sem data até o RoqueOS instalar

A auditoria de paridade de 28/09/2026 (Goal 28): o founder pediu que nenhuma funcionalidade
se perdesse na saída do núcleo.

### Adicionado

- `paridade.json`: o inventário do que o Quadro Branco fazia dentro do RoqueOS, item por item, e
  o que aconteceu com cada coisa na saída (86 itens: 73 mantidas, 13 mudaram, 0 perdidas). Cada
  item cita o teste deste repo que o prova, ou a evidência, e o RoqueOS confere o arquivo no
  pacote instalado: teste citado que não existe mais, estado de dúvida ou perda sem decisão
  escrita reprovam. O arquivo vai no pacote (`files`).

### Corrigido

- **A falha de rede ao trocar de quadro não grava mais um quadro por cima do outro.** O
  quadro aberto fica como estava, com o aviso de que o escolhido não abriu. Apagar o quadro
  aberto com o próximo fora do ar mostra a tela de erro com o tentar de novo, e a lista sem
  último aberto abre o primeiro quadro em vez de criar um novo.
- **Quem desenha sem conta e entra com a Lousa aberta não perde o desenho**: ele vira um
  quadro novo da conta (as imagens embutidas viram anexo), e espera a próxima abertura se a
  primeira falhar. Trocar de conta não grava mais o quadro de antes na conta nova.
- **O `.rosboard` leva as imagens dentro**, e não o anexo, que só a conta de quem guardou abre.
- **A imagem acima de 10 MB entra redesenhada menor**, em vez de recusada.

### Mudado

- Abrindo os quadros, a barra do carregando corre, parada no perfil leve (kit `ui` 0.6.0); a
  folha do celular fecha também arrastando a alça.

## [0.1.0] - sem data até o RoqueOS instalar

O Quadro Branco sai do RoqueOS para o próprio repositório, falando com ele pelo `app-sdk` 0.3.0
e desenhado com o kit `ui` 0.3.0. Para quem usa, os quadros continuam onde estavam: mesmo lugar
na conta, mesmos campos, o mesmo índice, e as imagens de antes abrem como abriam. A
`v0.1.0` pina o SDK num commit do PR #5 do `app-sdk`; quando a 0.3.0 tiver a tag dela na
`main`, sai a 0.1.1 pinada nela, e é essa que ganha data.

### Mudado

- A imagem colada no quadro vira um anexo do app: o elemento guarda o id, e a imagem abre em
  qualquer aparelho da pessoa. Antes ela ia para as Imagens dos Arquivos e o quadro guardava o
  endereço de download; agora ela não aparece mais no Finder (é do quadro), e o endereço não
  fica gravado no quadro.
- O PNG e o PDF exportados levam as imagens. Antes o SVG que vira imagem apontava para o
  endereço de fora, que o navegador não busca dentro de um SVG, e a imagem saía em branco.
- O painel de IA é o do sistema, só de leitura, com as duas ações da Lousa (agrupar em temas e
  tirar as ações) no idioma de quem usa.
- A falha de rede ao abrir mostra o erro com "Tentar novamente". Antes ela virava "nenhum
  quadro", e a Lousa criava um quadro novo e gravava o índice só com ele, por cima da lista.
- Apagar o quadro aberto não o grava de volta. Antes, a troca para o próximo quadro salvava o
  apagado, que ficava na conta, fora da lista.
- A conta trocou com a Lousa aberta: o que esperava para gravar não vai para a conta nova, e
  os quadros dela abrem. Antes a Lousa continuava no quadro da conta anterior.
- A borracha tem ícone: o de antes (`ink_eraser`) não existe na fonte do RoqueOS, e o botão
  mostrava o nome escrito.
- As opções "Preenchimento" e "Mostrar Grade" têm o texto ao lado do interruptor clicável.
- Quinze textos que estavam em inglês em oito idiomas foram traduzidos (quadros, cor, nota
  adesiva, os avisos de quadro grande, simplificado, exportado e de imagem), e a descrição do
  app também.
- A Lousa de celular vale para a janela estreita, e não só para a tela pequena: uma janela
  estreita na mesa também ganha a barra curta e as ferramentas na folha.
