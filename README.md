# Amigo Secreto — POC

React + .NET 10. O organizador cria o grupo, cadastra os pares proibidos, sorteia e manda um link para cada pessoa, por e-mail (Resend) ou pelo WhatsApp.

## O que a POC faz
- Sorteio em que ninguém tira a si mesmo e os pares proibidos (ex.: casais) são respeitados nos dois sentidos
- Detecta sorteio impossível e diz quem está travando
- Link de visualização única: fica preso ao primeiro aparelho que abrir. Outro aparelho vê o aviso "já foi aberto em outro aparelho"
- "Link novo": invalida o link antigo de um participante
- "Refazer sorteio": gera links novos para todos
- Contador "X de N já viram" no painel do organizador (atualiza a cada 10 s)
- Botão de WhatsApp com a mensagem pronta e botão "Copiar link"
- Envio por e-mail via Resend para quem tem e-mail
- Configuração "organizador vê o resultado"

## Rodar local
Pré-requisitos: .NET 10 SDK e Node 22.

```bash
# terminal 1 — API na porta 5080
cd api
PORT=5080 dotnet run

# terminal 2 — front com hot reload em http://localhost:5173
cd web
npm install
npm run dev
```

Ou tudo junto, igual em produção:

```bash
cd web && npm install && npm run build   # gera api/wwwroot
cd ../api && PORT=5080 dotnet run        # http://localhost:5080
```

## Deploy no Railway
1. Suba o repositório no GitHub.
2. No Railway: **New Project → Deploy from GitHub repo**. O `Dockerfile` da raiz é detectado sozinho.
3. **Adicione um Volume** montado em `/data`. Sem ele, os grupos somem a cada deploy.
4. Em **Settings → Networking**, gere o domínio público.
5. Variáveis de ambiente:

| Variável | Obrigatória | Exemplo |
|---|---|---|
| `PUBLIC_BASE_URL` | sim | `https://amigo-secreto.up.railway.app` |
| `RESEND_API_KEY` | para e-mail | `re_xxx` |
| `RESEND_FROM` | para e-mail | `Amigo Secreto <sorteio@seudominio.com.br>` |

**Resend:** o remetente de teste `onboarding@resend.dev` só entrega para o e-mail dono da conta Resend. Para mandar para a família, verifique um domínio seu no Resend e use ele no `RESEND_FROM`.

## Limitações conhecidas (são da POC, não do MVP)
- Armazenamento em arquivo JSON. No MVP vira PostgreSQL (EF Core + Npgsql).
- Sem login: a chave do organizador está no link do painel. Quem tiver esse link controla o grupo.
- Sem tela de edição depois de criar o grupo (a API já tem `PUT /api/groups/{id}`).
- O vínculo do link usa o localStorage do navegador. Aba anônima ou navegador limpo contam como "outro aparelho". A saída é o botão "Link novo".
- O envio de e-mail não foi testado contra o Resend real.

## API
| Método | Rota | Uso |
|---|---|---|
| POST | `/api/groups` | Cria o grupo e devolve `id` e `adminKey` |
| GET | `/api/groups/{id}?key=` | Painel do organizador |
| PUT | `/api/groups/{id}?key=` | Edita o grupo (apaga o sorteio) |
| POST | `/api/groups/{id}/draw?key=` | Sorteia ou refaz o sorteio |
| POST | `/api/groups/{id}/participants/{pid}/resend?key=` | Gera link novo para um participante |
| POST | `/api/groups/{id}/send-emails?key=` | Envia e-mail para quem ainda não recebeu |
| POST | `/api/reveal/{token}` | Participante revela o resultado (`{ deviceId }`) |
