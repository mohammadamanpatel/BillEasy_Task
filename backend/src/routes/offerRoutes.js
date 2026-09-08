import { Router } from 'express';
import { listOffers, createOffer, deleteOffer } from '../controllers/offerController.js';

const router = Router();

// GET /api/offers - list saved offers.
router.get('/', listOffers);
// POST /api/offers - save a new offer.
router.post('/', createOffer);
// DELETE /api/offers/:id - remove offer number :id.
router.delete('/:id', deleteOffer);

export default router;