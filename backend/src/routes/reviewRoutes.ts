import { Router } from "express";
import { createReview } from "../controllers/reviewController";

const router = Router();

router.post("/review", createReview);

export default router;
