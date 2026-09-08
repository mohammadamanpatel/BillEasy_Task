import Business from '../models/Business.js';

// The app has no logins yet, so every request works on the same shop:
// the first business in the database.
export async function getDefaultBusiness() {
  const business = await Business.findOne({ order: [['id', 'ASC']] });
  if (!business) {
    throw new Error('No business found. Run "npm run seed" first.');
  }
  return business;
}