import productRepository from '../repositories/productRepository.js';

class ProductService {
  async createProduct(userId, productData) {
    const product = await productRepository.create({
      user_id: userId,
      ...productData,
    });

    return product;
  }

  async getAllProducts(userId) {
    const products = await productRepository.findAll(userId);
    return products;
  }

  async getProductById(userId, productId) {
    const product = await productRepository.findById(productId, userId);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async updateProduct(userId, productId, updateData) {
    const product = await productRepository.update(productId, userId, updateData);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }

  async deleteProduct(userId, productId) {
    await productRepository.delete(productId, userId);
  }

  async updateStock(userId, productId, quantity) {
    const product = await productRepository.updateStock(productId, userId, quantity);
    
    if (!product) {
      throw new Error('Product not found');
    }

    return product;
  }
}

export default new ProductService();
