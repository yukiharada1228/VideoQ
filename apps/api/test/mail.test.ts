import { afterEach, describe, expect, it, vi } from "vitest";
import { sendMail } from "../src/lib/mail";

describe("sendMail", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("releases a successful Mailgun response body after receiving headers", async () => {
    const cancel = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      body: { cancel },
    });
    vi.stubGlobal("fetch", fetchMock);

    await sendMail(
      {
        MAILGUN_API_KEY: "test-key",
        MAILGUN_SENDER_DOMAIN: "mg.example.com",
        DEFAULT_FROM_EMAIL: "noreply@example.com",
      } as never,
      "student@example.com",
      "Invitation",
      ["Review your invitation"],
    );

    expect(fetchMock).toHaveBeenCalledOnce();
    expect(cancel).toHaveBeenCalledOnce();
  });

  it("requires Mailgun in production", async () => {
    await expect(
      sendMail(
        {
          ENVIRONMENT: "production",
          DEFAULT_FROM_EMAIL: "noreply@mg.example.com",
        } as never,
        "student@example.com",
        "Invitation",
        ["Review your invitation"],
      ),
    ).rejects.toThrow("MAILGUN_API_KEY is required for production email delivery");
  });

  it("fails clearly when local email delivery is not configured", async () => {
    await expect(
      sendMail(
        { ENVIRONMENT: "development" } as never,
        "student@example.com",
        "Verify",
        ["Open the verification link"],
      ),
    ).rejects.toThrow("MAILGUN_API_KEY is required for email delivery");
  });
});
