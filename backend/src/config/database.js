import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load the .env file so we can read DATABASE_URL.
dotenv.config();

// Connect to PostgreSQL using the address from .env.
export const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  logging: false,
});

// Say hello to the database.
export async function connectDatabase() {
  await sequelize.authenticate();
  console.log('Database connected.');
}

// Create the tables if they do not exist yet.
export async function syncDatabase() {
  await sequelize.sync();
  console.log('Database models synced.');
}