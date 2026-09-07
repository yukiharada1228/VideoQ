import { and, eq, or, sql } from "drizzle-orm";
import { withDb } from "../db/pool";
import {
  videos,
  videoCourses,
  videoCourseMembers,
  videoCourseMemberships,
} from "../db/schema";
import type { Bindings } from "../types/bindings";

/** path traversal を拒否する。 */
export function isSafeMediaPath(path: string): boolean {
  if (!path || path.startsWith("/") || path.includes("\\")) return false;
  const parts = path.split("/");
  return !parts.some((p) => p === ".." || p === "");
}

/** Resolve the file and its authorization in one query/connection. */
export async function isMediaPathAccessible(
  env: Bindings,
  path: string,
  opts: { userId?: string; shareCourseId?: number },
): Promise<boolean> {
  if (!isSafeMediaPath(path)) return false;
  const permission = opts.shareCourseId != null
    ? sql`EXISTS (
        SELECT 1 FROM ${videoCourseMembers}
        WHERE ${videoCourseMembers.videoId} = ${videos.id}
          AND ${videoCourseMembers.courseId} = ${opts.shareCourseId}
      )`
    : opts.userId != null
      ? or(
          eq(videos.userId, opts.userId),
          sql`EXISTS (
            SELECT 1 FROM ${videoCourseMembers}
            JOIN ${videoCourseMemberships}
              ON ${videoCourseMemberships.courseId} = ${videoCourseMembers.courseId}
            WHERE ${videoCourseMembers.videoId} = ${videos.id}
              AND ${videoCourseMemberships.userId} = ${opts.userId}
          )`,
        )
      : undefined;
  if (!permission) return false;
  return withDb(env, async (db) => {
    const rows = await db
      .select({ id: videos.id })
      .from(videos)
      .where(and(eq(videos.file, path), permission))
      .limit(1);
    return rows.length > 0;
  });
}

/** share_slug から course_id を解決する。 */
export async function resolveShareSlugCourseId(
  env: Bindings,
  shareSlug: string,
): Promise<number | null> {
  return withDb(env, async (db) => {
    const rows = await db
      .select({ id: videoCourses.id })
      .from(videoCourses)
      .where(eq(videoCourses.shareSlug, shareSlug))
      .limit(1);
    return rows[0]?.id ?? null;
  });
}
