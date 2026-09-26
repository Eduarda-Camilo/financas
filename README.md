# leve — finanças pessoais

Aplicação web mobile first em português, publicada como site estático na Vercel.

## Executar e verificar

```sh
npm start
npm test
```

## Armazenamento persistente

Sem uma conta conectada, os dados ficam no armazenamento local do navegador. Para sincronizar entre celulares e sobreviver à limpeza dos dados do navegador:

1. Crie um projeto Supabase e confirme o endereço de e-mail.
2. No SQL Editor do projeto, execute `supabase/setup.sql`.
3. Copie Project URL e a chave **publishable** (ou anon legacy) em Ajustes no app. Nunca use a `service_role`/secret key no navegador.
4. Crie uma conta com e-mail e senha na tela Ajustes e confirme o e-mail, se solicitado. Ao primeiro login, os dados locais existentes são copiados para a conta; em logins seguintes, os dados da nuvem são carregados.

Cada conta acessa apenas seu próprio registro pela política RLS. Para mais detalhes, consulte Supabase → Project Settings → API. A URL e chave pública ficam neste aparelho; sessão também é salva para reabrir a conta.

## Funcionalidades

- Resumo, registro, transações, pessoas e ajustes com navegação responsiva.
- Crédito e débito separados e salário mensal.
- Parcelas mensais encadeadas; edição altera a compra original e seus meses seguintes.
- Exportação JSON.
- Navegação pelo botão voltar do navegador/celular.

Os dados de demonstração podem ser apagados em Ajustes.
