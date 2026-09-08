import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// The "businesses" table. A business is one shop.
const Business = sequelize.define(
  'Business',
  {
    // A number to tell one business apart from another.
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // The shop's name.
    name: { type: DataTypes.STRING, allowNull: false },
  },
  { tableName: 'businesses', timestamps: false }
);

export default Business;