import CustomerGroup from '../models/CustomerGroup.js';
import Product from '../models/Product.js';
import { analyzeOffer } from '../services/analysisService.js';
import * as ai from '../services/aiService.js';
import { getDefaultBusiness } from '../services/businessService.js';

// Find a product whose name matches what the owner meant.
// Tries from most exact to most forgiving.
function findProductByName(products, productName) {
  const name = productName?.trim();
  if (!name) return null;
  const lower = name.toLowerCase();
  return (
    products.find((p) => p.name.toLowerCase() === lower) ||
    products.find((p) => p.name.toLowerCase().includes(lower)) ||
    products.find((p) => lower.includes(p.name.toLowerCase())) ||
    null
  );
}

// Single entry point for a user's question.
export async function ask(req, res) {
  try {
    // The owner's words from the request body.
    const prompt = req.body?.prompt;
    // We cannot work with an empty question.
    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ error: 'A prompt is required.' });
    }

    // Which shop? Defaults to the first business in the DB.
    const businessId = req.body?.businessId || (await getDefaultBusiness()).id;

    // Load this shop's products and the customer groups.
    const products = await Product.findAll({ where: { businessId } });
    const groups = await CustomerGroup.findAll({ order: [['id', 'ASC']] });

    // Step 1: the AI reads the words and returns structured facts.
    const extraction = await ai.extractOfferDetails(prompt, products, groups);

    // Find the product the owner meant among the real products.
    const product = findProductByName(products, extraction.productName);

    // Case A: the product does not exist.
    if (!product) {
      // Ask the AI to politely list the real products.
      const explanation = await ai.explainProductNotFound(
        extraction.productName || 'the product',
        products
      );
      // needsMoreInfo tells the frontend to just show the text,
      // since there is no analysis yet.
      return res.json({
        extraction,
        analysis: null,
        explanation,
        needsMoreInfo: true,
        aiMode: ai.aiMode(),
      });
    }

    // Case B: the owner did not say the discount amount.

    // A usable discount must be a number bigger than zero.
    const hasValidDiscount =
      extraction.discountValue !== null &&
      extraction.discountValue !== undefined &&
      Number(extraction.discountValue) > 0;

    if (!hasValidDiscount) {
      // Compute the safe limit for this product (0% discount = the
      // product's own numbers).
      const margins = analyzeOffer({
        sellingPrice: product.sellingPrice,
        costPrice: product.costPrice,
        discountType: 'percentage',
        discountValue: 0,
      });
      // Ask the AI to request the number and mention the limit.
      const explanation = await ai.suggestDiscount(extraction, product, margins);
      return res.json({
        extraction,
        analysis: null,
        explanation,
        needsMoreInfo: true,
        aiMode: ai.aiMode(),
      });
    }

    // Case C: the discount is silly or impossible.

    // Fixed (Rs) unless the AI clearly said percentage.
    const discountType = extraction.discountType === 'fixed' ? 'fixed' : 'percentage';

    // A discount that makes the price negative or free makes no sense.
    const impossibleDiscount =
      discountType === 'percentage'
        ? Number(extraction.discountValue) > 90
        : Number(extraction.discountValue) >= product.sellingPrice;

    if (impossibleDiscount) {
      // Reject with a clear, honest explanation.
      const explanation =
        discountType === 'percentage'
          ? `A ${extraction.discountValue}% discount is not realistic and would push the final price negative. Please enter a discount between 1% and 90%.`
          : `A Rs ${extraction.discountValue} discount is at or above the selling price (Rs ${product.sellingPrice}). Please enter a smaller amount.`;
      return res.json({
        extraction,
        analysis: null,
        explanation,
        needsMoreInfo: true,
        aiMode: ai.aiMode(),
      });
    }

    // Case D: everything checks out - do the math.

    // The BACKEND calculates every money number.
    const analysis = analyzeOffer({
      sellingPrice: product.sellingPrice,
      costPrice: product.costPrice,
      discountType,
      discountValue: Number(extraction.discountValue),
    });

    // Match the named customer group to a real group id.
    const customerGroupName = extraction.customerGroupName?.trim();
    const customerGroup = customerGroupName
      ? groups.find((g) => g.name.toLowerCase() === customerGroupName.toLowerCase()) || null
      : null;

    // The AI takes the exact backend numbers and explains them.
    const explanation = await ai.explainResult(extraction, product, analysis, groups, products);

    // Send the complete package to the frontend.
    res.json({
      extraction: { ...extraction, customerGroupId: customerGroup?.id || null },
      product: { id: product.id, name: product.name },
      customerGroup: customerGroup ? { id: customerGroup.id, name: customerGroup.name } : null,
      analysis,
      explanation,
      needsMoreInfo: false,
      aiMode: ai.aiMode(),
    });
  } catch (err) {
    // Never let the server crash on a question.
    console.error('ask error:', err);
    res.status(500).json({ error: 'Something went wrong processing your request.' });
  }
}