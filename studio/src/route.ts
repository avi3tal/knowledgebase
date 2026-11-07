export type Route =
  | { page: "dashboard"; subject: string }
  | { page: "lesson"; subject: string; topic: string }
  | { page: "problem"; subject: string; slug: string }
  | { page: "problems"; subject: string }
  | { page: "topic"; subject: string; topic: string }
  | { page: "map"; subject: string };

const ID = /^[a-z0-9-]+$/;

export function parseRoute(hash: string): Route {
  const [kind, subject = "algo", id = ""] = hash.replace(/^#\/?/, "").split("/");
  if (kind === "learn" && ID.test(subject) && ID.test(id))
    return { page: "lesson", subject, topic: id };
  if (kind === "problem" && ID.test(subject) && ID.test(id))
    return { page: "problem", subject, slug: id };
  if (kind === "problems" && ID.test(subject)) return { page: "problems", subject };
  if (kind === "topic" && ID.test(subject) && ID.test(id))
    return { page: "topic", subject, topic: id };
  if (kind === "map" && ID.test(subject)) return { page: "map", subject };
  return { page: "dashboard", subject: ID.test(subject) ? subject : "algo" };
}
