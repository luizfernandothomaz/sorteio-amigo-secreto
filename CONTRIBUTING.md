# Contribuindo

Obrigado por querer ajudar! Pull requests são bem-vindos, de correções pequenas a funcionalidades novas.

## Antes de começar

- **Bug ou ideia pequena:** abra uma [issue](../../issues/new/choose) ou mande direto um pull request.
- **Mudança grande** (novo recurso, troca de banco, mudança de fluxo): abra uma issue antes para alinharmos a ideia e você não perder tempo.
- Procure nas issues abertas se o assunto já está sendo discutido.

## Ambiente de desenvolvimento

Pré-requisitos: [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) e [Node 22](https://nodejs.org).

```bash
git clone https://github.com/<seu-usuario>/sorteio-amigo-secreto.git
cd sorteio-amigo-secreto
```

```bash
# terminal 1
cd api && PORT=5080 dotnet run
```

```bash
# terminal 2
cd web && npm install && npm run dev
```

Abra http://localhost:5173. Mais detalhes e dicas no [README](README.md#rodar-localmente).

## Fluxo de contribuição

1. Faça um **fork** e crie uma branch a partir da `main`:
   `git checkout -b feat/minha-ideia` (ou `fix/...`, `docs/...`).
2. Faça alterações pequenas e focadas. Um pull request, um assunto.
3. Antes de abrir o PR, confira se tudo compila:

   ```bash
   cd web && npx tsc --noEmit && npm run build
   ```

   ```bash
   cd api && dotnet build
   ```

4. Abra o pull request contra a `main` e preencha o modelo.
5. Responda aos comentários da revisão. Pode ser que peçamos ajustes.

## Padrões

- **Commits:** mensagens curtas, no imperativo, em português. Ex.: `Corrige contador de visualizações`.
- **Código:** siga o estilo já usado no arquivo que você está editando. Front em TypeScript com tipos explícitos nas fronteiras (props e API).
- **Interface:** textos em português do Brasil e layout funcionando bem no celular, porque a maioria abre os links pelo WhatsApp.
- **Dependências:** evite adicionar uma biblioteca para algo simples. Se for necessário, explique o motivo no PR.
- **Testes:** ainda não temos suite automatizada. Se você mexer no sorteio (`api/DrawService.cs`), descreva no PR como testou, incluindo casos com pares proibidos e sorteio impossível. Testes automatizados são muito bem-vindos.

## O que pode quebrar a privacidade

Este projeto lida com segredos na URL (`/r/<token>` e `/g/<id>?key=...`). Em qualquer mudança:

- Não registre esses caminhos em logs, analytics ou mensagens de erro.
- Não devolva o resultado do sorteio a quem não for dono do link (ou ao organizador, quando permitido).

## Segurança

Achou uma vulnerabilidade? **Não abra uma issue pública.** Use a aba **Security → Report a vulnerability** do repositório. Se ela não estiver disponível, entre em contato com o mantenedor pelo perfil do GitHub.

## Licença

Ao contribuir, você concorda que sua contribuição será licenciada sob a [licença MIT](LICENSE) do projeto.
