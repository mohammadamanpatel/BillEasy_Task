import Business from './Business.js';
import Product from './Product.js';
import CustomerGroup from './CustomerGroup.js';
import Offer from './Offer.js';
import { sequelize } from '../config/database.js';

// Tell the database how the tables relate to each other.

// A business owns many products, and each product belongs to one business.
Business.hasMany(Product, { foreignKey: 'businessId', as: 'products' });
Product.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

// A business owns many offers, and each offer belongs to one business.
Business.hasMany(Offer, { foreignKey: 'businessId', as: 'offers' });
Offer.belongsTo(Business, { foreignKey: 'businessId', as: 'business' });

// A product appears in many offers, and each offer is about one product.
Product.hasMany(Offer, { foreignKey: 'productId', as: 'offers' });
Offer.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

// A customer group is used by many offers, and each offer targets one group.
CustomerGroup.hasMany(Offer, { foreignKey: 'customerGroupId', as: 'offers' });
Offer.belongsTo(CustomerGroup, { foreignKey: 'customerGroupId', as: 'customerGroup' });

// Re-export everything so any file can import from this one place.
export { sequelize, Business, Product, CustomerGroup, Offer };