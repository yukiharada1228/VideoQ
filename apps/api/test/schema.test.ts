import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";

const ENV = { ENVIRONMENT: "test" } as CloudflareBindings;

describe("removed developer API documentation", () => {
  const app = createApp();

  for (const path of ["/api/schema", "/api/openapi.json", "/api/docs", "/api/redoc"]) {
    it(`GET ${path} is not exposed`, async () => {
      const response = await app.request(path, {}, ENV);
      expect(response.status).toBe(404);
    });
  }

  it("does not expose the removed OpenAI-compatible endpoint", async () => {
    const response = await app.request("/api/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", content: "hello" }] }),
    }, ENV);
    expect(response.status).toBe(404);
  });
});
