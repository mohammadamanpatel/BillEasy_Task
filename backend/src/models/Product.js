import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// The "products" table. A product is something the shop sells.
// The two prices below are the heart of every offer calculation.
const Product = sequelize.define(
  'Product',
  {
    // A number to tell products apart.
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Which shop this product belongs to.
    businessId: { type: DataTypes.INTEGER, allowNull: false },
    // The product name, like "Milk".
    name: { type: DataTypes.STRING, allowNull: false },
    // What the customer pays.
    sellingPrice: { type: DataTypes.FLOAT, allowNull: false },
    // What the product costs the shop.
    costPrice: { type: DataTypes.FLOAT, allowNull: false },
  },
  { tableName: 'products', createdAt: 'created_at', updatedAt: false }
);

export default Product;