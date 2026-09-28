// A Lousa rodando sozinha, numa janela falsa do RoqueOS com o sistema de desenvolvimento do
// SDK: o tamanho vem do app.json, o seletor troca entre os dez idiomas (o árabe vira da
// direita para a esquerda), e os quadros ficam no localStorage, numa conta local. As imagens
// (os anexos) ficam em memória: somem no F5. Na URL: `?idioma=ja-JP`, `?leve=1` (aparelho
// fraco) e `?convidado=1` (sem conta: o quadro fica só na memória, como no RoqueOS). É o mesmo
// `mount` que o RoqueOS chama.
import { montarNaJanelaFalsa } from '@roqueos-apps/app-sdk/sistema-de-desenvolvimento'
import manifesto from '../app.json'
import app from '../src/index.js'

montarNaJanelaFalsa(app, { manifesto })
