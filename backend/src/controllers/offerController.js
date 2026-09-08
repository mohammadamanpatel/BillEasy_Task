import Offer from '../models/Offer.js';
import Product from '../models/Product.js';
import CustomerGroup from '../models/CustomerGroup.js';
import { analyzeOffer } from '../services/analysisService.js';
import { getDefaultBusiness } from '../services/businessService.js';

// Show all saved offers, with the product and customer group details
// filled in alongside, newest first.
export async function listOffers(req, res) {
  try {
    const businessId = req.query.businessId || (await getDefaultBusiness()).id;
    const offers = await Offer.findAll({
      where: { businessId },
      order: [['created_at', 'DESC']],
      // Attach the matching product and customer group details.
      include: [
        { model: Product, as: 'product', attributes: ['id', 'name', 'sellingPrice', 'costPrice'] },
        { model: CustomerGroup, as: 'customerGroup', attributes: ['id', 'name'] },
      ],
    });
    res.json(offers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Save a new offer that the owner approved.
export async function createOffer(req, res) {
  try {
    const { productId, customerGroupId, discountType, discountValue } = req.body;

    // Reject anything incomplete or nonsensical.
    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' });
    }
    if (!['percentage', 'fixed'].includes(discountType)) {
      return res.status(400).json({ error: 'discountType must be "percentage" or "fixed".' });
    }
    if (!discountValue || Number(discountValue) <= 0) {
      return res.status(400).json({ error: 'discountValue must be greater than 0.' });
    }

    // The product must really exist and belong to our shop.
    const business = await getDefaultBusiness();
    const product = await Product.findOne({ where: { id: Number(productId), businessId: business.id } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found.' });
    }

    // Impossible discounts never get saved.
    if (discountType === 'percentage' && Number(discountValue) > 90) {
      return res.status(400).json({ error: 'Percentage discount cannot be greater than 90%.' });
    }
    if (discountType === 'fixed' && Number(discountValue) >= product.sellingPrice) {
      return res.status(400).json({ error: 'Fixed discount must be less than the selling price.' });
    }

    // A chosen customer group must really exist.
    if (customerGroupId) {
      const group = await CustomerGroup.findByPk(Number(customerGroupId));
      if (!group) {
        return res.status(400).json({ error: 'Customer group not found.' });
      }
    }

    // Backend math decides the verdict.
    const analysis = analyzeOffer({
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      discountType,
      discountValue: Number(discountValue),
    });

    // Save the offer together with the verdict status.
    const offer = await Offer.create({
      businessId: business.id,
      productId: Number(productId),
      customerGroupId: customerGroupId ? Number(customerGroupId) : null,
      discountType,
      discountValue: Number(discountValue),
      status: analysis.status,
    });

    res.status(201).json(offer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Remove a saved offer that the owner decides to delete.
export async function deleteOffer(req, res) {
  try {
    const id = Number(req.params.id);

    if (!id) {
      return res.status(400).json({ error: 'Offer id is required.' });
    }

    const business = await getDefaultBusiness();
    const offer = await Offer.findOne({ where: { id, businessId: business.id } });

    if (!offer) {
      return res.status(404).json({ error: 'Offer not found.' });
    }

    await offer.destroy();
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}