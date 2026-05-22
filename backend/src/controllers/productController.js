import productService from '../services/productService.js';
import { ApiResponse } from '../utils/response.js';

class ProductController {
  async createProduct(req, res, next) {
    try {
      const product = await productService.createProduct(req.user.id, req.body);
      return ApiResponse.created(res, product, 'Product created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getProducts(req, res, next) {
    try {
      const products = await productService.getAllProducts(req.user.id);
      return ApiResponse.success(res, products);
    } catch (error) {
      next(error);
    }
  }

  async getProductById(req, res, next) {
    try {
      const product = await productService.getProductById(req.user.id, req.params.id);
      return ApiResponse.success(res, product);
    } catch (error) {
      next(error);
    }
  }

  async updateProduct(req, res, next) {
    try {
      const product = await productService.updateProduct(
        req.user.id,
        req.params.id,
        req.body
      );
      return ApiResponse.success(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async deleteProduct(req, res, next) {
    try {
      await productService.deleteProduct(req.user.id, req.params.id);
      return ApiResponse.success(res, null, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async updateStock(req, res, next) {
    try {
      const { quantity } = req.body;
      const product = await productService.updateStock(
        req.user.id,
        req.params.id,
        quantity
      );
      return ApiResponse.success(res, product, 'Stock updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
