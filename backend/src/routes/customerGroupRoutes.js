import { Router } from 'express';
import { listCustomerGroups } from '../controllers/customerGroupController.js';

const router = Router();

// GET /api/customer-groups - list all customer groups.
router.get('/', listCustomerGroups);

export default router;