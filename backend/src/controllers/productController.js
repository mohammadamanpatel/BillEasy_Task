import Product from '../models/Product.js';
import { getDefaultBusiness } from '../services/businessService.js';

// Show all products of the default shop.
export async function listProducts(req, res) {
  try {
    // The default shop, unless the request says otherwise.
    const businessId = req.query.businessId || (await getDefaultBusiness()).id;
    // Find every product of that shop, oldest first.
    const products = await Product.findAll({ where: { businessId }, order: [['id', 'ASC']] });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add a new product to the database.
export async function createProduct(req, res) {
  try {
    // The details the frontend sent.
    const { name, sellingPrice, costPrice } = req.body;

    // Validate the input before saving anything.
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (sellingPrice === undefined || Number(sellingPrice) <= 0) {
      return res.status(400).json({ error: 'Selling price must be greater than 0.' });
    }
    if (costPrice === undefined || Number(costPrice) < 0) {
      return res.status(400).json({ error: 'Cost price cannot be negative.' });
    }

    // Find the shop, then save the product.
    const business = await getDefaultBusiness();
    const product = await Product.create({
      businessId: business.id,
      name: name.trim(),
      sellingPrice: Number(sellingPrice),
      costPrice: Number(costPrice),
    });

    // 201 means "successfully created".
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Delete a product to remove a mistaken entry.
export async function deleteProduct(req, res) {
  try {
    // The :id part of the URL, e.g. /api/products/7 -> id = 7
    const id = Number(req.params.id);
    const business = await getDefaultBusiness();
    // Find the product, but only if it belongs to our shop.
    const product = await Product.findOne({ where: { id, businessId: business.id } });

    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Remove it from the database.
    await product.destroy();
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}