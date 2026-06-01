import { Router } from "express";
import { createReview } from "../controllers/reviewController";
import { reviewRateLimiter } from "../middleware/reviewRateLimiter";

const router = Router();

router.post("/review", reviewRateLimiter, createReview);

export default router;
