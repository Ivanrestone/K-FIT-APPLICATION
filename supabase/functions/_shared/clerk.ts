export function getVerifiedClerkUserId(request: Request): string | null {
  const authorization = request.headers.get("authorization") ?? "";
  const tokenMatch = authorization.match(/^Bearer\s+([A-Za-z0-9._-]+)$/i);
  if (!tokenMatch) {
    return null;
  }

  const segments = tokenMatch[1].split(".");
  if (segments.length !== 3 || segments.some((segment) => !segment)) {
    return null;
  }

  try {
    const encodedPayload = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const binaryPayload = atob(
      encodedPayload.padEnd(Math.ceil(encodedPayload.length / 4) * 4, "="),
    );
    const payloadBytes = Uint8Array.from(
      binaryPayload,
      (character) => character.charCodeAt(0),
    );
    const claims: unknown = JSON.parse(
      new TextDecoder().decode(payloadBytes),
    );

    if (
      typeof claims === "object" &&
      claims !== null &&
      "sub" in claims &&
      typeof claims.sub === "string" &&
      claims.sub.trim() &&
      claims.sub.length <= 255
    ) {
      return claims.sub;
    }
  } catch {
    return null;
  }

  return null;
}
