export type Route =
  | { page: "dashboard"; subject: string }
  | { page: "lesson"; subject: string; topic: string }
  | { page: "problem"; subject: string; slug: string };

const ID = /^[a-z0-9-]+$/;

export function parseRoute(hash: string): Route {
  const [kind, subject = "algo", id = ""] = hash.replace(/^#\/?/, "").split("/");
  if (kind === "learn" && ID.test(subject) && ID.test(id))
    return { page: "lesson", subject, topic: id };
  if (kind === "problem" && ID.test(subject) && ID.test(id))
    return { page: "problem", subject, slug: id };
  return { page: "dashboard", subject: ID.test(subject) ? subject : "algo" };
}
