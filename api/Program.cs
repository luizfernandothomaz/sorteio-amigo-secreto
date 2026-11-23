using System.Buffers.Text;
using System.Security.Cryptography;
using System.Text;
using AmigoSecreto.Api;

var builder = WebApplication.CreateBuilder(args);

var port = Environment.GetEnvironmentVariable("PORT");
if (!string.IsNullOrEmpty(port)) builder.WebHost.UseUrls($"http://0.0.0.0:{port}");

builder.Services.AddSingleton(new JsonStore(builder.Configuration["DATA_PATH"] ?? "data/db.json"));
builder.Services.AddHttpClient();
builder.Services.AddSingleton<EmailService>();

var app = builder.Build();

app.UseDefaultFiles();
app.UseStaticFiles();

var api = app.MapGroup("/api");

// ---------- Organizador ----------

api.MapPost("/groups", (GroupInput input, JsonStore store) =>
{
    var group = new Group { Id = NewToken(9), AdminKey = NewToken(18), CreatedAt = DateTimeOffset.UtcNow };
    var error = ApplyInput(group, input);
    if (error is not null) return Results.BadRequest(new { error });
    store.Insert(group);
    return Results.Ok(new { id = group.Id, adminKey = group.AdminKey });
});

api.MapGet("/groups/{id}", (string id, string key, JsonStore store) =>
    store.Read(id, g => Authorized(g, key) ? Results.Ok(OrganizerView(g)) : Forbidden())
    ?? Results.NotFound(new { error = "Grupo não encontrado." }));

// Editar participantes/restrições apaga o sorteio anterior (os links antigos deixam de valer).
api.MapPut("/groups/{id}", (string id, string key, GroupInput input, JsonStore store) =>
    store.Update(id, g =>
    {
        if (!Authorized(g, key)) return Forbidden();
        var error = ApplyInput(g, input);
        return error is null ? Results.Ok(OrganizerView(g)) : Results.BadRequest(new { error });
    }) ?? Results.NotFound(new { error = "Grupo não encontrado." }));

// Sortear ou refazer o sorteio. Refazer gera links novos para todos.
api.MapPost("/groups/{id}/draw", (string id, string key, JsonStore store) =>
    store.Update(id, g =>
    {
        if (!Authorized(g, key)) return Forbidden();
        var result = DrawService.Draw(g.Participants, g.Restrictions);
        if (result.Error is not null) return Results.UnprocessableEntity(new { error = result.Error });

        foreach (var p in g.Participants)
        {
            p.AssignedToId = result.Assignment![p.Id];
            p.ViewToken = NewToken(16);
            p.DeviceId = null;
            p.ViewedAt = null;
            p.EmailSentAt = null;
        }
        g.DrawnAt = DateTimeOffset.UtcNow;
        return Results.Ok(OrganizerView(g));
    }) ?? Results.NotFound(new { error = "Grupo não encontrado." }));

// Reenviar: gera link novo para um participante e invalida o anterior.
api.MapPost("/groups/{id}/participants/{pid}/resend", (string id, string pid, string key, JsonStore store) =>
    store.Update(id, g =>
    {
        if (!Authorized(g, key)) return Forbidden();
        var p = g.Participants.FirstOrDefault(x => x.Id == pid);
        if (p is null || g.DrawnAt is null) return Results.NotFound(new { error = "Participante não encontrado ou sorteio não feito." });
        p.ViewToken = NewToken(16);
        p.DeviceId = null;
        p.ViewedAt = null;
        p.EmailSentAt = null;
        return Results.Ok(OrganizerView(g));
    }) ?? Results.NotFound(new { error = "Grupo não encontrado." }));

// Envia por e-mail (Resend) para quem tem e-mail e ainda não recebeu.
api.MapPost("/groups/{id}/send-emails", async (string id, string key, HttpRequest req, JsonStore store, EmailService email) =>
{
    if (!email.Configured) return Results.BadRequest(new { error = "RESEND_API_KEY não configurada no servidor." });

    var pending = store.Read(id, g =>
    {
        if (!Authorized(g, key) || g.DrawnAt is null) return null;
        return g.Participants
            .Where(p => !string.IsNullOrWhiteSpace(p.Email) && p.EmailSentAt is null)
            .Select(p => (p.Id, p.Name, p.Email!, p.ViewToken!, g.Name))
            .ToList();
    });
    if (pending is null) return Results.BadRequest(new { error = "Grupo não encontrado, chave inválida ou sorteio não feito." });

    var baseUrl = BaseUrl(req);
    var failures = new List<string>();
    foreach (var (pid, name, to, token, groupName) in pending)
    {
        var (ok, error) = await email.SendRevealLinkAsync(to, name, groupName, $"{baseUrl}/r/{token}");
        if (ok)
            store.Update(id, g => { var p = g.Participants.First(x => x.Id == pid); if (p.ViewToken == token) p.EmailSentAt = DateTimeOffset.UtcNow; return true; });
        else
            failures.Add($"{name}: {error}");
    }
    return Results.Ok(new { sent = pending.Count - failures.Count, failures });
});

