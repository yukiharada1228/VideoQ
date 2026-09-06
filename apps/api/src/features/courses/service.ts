import {
  createCourse,
  deleteCourse,
  getCourseDetail,
  getCourseDetailByShareSlug,
  getCourseShareSlug,
  listCoursesPage,
  reorderCourses,
  setShareSlug,
  updateCourse,
} from "../../repositories/course-repository";
import {
  normalizeShareSlug,
  SLUG_ALREADY_EXISTS_MESSAGE,
} from "../../lib/share-slug";
import type { Bindings } from "../../types/bindings";
import type { CreationIdempotency } from "../../repositories/mcp-idempotency-repository";

export async function listCourses(
  env: Bindings,
  userId: string,
  limit: number,
  offset: number,
) {
  return listCoursesPage(env, userId, limit, offset);
}

export async function getCourse(env: Bindings, courseId: number, userId: string) {
  return getCourseDetail(env, courseId, userId);
}

export async function getSharedCourse(env: Bindings, slug: string) {
  return getCourseDetailByShareSlug(env, slug);
}

export async function createUserCourse(
  env: Bindings,
  userId: string,
  name: string,
  description: string,
) {
  const created = await createCourse(env, userId, name, description);
  if ("idempotencyConflict" in created) {
    throw new Error("Unexpected idempotency conflict without an idempotency key.");
  }
  return getCourseDetail(env, created.courseId, userId);
}

/** MCP 用: 同じ key + payload の再試行では同じ講座を返す。 */
export async function createUserCourseIdempotent(
  env: Bindings,
  userId: string,
  name: string,
  description: string,
  idempotency: CreationIdempotency,
) {
  const created = await createCourse(
    env,
    userId,
    name,
    description,
    idempotency,
  );
  if ("idempotencyConflict" in created) return created;
  return {
    course: await getCourseDetail(env, created.courseId, userId),
    reused: created.reused,
  } as const;
}

export async function updateUserCourse(
  env: Bindings,
  courseId: number,
  userId: string,
  data: { name?: string; description?: string },
) {
  const res = await updateCourse(env, courseId, userId, data);
  if ("notFound" in res) return { notFound: true } as const;
  return { course: await getCourseDetail(env, courseId, userId) } as const;
}

export async function removeCourse(env: Bindings, courseId: number, userId: string) {
  return deleteCourse(env, courseId, userId);
}

export async function reorderUserCourses(
  env: Bindings,
  userId: string,
  courseIds: number[],
) {
  return reorderCourses(env, userId, courseIds);
}

export async function saveShareLink(
  env: Bindings,
  courseId: number,
  userId: string,
  rawSlug: string,
) {
  const cur = await getCourseShareSlug(env, courseId, userId);
  if (!cur.found) return { notFound: true as const };
  const norm = normalizeShareSlug(rawSlug);
  if ("error" in norm) return { error: norm.error } as const;
  const res = await setShareSlug(env, courseId, userId, norm.slug);
  if ("conflict" in res) {
    return { conflict: SLUG_ALREADY_EXISTS_MESSAGE } as const;
  }
  return { share_slug: norm.slug } as const;
}

export async function clearShareLink(
  env: Bindings,
  courseId: number,
  userId: string,
) {
  const cur = await getCourseShareSlug(env, courseId, userId);
  if (!cur.found) return { notFound: true as const };
  if (!cur.slug) return { notConfigured: true as const };
  await setShareSlug(env, courseId, userId, null);
  return { ok: true as const };
}
