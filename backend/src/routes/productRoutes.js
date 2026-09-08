import { Router } from 'express';
import { listProducts, createProduct, deleteProduct } from '../controllers/productController.js';

const router = Router();

// GET /api/products - list all products.
router.get('/', listProducts);
// POST /api/products - add a product.
router.post('/', createProduct);
// DELETE /api/products/:id - delete product number :id.
router.delete('/:id', deleteProduct);

export default router;