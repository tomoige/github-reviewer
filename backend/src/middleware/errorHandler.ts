import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";

/**
 * Central error middleware. Translates AppErrors into their intended status
 * codes and shields unexpected errors behind a generic 500.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
    return;
  }

  console.error("Unexpected error:", err);
  res.status(500).json({ error: "Something went wrong. Please try again." });
}
