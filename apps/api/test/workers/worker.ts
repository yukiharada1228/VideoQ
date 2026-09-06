export { RateLimiter } from "../../src/durable-objects/rate-limiter";
export { StudySession } from "../../src/durable-objects/study-session";

export default {
  fetch(): Response {
    return new Response("Workers runtime test entrypoint");
  },
} satisfies ExportedHandler<CloudflareBindings>;
