import { verifyJwsAccessToken } from "better-auth/oauth2";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

describe("OAuth JWKS in the Workers runtime", () => {
  it("verifies Better Auth's default EdDSA access token from in-process JWKS", async () => {
    const issuer = "https://videoq.jp/api/auth";
    const audience = "https://videoq.jp/api/mcp";
    const subject = "00000000-0000-4000-8000-000000000005";
    const kid = "workers-eddsa-test-key";
    const keyPair = await generateKeyPair("EdDSA", { extractable: true });
    const publicJwk = {
      ...(await exportJWK(keyPair.publicKey)),
      alg: "EdDSA",
      kid,
      use: "sig",
    };
    const accessToken = await new SignJWT({ scope: "videoq.read" })
      .setProtectedHeader({ alg: "EdDSA", kid })
      .setSubject(subject)
      .setIssuer(issuer)
      .setAudience(audience)
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(keyPair.privateKey);
    const jwksFetch = vi.fn(async () => ({ keys: [publicJwk] }));

    const payload = await verifyJwsAccessToken(accessToken, {
      jwksFetch,
      verifyOptions: { issuer, audience },
    });

    expect(payload).toMatchObject({
      sub: subject,
      iss: issuer,
      aud: audience,
      scope: "videoq.read",
    });
    expect(jwksFetch).toHaveBeenCalledOnce();
  });
});
