import { env } from "cloudflare:workers";
import {
  evictDurableObject,
  runDurableObjectAlarm,
  runInDurableObject,
} from "cloudflare:test";
import { describe, expect, it } from "vitest";

describe("RateLimiter Durable Object", () => {
  it("atomically enforces cost and keeps state across eviction", async () => {
    const stub = env.RATE_LIMITER.getByName("runtime-rate-limit");

    await expect(stub.consume(2, 60)).resolves.toEqual({
      allowed: true,
      retryAfterSec: 0,
    });
    await expect(stub.consume(2, 60, 2)).resolves.toMatchObject({
      allowed: false,
    });

    await evictDurableObject(stub);
    await expect(stub.snapshot()).resolves.toMatchObject({ count: 1 });

    await stub.release(60, 1);
    await expect(stub.snapshot()).resolves.toBeNull();
  });

  it("schedules and executes its cleanup alarm", async () => {
    const stub = env.RATE_LIMITER.getByName("runtime-rate-limit-alarm");
    await stub.consume(2, 60);

    await runInDurableObject(stub, async (_instance, state) => {
      await expect(state.storage.getAlarm()).resolves.toBeTypeOf("number");
    });
    await expect(runDurableObjectAlarm(stub)).resolves.toBe(true);
    await expect(stub.snapshot()).resolves.toMatchObject({ count: 1 });
  });
});

describe("StudySession Durable Object", () => {
  it("serializes turns and persists revisions across eviction", async () => {
    const stub = env.STUDY_SESSION.getByName("runtime-study-session");
    const states = {
      intro: {
        concept_id: 1,
        reached: true,
        hint_index: 0,
        last_grade: "pass",
        active: true,
      },
    };

    await expect(stub.tryAcquire("turn-1")).resolves.toEqual({
      acquired: true,
      retryAfterMs: 0,
    });
    await expect(stub.tryAcquire("turn-2")).resolves.toMatchObject({
      acquired: false,
    });
    await expect(stub.commit(0, states, "turn-1")).resolves.toBe(true);

    await evictDurableObject(stub);
    await expect(stub.getSnapshot()).resolves.toEqual({
      revision: 1,
      states,
    });

    await expect(stub.tryAcquire("turn-2")).resolves.toMatchObject({
      acquired: true,
    });
    await expect(stub.commit(0, states, "turn-2")).resolves.toBe(false);
    await stub.release("turn-2");
  });

  it("keeps a live session and reschedules its expiration alarm", async () => {
    const stub = env.STUDY_SESSION.getByName("runtime-study-session-alarm");
    await stub.tryAcquire("turn-1");
    await stub.commit(0, {}, "turn-1");

    await expect(runDurableObjectAlarm(stub)).resolves.toBe(true);
    await expect(stub.getSnapshot()).resolves.toEqual({
      revision: 1,
      states: {},
    });
    await runInDurableObject(stub, async (_instance, state) => {
      await expect(state.storage.getAlarm()).resolves.toBeTypeOf("number");
    });
  });
});
