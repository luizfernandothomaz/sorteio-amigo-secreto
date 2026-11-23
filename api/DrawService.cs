using System.Security.Cryptography;

namespace AmigoSecreto.Api;

public static class DrawService
{
    public record DrawResult(Dictionary<string, string>? Assignment, string? Error);

    /// <summary>
    /// Sorteia quem tira quem respeitando: ninguém tira a si mesmo e nenhum par proibido (nos dois sentidos).
    /// 1) Tenta embaralhamento aleatório com rejeição (resultado uniforme entre os sorteios válidos).
    /// 2) Se não achar, faz busca exaustiva (backtracking) para achar um válido ou provar que é impossível.
    /// </summary>
    public static DrawResult Draw(IReadOnlyList<Participant> participants, IReadOnlyList<Restriction> restrictions)
    {
        var ids = participants.Select(p => p.Id).ToList();
        var names = participants.ToDictionary(p => p.Id, p => p.Name);

        if (ids.Count < 3)
            return new(null, "O sorteio precisa de pelo menos 3 participantes.");

        var forbidden = new HashSet<(string, string)>();
        foreach (var r in restrictions)
        {
            forbidden.Add((r.A, r.B));
            forbidden.Add((r.B, r.A));
        }

        bool Allowed(string giver, string receiver) => giver != receiver && !forbidden.Contains((giver, receiver));

        var options = ids.ToDictionary(g => g, g => ids.Where(r => Allowed(g, r)).ToList());

        var blocked = options.Where(o => o.Value.Count == 0).Select(o => names[o.Key]).ToList();
        if (blocked.Count > 0)
            return new(null, $"Sorteio impossível: {string.Join(", ", blocked)} não pode tirar ninguém com as restrições atuais.");

        // 1) Rejeição: embaralha até achar um sorteio válido.
        var receivers = ids.ToArray();
        for (var attempt = 0; attempt < 5000; attempt++)
        {
            Shuffle(receivers);
            var ok = true;
            for (var i = 0; i < ids.Count && ok; i++) ok = Allowed(ids[i], receivers[i]);
            if (ok) return new(ids.Select((g, i) => (g, receivers[i])).ToDictionary(x => x.g, x => x.Item2), null);
        }

        // 2) Backtracking: começa por quem tem menos opções.
        var order = ids.OrderBy(g => options[g].Count).ToList();
        var used = new HashSet<string>();
        var result = new Dictionary<string, string>();
        if (Backtrack(0)) return new(result, null);

        var tight = order.Take(3).Select(g => $"{names[g]} ({options[g].Count} {(options[g].Count == 1 ? "opção" : "opções")})");
        return new(null, $"Não existe sorteio válido com essas restrições. Participantes mais restritos: {string.Join(", ", tight)}. Remova alguma restrição desses participantes.");

        bool Backtrack(int index)
        {
            if (index == order.Count) return true;
            var giver = order[index];
            var candidates = options[giver].ToArray();
            Shuffle(candidates);
            foreach (var receiver in candidates)
            {
                if (!used.Add(receiver)) continue;
                result[giver] = receiver;
                if (Backtrack(index + 1)) return true;
                used.Remove(receiver);
                result.Remove(giver);
            }
            return false;
        }
    }

    private static void Shuffle<T>(T[] items)
    {
        for (var i = items.Length - 1; i > 0; i--)
        {
            var j = RandomNumberGenerator.GetInt32(i + 1);
            (items[i], items[j]) = (items[j], items[i]);
        }
    }
}
