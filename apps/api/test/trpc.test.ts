import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_USER_ID, testAuthHeaders } from "./helpers/auth";

const tagService = vi.hoisted(() => ({
  listTags: vi.fn(),
  createUserTag: vi.fn(),
  updateUserTag: vi.fn(),
  removeTag: vi.fn(),
}));

const courseService = vi.hoisted(() => ({
  listCourses: vi.fn(),
  createUserCourse: vi.fn(),
  reorderUserCourses: vi.fn(),
}));

const videoService = vi.hoisted(() => ({
  getUserVideoStats: vi.fn(),
}));

vi.mock("../src/features/tags/service", () => tagService);
vi.mock("../src/features/courses/service", () => courseService);
vi.mock("../src/features/videos/service", () => videoService);

import { createApp } from "../src/app";

const ENV = {
  ENVIRONMENT: "development",
  CORS_ALLOW_ORIGIN: "http://localhost:5173",
} as never;

const sampleTag = {
  id: 3,
  name: "Lecture",
  color: "blue",
  created_at: "2026-09-05T00:00:00.000Z",
  video_count: 0,
};

const sampleCourse = {
  id: 7,
  name: "Type-safe APIs",
  description: "Hono and React",
  display_order: 0,
  created_at: "2026-09-05T00:00:00.000Z",
  video_count: 2,
  access_role: "owner",
};

const sampleVideoStats = {
  total: 3,
  completed: 1,
  pending: 1,
  processing: 0,
  indexing: 1,
  error: 0,
  uploading: 0,
};

describe("tRPC Hono adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs a service exception with request and procedure context without request secrets", async () => {
    const privateValue = "private-user@example.test";
    const cause = Object.assign(new Error(`Key (email)=(${privateValue}) already exists`), {
      code: "23505", constraint: "users_email_key",
    });
    const error = new Error(`Failed query with parameters: ${privateValue}`, { cause });
    tagService.listTags.mockRejectedValueOnce(error);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await createApp().request(
      `/api/trpc/tags.list?secret=${privateValue}`,
      { headers: { ...testAuthHeaders(), "x-request-id": "trpc-error-test", cookie: "session=private-cookie" } },
      ENV,
    );

    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({ error: { message: "An internal server error occurred." } });
    expect(errorLog).toHaveBeenCalledTimes(1);
    const logged = errorLog.mock.calls[0][0] as string;
    expect(JSON.parse(logged)).toMatchObject({
      level: "error", requestId: "trpc-error-test", path: "/api/trpc/tags.list",
      procedure: "tags.list", type: "query", code: "INTERNAL_SERVER_ERROR",
      error: { name: "Error", pgCode: "23505", constraint: "users_email_key" },
      stack: expect.stringContaining("at "),
    });
    expect(logged).not.toContain(privateValue);
    expect(logged).not.toContain("private-cookie");
    expect(logged).not.toContain("Failed query");
  });

  it("does not log validation failures as internal exceptions", async () => {
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await createApp().request("/api/trpc/tags.create", {
      method: "POST", headers: { ...testAuthHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ name: "" }),
    }, ENV);
    expect(response.status).toBe(400);
    expect(errorLog).not.toHaveBeenCalled();
  });

  it("serves a typed tag query through /api/trpc", async () => {
    tagService.listTags.mockResolvedValue({
      count: 1,
      results: [sampleTag],
    });
    const input = encodeURIComponent(JSON.stringify({ limit: 25, offset: 5 }));

    const response = await createApp().request(
      `/api/trpc/tags.list?input=${input}`,
      { headers: testAuthHeaders() },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: {
        data: {
          data: [sampleTag],
          meta: { total: 1, limit: 25, offset: 5 },
        },
      },
    });
    expect(tagService.listTags).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
      25,
      5,
    );
  });

  it("serves a typed tag mutation and applies schema defaults", async () => {
    tagService.createUserTag.mockResolvedValue({ tag: sampleTag });

    const response = await createApp().request(
      "/api/trpc/tags.create",
      {
        method: "POST",
        headers: {
          ...testAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ name: "Lecture" }),
      },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: sampleTag } });
    expect(tagService.createUserTag).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
      "Lecture",
      "gray",
    );
  });

  it("routes tag updates through the shared procedure contract", async () => {
    const updatedTag = { ...sampleTag, name: "Updated", color: "green" };
    tagService.updateUserTag.mockResolvedValue({ tag: updatedTag });

    const response = await createApp().request(
      "/api/trpc/tags.update",
      {
        method: "POST",
        headers: {
          ...testAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ id: 3, name: "Updated", color: "green" }),
      },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: updatedTag } });
    expect(tagService.updateUserTag).toHaveBeenCalledWith(
      ENV,
      3,
      TEST_USER_ID,
      { name: "Updated", color: "green" },
    );
  });

  it("routes tag deletion and returns success", async () => {
    tagService.removeTag.mockResolvedValue({ ok: true });

    const response = await createApp().request(
      "/api/trpc/tags.delete",
      {
        method: "POST",
        headers: {
          ...testAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ id: 3 }),
      },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ result: { data: { success: true } } });
    expect(tagService.removeTag).toHaveBeenCalledWith(ENV, 3, TEST_USER_ID);
  });

  it("serves cursor-paginated courses through the shared router", async () => {
    courseService.listCourses.mockResolvedValue({
      count: 9,
      results: [sampleCourse],
    });
    const input = encodeURIComponent(JSON.stringify({ limit: 24, cursor: 5 }));

    const response = await createApp().request(
      `/api/trpc/courses.list?input=${input}`,
      { headers: testAuthHeaders() },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: {
        data: {
          data: [sampleCourse],
          meta: { total: 9, limit: 24, offset: 5 },
        },
      },
    });
    expect(courseService.listCourses).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
      24,
      5,
    );
  });

  it("creates and reorders courses through typed mutations", async () => {
    courseService.createUserCourse.mockResolvedValue(sampleCourse);
    courseService.reorderUserCourses.mockResolvedValue({ ok: true });

    const createResponse = await createApp().request(
      "/api/trpc/courses.create",
      {
        method: "POST",
        headers: {
          ...testAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: sampleCourse.name,
          description: sampleCourse.description,
        }),
      },
      ENV,
    );
    const reorderResponse = await createApp().request(
      "/api/trpc/courses.reorder",
      {
        method: "POST",
        headers: {
          ...testAuthHeaders(),
          "content-type": "application/json",
        },
        body: JSON.stringify({ courseIds: [7, 8] }),
      },
      ENV,
    );

    expect(createResponse.status).toBe(200);
    expect(await createResponse.json()).toEqual({
      result: { data: sampleCourse },
    });
    expect(courseService.createUserCourse).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
      sampleCourse.name,
      sampleCourse.description,
    );
    expect(reorderResponse.status).toBe(200);
    expect(await reorderResponse.json()).toEqual({
      result: { data: { courseIds: [7, 8] } },
    });
    expect(courseService.reorderUserCourses).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
      [7, 8],
    );
  });

  it("serves video status counts through tRPC", async () => {
    videoService.getUserVideoStats.mockResolvedValue(sampleVideoStats);

    const response = await createApp().request(
      "/api/trpc/videos.statusCounts",
      { headers: testAuthHeaders() },
      ENV,
    );

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      result: { data: sampleVideoStats },
    });
    expect(videoService.getUserVideoStats).toHaveBeenCalledWith(
      ENV,
      TEST_USER_ID,
    );
  });

});
