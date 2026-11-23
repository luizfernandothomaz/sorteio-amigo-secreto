namespace AmigoSecreto.Api;

public class Group
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string AdminKey { get; set; } = "";
    public bool OrganizerSeesResult { get; set; }
    public List<Participant> Participants { get; set; } = new();
    public List<Restriction> Restrictions { get; set; } = new();
    public DateTimeOffset CreatedAt { get; set; }
    public DateTimeOffset? DrawnAt { get; set; }
}

public class Participant
{
    public string Id { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Email { get; set; }
    public string? ViewToken { get; set; }
    public string? AssignedToId { get; set; }
    public string? DeviceId { get; set; }
    public DateTimeOffset? ViewedAt { get; set; }
    public DateTimeOffset? EmailSentAt { get; set; }
}

/// <summary>Par proibido, vale nos dois sentidos (A não tira B e B não tira A).</summary>
public class Restriction
{
    public string A { get; set; } = "";
    public string B { get; set; } = "";
}

// ---------- Entrada da API ----------

public record ParticipantInput(string Name, string? Email);
public record RestrictionInput(string A, string B);
public record GroupInput(
    string Name,
    bool OrganizerSeesResult,
    List<ParticipantInput> Participants,
    List<RestrictionInput>? Restrictions);
public record RevealInput(string DeviceId);
