using System.Text.Json;

namespace AmigoSecreto.Api;

/// <summary>
/// Armazenamento em arquivo JSON, só para a POC.
/// No MVP isso vira PostgreSQL (EF Core + Npgsql) atrás da mesma interface de uso.
/// </summary>
public class JsonStore
{
    private static readonly JsonSerializerOptions Options = new() { WriteIndented = true };
    private readonly string _path;
    private readonly object _lock = new();
    private readonly Dictionary<string, Group> _groups;

    public JsonStore(string path)
    {
        _path = path;
        Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(path))!);
        _groups = File.Exists(path)
            ? JsonSerializer.Deserialize<Dictionary<string, Group>>(File.ReadAllText(path), Options) ?? new()
            : new();
    }

    public void Insert(Group group)
    {
        lock (_lock)
        {
            _groups[group.Id] = group;
            Persist();
        }
    }

    /// <summary>Lê e altera um grupo de forma atômica. Retorna null se o grupo não existir.</summary>
    public T? Update<T>(string groupId, Func<Group, T> change)
    {
        lock (_lock)
        {
            if (!_groups.TryGetValue(groupId, out var group)) return default;
            var result = change(group);
            Persist();
            return result;
        }
    }

    public T? Read<T>(string groupId, Func<Group, T> read)
    {
        lock (_lock)
        {
            return _groups.TryGetValue(groupId, out var group) ? read(group) : default;
        }
    }

    /// <summary>Encontra o grupo dono de um link de visualização e aplica a alteração.</summary>
    public T? UpdateByViewToken<T>(string token, Func<Group, Participant, T> change)
    {
        lock (_lock)
        {
            foreach (var group in _groups.Values)
            {
                var p = group.Participants.FirstOrDefault(x => x.ViewToken == token);
                if (p is null) continue;
                var result = change(group, p);
                Persist();
                return result;
            }
            return default;
        }
    }

    private void Persist()
    {
        var tmp = _path + ".tmp";
        File.WriteAllText(tmp, JsonSerializer.Serialize(_groups, Options));
        File.Move(tmp, _path, overwrite: true);
    }
}
