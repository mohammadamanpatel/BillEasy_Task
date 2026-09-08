import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

// The "customer_groups" table. A label for a type of customer,
// like Regular, New, Inactive or High Spending.
const CustomerGroup = sequelize.define(
  'CustomerGroup',
  {
    // A number to tell groups apart.
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    // The group name. Unique so we do not store it twice.
    name: { type: DataTypes.STRING, allowNull: false, unique: true },
    // A short explanation of who belongs to this group.
    description: { type: DataTypes.TEXT, allowNull: true },
  },
  { tableName: 'customer_groups', timestamps: false }
);

export default CustomerGroup;