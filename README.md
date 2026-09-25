# leve — finanças pessoais

Aplicação web mobile first em português, com branco, rosa e glassmorphism. Sem dependências de instalação. Requer Node.js para servir os arquivos.

## Executar

```sh
npm start
```

Abra http://localhost:5173. Para verificar os cálculos: `npm test`.

## Funcionalidades

- Resumo mensal, seletor de mês e ano e navegação por setas.
- Crédito e débito da Duda separados da fatura compartilhada.
- Aba Registro com tabela editável, filtros de mês, pessoa e tipo, atalhos Tab/Enter e colagem de células de planilhas.
- Para Duda: crédito, débito e salário recebido. Para as demais pessoas: apenas crédito.
- Salário padrão em Ajustes e valor recebido editável para cada mês na aba Registro.
- Parcelamento em centavos inteiros, com sobras distribuídas nas primeiras parcelas, e detalhes da compra original.
- Exclusão de compras com confirmação, exportação JSON e armazenamento local no navegador.

Os exemplos iniciais são demonstrativos. Ajustes permite apagá-los para começar. O salário padrão vale nos meses sem um valor próprio; os valores próprios permanecem independentes do padrão. Compras lançadas pela tabela iniciam no mês selecionado; o campo de data é opcional e, quando preenchido, deve pertencer ao mês inicial da compra. Não há regra de fechamento bancário. Dados não são sincronizados entre dispositivos. O JSON exportado serve como cópia dos registros; importação não está implementada.

## Estrutura

`app.js`: telas, interação e persistência. `register.js`: tabela de registro. `register-model.js` e `finance.js`: validação e cálculos independentes da interface. `style.css`: estilos responsivos. `server.js`: servidor HTTP local. `finance.test.js`: testes financeiros.

Validados: cálculos automatizados, renderização desktop/mobile, seletor de pessoa, tipo de registro e mudança de mês com parcelas no navegador.
