import { Router } from 'express';
import { ask } from '../controllers/aiController.js';

const router = Router();

// POST /api/ai/ask - send a question, get back the analysis.
router.post('/ask', ask);

export default router;