type JwtClaims = {
  sub?: unknown;
  iss?: unknown;
  exp?: unknown;
  nbf?: unknown;
  azp?: unknown;
};

type ClerkJwk = JsonWebKey & { kid?: string };
type JwkSet = { keys?: ClerkJwk[] };
let jwksCache: { fetchedAt: number; keys: ClerkJwk[] } | null = null;

function base64UrlBytes(value: string): Uint8Array {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const binary = atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "="));
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function decodeJson<T>(value: string): T {
  return JSON.parse(new TextDecoder().decode(base64UrlBytes(value))) as T;
}

export async function verifyClerkSession(request: Request): Promise<{ userId: string; error?: string }> {
  const match = /^Bearer\s+([A-Za-z0-9._-]+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return { userId: "", error: "A signed-in session is required." };
  const segments = match[1].split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return { userId: "", error: "Session token is invalid." };
  }

  const issuer = Deno.env.get("CLERK_ISSUER")?.replace(/\/$/, "");
  const jwksUrl = Deno.env.get("CLERK_JWKS_URL");
  if (!issuer || !jwksUrl) return { userId: "", error: "Attendance authentication is not configured." };

  try {
    const header = decodeJson<{ alg?: unknown; kid?: unknown }>(segments[0]);
    const claims = decodeJson<JwtClaims>(segments[1]);
    if (header.alg !== "RS256" || typeof header.kid !== "string") {
      return { userId: "", error: "Session token algorithm is invalid." };
    }
    if (claims.iss !== issuer || typeof claims.sub !== "string" || !claims.sub.trim()) {
      return { userId: "", error: "Session token claims are invalid." };
    }
    const now = Math.floor(Date.now() / 1000);
    if (typeof claims.exp !== "number" || claims.exp <= now ||
      (typeof claims.nbf === "number" && claims.nbf > now)) {
      return { userId: "", error: "Session token has expired or is not active." };
    }

    const keys = await loadJwks(jwksUrl);
    const jwk = keys.find((key) => key.kid === header.kid && key.kty === "RSA");
    if (!jwk) {
      jwksCache = null;
      const refreshed = await loadJwks(jwksUrl);
      const refreshedKey = refreshed.find((key) => key.kid === header.kid && key.kty === "RSA");
      if (!refreshedKey || !await verifySignature(refreshedKey, segments)) {
        return { userId: "", error: "Session signature is invalid." };
      }
    } else if (!await verifySignature(jwk, segments)) {
      return { userId: "", error: "Session signature is invalid." };
    }
    return { userId: claims.sub };
  } catch (error) {
    console.error("Could not verify Clerk attendance session:", error);
    return { userId: "", error: "Could not verify the signed-in session." };
  }
}

async function verifySignature(jwk: JsonWebKey, segments: string[]): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"],
  );
  const signature = base64UrlBytes(segments[2]);
  const signatureBuffer = new ArrayBuffer(signature.length);
  new Uint8Array(signatureBuffer).set(signature);
  const message = new TextEncoder().encode(`${segments[0]}.${segments[1]}`);
  const messageBuffer = new ArrayBuffer(message.length);
  new Uint8Array(messageBuffer).set(message);
  return crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    signatureBuffer,
    messageBuffer,
  );
}

async function loadJwks(url: string): Promise<ClerkJwk[]> {
  if (jwksCache && Date.now() - jwksCache.fetchedAt < 5 * 60_000) return jwksCache.keys;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Clerk JWKS returned ${response.status}.`);
  const data = await response.json() as JwkSet;
  if (!Array.isArray(data.keys)) throw new Error("Clerk JWKS is malformed.");
  jwksCache = { fetchedAt: Date.now(), keys: data.keys };
  return data.keys;
}
