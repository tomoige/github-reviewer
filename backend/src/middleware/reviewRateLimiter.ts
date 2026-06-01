import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

const WINDOW_MS = 60_000;
const store = new Map<string, number>();

function clientIp(req: Request): string {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.ip ?? req.socket.remoteAddress ?? "unknown";
}

function pruneStaleEntries(now: number): void {
  for (const [ip, timestamp] of store) {
    if (now - timestamp >= WINDOW_MS) {
      store.delete(ip);
    }
  }
}

/**
 * Limits POST /api/review to one request per IP per minute.
 */
export function reviewRateLimiter(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const now = Date.now();
  pruneStaleEntries(now);

  const ip = clientIp(req);
  const lastRequest = store.get(ip);

  if (lastRequest !== undefined && now - lastRequest < WINDOW_MS) {
    const retryAfterSec = Math.ceil((WINDOW_MS - (now - lastRequest)) / 1000);
    _res.setHeader("Retry-After", String(retryAfterSec));
    next(
      new AppError(
        429,
        `Please wait ${retryAfterSec} second${retryAfterSec === 1 ? "" : "s"} before requesting another review.`
      )
    );
    return;
  }

  store.set(ip, now);
  next();
}
