import CustomerGroup from '../models/CustomerGroup.js';

// Return all customer groups (Regular, New, Inactive, etc.), in id order.
export async function listCustomerGroups(_req, res) {
  try {
    const groups = await CustomerGroup.findAll({ order: [['id', 'ASC']] });
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}