// ---------- Participante ----------

// Primeiro aparelho que abre fica vinculado ao link. Outro aparelho recebe aviso.
api.MapPost("/reveal/{token}", (string token, RevealInput input, JsonStore store) =>
{
    if (string.IsNullOrWhiteSpace(input.DeviceId) || input.DeviceId.Length > 100)
        return Results.BadRequest(new { error = "Aparelho inválido." });

    return store.UpdateByViewToken(token, (g, p) =>
    {
        if (p.DeviceId is not null && p.DeviceId != input.DeviceId)
            return Results.Conflict(new { error = "Este link já foi aberto em outro aparelho. Avise o organizador para gerar um link novo." });

        if (p.DeviceId is null)
        {
            p.DeviceId = input.DeviceId;
            p.ViewedAt = DateTimeOffset.UtcNow;
        }
        var receiver = g.Participants.First(x => x.Id == p.AssignedToId);
        return Results.Ok(new { group = g.Name, name = p.Name, receiver = receiver.Name });
    }) ?? Results.NotFound(new { error = "Link inválido ou substituído por um link novo. Peça ao organizador." });
});

app.MapFallbackToFile("index.html");
app.Run();

// ---------- Funções auxiliares ----------

static string NewToken(int bytes) => Base64Url.EncodeToString(RandomNumberGenerator.GetBytes(bytes));

static bool Authorized(Group g, string? key) =>
    key is not null && CryptographicOperations.FixedTimeEquals(Encoding.UTF8.GetBytes(g.AdminKey), Encoding.UTF8.GetBytes(key));

static IResult Forbidden() => Results.Json(new { error = "Chave do organizador inválida." }, statusCode: 403);

static string BaseUrl(HttpRequest req) =>
    Environment.GetEnvironmentVariable("PUBLIC_BASE_URL")?.TrimEnd('/') ?? $"{req.Scheme}://{req.Host}";

static string? ApplyInput(Group g, GroupInput input)
{
    if (string.IsNullOrWhiteSpace(input.Name)) return "Informe o nome do grupo.";

    var people = input.Participants
        .Select(p => new ParticipantInput(p.Name.Trim(), string.IsNullOrWhiteSpace(p.Email) ? null : p.Email.Trim()))
        .Where(p => p.Name.Length > 0)
        .ToList();
    if (people.Count < 3) return "Cadastre pelo menos 3 participantes.";

    var duplicated = people.GroupBy(p => p.Name, StringComparer.OrdinalIgnoreCase).FirstOrDefault(x => x.Count() > 1);
    if (duplicated is not null) return $"Nome repetido: {duplicated.Key}. Use nomes diferentes (ex.: Ana S. e Ana P.).";

    var invalidEmail = people.FirstOrDefault(p => p.Email is not null && !p.Email.Contains('@'));
    if (invalidEmail is not null) return $"E-mail inválido para {invalidEmail.Name}.";

    var participants = people.Select(p => new Participant { Id = NewToken(6), Name = p.Name, Email = p.Email }).ToList();
    var byName = participants.ToDictionary(p => p.Name, p => p.Id, StringComparer.OrdinalIgnoreCase);

    var restrictions = new List<Restriction>();
    foreach (var r in input.Restrictions ?? new())
    {
        if (!byName.TryGetValue(r.A.Trim(), out var a) || !byName.TryGetValue(r.B.Trim(), out var b))
            return $"Restrição com participante inexistente: {r.A} ↔ {r.B}.";
        if (a == b) return $"Restrição inválida: {r.A} com ele mesmo.";
        restrictions.Add(new Restriction { A = a, B = b });
    }

    g.Name = input.Name.Trim();
    g.OrganizerSeesResult = input.OrganizerSeesResult;
    g.Participants = participants;
    g.Restrictions = restrictions;
    g.DrawnAt = null;
    return null;
}

static object OrganizerView(Group g)
{
    var names = g.Participants.ToDictionary(p => p.Id, p => p.Name);
    return new
    {
        id = g.Id,
        name = g.Name,
        organizerSeesResult = g.OrganizerSeesResult,
        drawnAt = g.DrawnAt,
        total = g.Participants.Count,
        viewedCount = g.Participants.Count(p => p.ViewedAt is not null),
        participants = g.Participants.Select(p => new
        {
            id = p.Id,
            name = p.Name,
            email = p.Email,
            viewToken = g.DrawnAt is null ? null : p.ViewToken,
            viewedAt = p.ViewedAt,
            emailSentAt = p.EmailSentAt,
            assignedTo = g.OrganizerSeesResult && p.AssignedToId is not null ? names[p.AssignedToId] : null,
        }),
        restrictions = g.Restrictions.Select(r => new { a = names[r.A], b = names[r.B] }),
    };
}
