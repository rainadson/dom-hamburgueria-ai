import { randomUUID } from "node:crypto";
import type { RequestHandler, Response } from "express";

export const requestContext: RequestHandler = (_req, res, next) => {
  const requestId = randomUUID();
  res.locals.requestId = requestId;
  res.setHeader("X-Request-ID", requestId);
  next();
};

export function reportFailure(res: Response, category: string) {
  const requestId = res.locals.requestId || "unavailable";
  console.error(`${category} [request_id=${requestId}]`);
}
