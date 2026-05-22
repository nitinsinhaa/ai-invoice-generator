import express from 'express';
import productController from '../controllers/productController.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validateZod.js';
import { productSchema } from '../validations/schemas.js';

const router = express.Router();

router.use(authenticate);

router.post('/', validate(productSchema), productController.createProduct);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put('/:id', validate(productSchema.partial()), productController.updateProduct);
router.delete('/:id', productController.deleteProduct);
router.patch('/:id/stock', productController.updateStock);

export default router;
