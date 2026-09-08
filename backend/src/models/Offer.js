import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// The "offers" table. An offer is saved only when the owner approves it.
// The analysis numbers are not stored here - they are always recalculated
// from the current product prices.
const Offer = sequelize.define(
  'Offer',
  {
    // A number to tell offers apart.
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // Which shop this offer belongs to.
    businessId: { type: DataTypes.INTEGER, allowNull: false },
    // Which product is being discounted.
    productId: { type: DataTypes.INTEGER, allowNull: false },
    // Which customer group it targets. Missing means all customers.
    customerGroupId: { type: DataTypes.INTEGER, allowNull: true },
    // "percentage" means 10% off, "fixed" means Rs 10 off.
    discountType: { type: DataTypes.ENUM('percentage', 'fixed'), allowNull: false },
    // The number, e.g. 10 for "10% off".
    discountValue: { type: DataTypes.FLOAT, allowNull: false },
    // The backend's verdict: GOOD, RISKY or LOSS.
    status: { type: DataTypes.ENUM('GOOD', 'RISKY', 'LOSS'), allowNull: false },
  },
  { tableName: 'offers', createdAt: 'created_at', updatedAt: false }
);

export default Offer;