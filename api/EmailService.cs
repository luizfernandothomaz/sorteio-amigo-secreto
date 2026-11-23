using System.Net.Http.Headers;
using System.Net.Http.Json;

namespace AmigoSecreto.Api;

/// <summary>Envio via API HTTP do Resend (https://resend.com/docs/api-reference/emails/send-email).</summary>
public class EmailService(IHttpClientFactory httpFactory, IConfiguration config)
{
    public bool Configured => !string.IsNullOrWhiteSpace(config["RESEND_API_KEY"]);

    public async Task<(bool ok, string? error)> SendRevealLinkAsync(string to, string participantName, string groupName, string link)
    {
        var client = httpFactory.CreateClient();
        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.resend.com/emails");
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", config["RESEND_API_KEY"]);

        var safeName = System.Net.WebUtility.HtmlEncode(participantName);
        var safeGroup = System.Net.WebUtility.HtmlEncode(groupName);
        request.Content = JsonContent.Create(new
        {
            from = config["RESEND_FROM"] ?? "Amigo Secreto <onboarding@resend.dev>",
            to = new[] { to },
            subject = $"🎁 {groupName}: seu amigo secreto foi sorteado",
            html = $"""
                <div style="font-family:sans-serif;max-width:480px;margin:auto;text-align:center">
                  <h2>Olá, {safeName}!</h2>
                  <p>O sorteio do <b>{safeGroup}</b> foi feito.</p>
                  <p><a href="{link}" style="display:inline-block;padding:12px 24px;background:#c0392b;color:#fff;border-radius:8px;text-decoration:none">Ver meu amigo secreto</a></p>
                  <p style="color:#777;font-size:13px">Abra só no seu celular. O link fica preso ao primeiro aparelho que abrir.</p>
                </div>
                """
        });

        var response = await client.SendAsync(request);
        if (response.IsSuccessStatusCode) return (true, null);
        return (false, $"Resend {(int)response.StatusCode}: {await response.Content.ReadAsStringAsync()}");
    }
}
