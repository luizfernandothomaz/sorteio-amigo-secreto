export type ParticipantView = {
  id: string;
  name: string;
  email: string | null;
  viewToken: string | null;
  viewedAt: string | null;
  emailSentAt: string | null;
  assignedTo: string | null;
};

export type GroupView = {
  id: string;
  name: string;
  organizerSeesResult: boolean;
  drawnAt: string | null;
  total: number;
  viewedCount: number;
  participants: ParticipantView[];
  restrictions: { a: string; b: string }[];
};

export type GroupInput = {
  name: string;
  organizerSeesResult: boolean;
  participants: { name: string; email: string | null }[];
  restrictions: { a: string; b: string }[];
};

export async function call<T>(method: string, url: string, body?: unknown): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? `Erro ${res.status}`);
  return data as T;
}

/** Identificador deste aparelho, usado para prender o link ao primeiro aparelho que abrir. */
export function deviceId(): string {
  const key = "amigo-secreto-device";
  try {
    let id = localStorage.getItem(key);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(key, id);
    }
    return id;
  } catch {
    return (window as any).__deviceId ??= crypto.randomUUID();
  }
}
