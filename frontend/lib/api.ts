import { ReviewResponse } from "./types";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

/**
 * Requests a profile review from the backend.
 * Throws an Error with the backend's message on non-2xx responses.
 */
export async function requestReview(username: string): Promise<ReviewResponse> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}/api/review`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username }),
    });
  } catch {
    throw new Error(
      "Could not reach the GitReview AI server. Is the backend running?"
    );
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      (data && typeof data.error === "string" && data.error) ||
      "Something went wrong while generating the review.";
    throw new Error(message);
  }

  return data as ReviewResponse;
}
