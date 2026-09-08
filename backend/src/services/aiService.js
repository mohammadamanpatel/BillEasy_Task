import dotenv from 'dotenv';

dotenv.config();

// Setup values from the .env file.
const API_KEY = process.env.GEMINI_API_KEY;
const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash';
const AI_MODE = process.env.AI_MODE || 'auto';

// Decide which AI to use: gemini, auto (key present -> gemini), or mock.
const USE_GEMINI =
  AI_MODE === 'gemini' ||
  (AI_MODE === 'auto' && Boolean(API_KEY));

// The internet address of Gemini's "generate content" service.
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

// Send a prompt to Gemini and ask for a JSON reply.
async function callGeminiJson(prompt) {
  const response = await fetch(`${GEMINI_URL}?key=${API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        // Demand JSON so the backend can read it reliably.
        responseMimeType: 'application/json',
        // Low temperature = fewer wild answers, better for facts.
        temperature: 0.3,
      },
    }),
  });

  // Throw if Gemini is unhappy (bad key, network error, etc.).
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${body}`);
  }

  // Pull the text answer out of the reply.
  const data = await response.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned an empty response.');

  return JSON.parse(text);
}

// Build simple text lists for the AI to see.
function describeProducts(products) {
  return products.map((p) => `- ${p.name}`).join('\n');
}

// Build a list of customer group names.
function describeCustomerGroups(groups) {
  return groups.map((g) => `- ${g.name}`).join('\n');
}

// A fuller list with prices and margins, used to suggest alternatives.
function listAlternativeProducts(products) {
  return products
    .map((p) => {
      const margin = p.sellingPrice > 0
        ? Math.round(((p.sellingPrice - p.costPrice) / p.sellingPrice) * 100)
        : 0;
      return `- ${p.name}: selling Rs ${p.sellingPrice}, cost Rs ${p.costPrice} (about ${margin}% margin)`;
    })
    .join('\n');
}

// REAL AI (Gemini): each function sends a prompt and returns JSON.

// Ask Gemini to turn the owner's words into structured facts.
async function geminiExtractOfferDetails(prompt, products, groups) {
  const systemPrompt = `You help a small business understand natural language offer requests.

The owner said: "${prompt}"

The business sells these products (match the exact listed name when possible):
${describeProducts(products)}

Known customer groups (match the exact listed name when possible):
${describeCustomerGroups(groups)}

Return JSON exactly like this:
{
  "productName": "the product the owner means. Use the exact listed name if it matches. If it does not match any listed product, still return the name the owner used.",
  "discountType": "percentage" if a percentage discount, "fixed" if a fixed rupee discount, else null,
  "discountValue": the number (percent or rupees), or null if not mentioned,
  "customerGroupName": the exact group name if the owner mentioned a group, else null,
  "businessGoal": a short phrase describing what the owner wants to achieve (for example \"Bring inactive customers back\"), or null if not mentioned
}

Rules:
- "10% off" or "10 percent less" means discountType "percentage", discountValue 10.
- "Rs 20 off", "20 rupees off" or "give 20 off with a rupee sign" means discountType "fixed", discountValue 20.
- If the owner gives a plain number without % or rupees (like "give 20 off"), use "percentage" by default.
- Never invent a discount; if the owner did not mention one, discountValue is null.`;

  return callGeminiJson(systemPrompt);
}

// Ask Gemini to politely explain that a product was not found.
async function geminiExplainProductNotFound(productName, products) {
  const prompt = `A small business owner asked about an offer. I could not find the product "${productName}" in their products.

Their actual products are:
${describeProducts(products)}

Respond in plain English, max 3 sentences, friendly but clear. Say the product was not found, list a couple of their current products so they see the format, and tell them they can add the product first. Reply with JSON: {"text": "..."}`;

  const result = await callGeminiJson(prompt);
  return result.text;
}

// Ask Gemini to request the missing discount and mention the safe limit.
async function geminiSuggestDiscount(extraction, product, margins) {
  const prompt = `A small business owner said: "${extraction.originalPrompt}"

They clearly want to discount the product "${product.name}", but did not say how much.

Facts (from the backend, these numbers are accurate):
- Selling price: Rs ${product.sellingPrice}
- Cost price: Rs ${product.costPrice}
- Current profit per sale: Rs ${margins.originalProfit}
- Current margin: ${margins.originalMarginPercent}%
- The maximum discount that avoids a loss is about ${margins.safeMaxDiscountPercent}% (Rs ${margins.safeMaxDiscountAmount}).

Reply JSON: {"text": "..."} where text is plain English, max 3 sentences. Ask how much discount they want, and naturally mention that beyond about ${margins.safeMaxDiscountPercent}% they would lose money on this product.`;

  const result = await callGeminiJson(prompt);
  return result.text;
}

// The main explanation. The numbers are EXACT and must not be changed -
// Gemini only explains them and may suggest a smarter alternative.
async function geminiExplainResult(extraction, product, analysis, groups, allProducts) {
  const goal = extraction.businessGoal
    ? extraction.businessGoal
    : 'a general sales boost';
  const group = extraction.customerGroupName
    ? extraction.customerGroupName
    : 'customers in general';

  const prompt = `A small business owner asked: "${extraction.originalPrompt}"

You are explaining the result of a financial analysis computed by the backend. These numbers are EXACT and must not be changed. You may round to a reasonable rupee amount in plain English.

Product: ${product.name}
Selling price: Rs ${product.sellingPrice}
Cost price: Rs ${product.costPrice}
Customer group: ${group}
Business goal: ${goal}
Discount: ${extraction.discountType === 'fixed' ? 'Rs' : ''} ${extraction.discountValue}${extraction.discountType === 'percentage' ? '%' : ''}

Backend financial analysis:
- Current profit per sale: Rs ${analysis.originalProfit}
- Discount amount per sale: Rs ${analysis.discountAmount}
- Final price for customer: Rs ${analysis.finalPrice}
- New profit per sale: Rs ${analysis.newProfit}
- Current margin: ${analysis.originalMarginPercent}%
- New margin: ${analysis.newMarginPercent}%
- Profit reduced by: ${analysis.profitReductionPercent}%
- Verdict: ${analysis.status}

Other products and their margins (candidates for a smarter alternative):
${listAlternativeProducts(allProducts)}

Write a response in plain English following this structure, max about 7 sentences:
1. Verdict: is this a good idea or not for the business. Use words like "financially sensible", "risky", or "not recommended" aligned with the verdict.
2. The numbers that matter: what the customer pays and what profit remains per sale.
3. Keep the owner's business goal (${goal}) in mind and whether the offer makes sense for that goal.
4. If useful, suggest a smarter alternative: a smaller discount, or a different product, using the margin information. Do not invent product names that are not in the list.
Reply JSON: {"text": "..."}`;

  const result = await callGeminiJson(prompt);
  return result.text;
}

// MOCK AI (offline stand-in, no API needed): same two jobs, done
// with word matching and ready-made sentences.

// Find a product name, a % or Rs discount, a customer group, and a goal
// in the owner's sentence, using simple word matching.
function mockExtractOfferDetails(prompt, products, groups) {
  // Work in lowercase so "Milk" and "milk" are found the same way.
  const lower = prompt.toLowerCase();
  // Dashes become spaces so "high-spending" finds "High Spending".
  const normalized = lower.replace(/-/g, ' ');

  const extraction = {
    productName: null,
    discountType: null,
    discountValue: null,
    customerGroupName: null,
    businessGoal: null,
  };

  // Try the longest product name first so a short name inside a longer
  // one does not win by mistake.
  const sortedProducts = [...products].sort((a, b) => b.name.length - a.name.length);
  const matchedProduct = sortedProducts.find(
    (p) => normalized.includes(p.name.toLowerCase()) || lower.includes(p.name.toLowerCase())
  );
  if (matchedProduct) extraction.productName = matchedProduct.name;

  // Look for a percentage first: "20%" or "10 %".
  const percentMatch = lower.match(/(\d+(?:\.\d+)?)\s*%/);
  if (percentMatch) {
    extraction.discountType = 'percentage';
    extraction.discountValue = Number(percentMatch[1]);
  } else {
    // Otherwise look for a fixed amount: "Rs 20 off" or "20 off".
    const moneyOffMatch =
      lower.match(/(?:rs\.?|inr|rupees?|₹)\s*(\d+(?:\.\d+)?)/i) ||
      lower.match(/(\d+(?:\.\d+)?)\s*off/i);
    if (moneyOffMatch) {
      extraction.discountType = 'fixed';
      extraction.discountValue = Number(moneyOffMatch[1]);
    } else {
      // Last try: "20 discount" or "20 percent".
      const bareDiscountMatch = lower.match(/(\d+(?:\.\d+)?)\s*(?:discount|percent|per cent)/);
      if (bareDiscountMatch) {
        extraction.discountType = 'percentage';
        extraction.discountValue = Number(bareDiscountMatch[1]);
      }
    }
  }

  // Look for a known customer group name in the sentence.
  const matchedGroup =
    groups.find((g) => normalized.includes(g.name.toLowerCase())) ||
    groups.find((g) => lower.includes(g.name.toLowerCase())) ||
    null;
  if (matchedGroup) extraction.customerGroupName = matchedGroup.name;

  // Guess the business goal from common keywords.
  if (/inactive|bring (them|those .*)?back|re-engage|churn/.test(lower)) {
    extraction.businessGoal = 'Bring inactive customers back';
  } else if (/old stock|clear|expir|stock/.test(lower)) {
    extraction.businessGoal = 'Clear old stock';
  } else if (/reward|loyal|regular customers/.test(lower)) {
    extraction.businessGoal = 'Reward loyal customers';
  } else if (/buy more|basket|bundle|combine/.test(lower)) {
    extraction.businessGoal = 'Increase basket size';
  } else if (/increase|more sales|sell more|boost|grow|sales/.test(lower)) {
    extraction.businessGoal = 'Increase sales';
  }

  return extraction;
}

// Mock "product not found" message.
function mockExplainProductNotFound(productName, products) {
  const names = products.map((p) => p.name).join(', ') || 'none yet';
  if (!productName || productName === 'the product') {
    return `You didn't mention which product. Your current products are: ${names}. Tell me the product and discount you have in mind.`;
  }
  return `I couldn't find a product named "${productName}" in your products. Your current products are: ${names}. Please add it first or check the name.`;
}

// Mock "please tell me the discount" message.
function mockSuggestDiscount(product, margins) {
  return `You want to discount ${product.name} but I need to know how much. What discount did you have in mind? As a reference, ${product.name} makes Rs ${margins.originalProfit} profit per sale (${margins.originalMarginPercent}% margin), so a discount beyond about ${margins.safeMaxDiscountPercent}% (Rs ${margins.safeMaxDiscountAmount}) would make you lose money.`;
}

// Mock main explanation, chosen by the verdict.
function mockExplainResult(extraction, product, analysis, allProducts) {
  // Add a sentence about the business goal if we found one.
  const goalNote = extraction.businessGoal
    ? `\nConsidering your goal (${extraction.businessGoal}), this offer ${analysis.status === 'LOSS' ? `still hurts more than it helps` : analysis.status === 'RISKY' ? 'is possible but uses a lot of your margin' : 'helps in a sensible way'}.`
    : '';

  let text;
  if (analysis.status === 'LOSS') {
    // The shop loses money - say it directly.
    text = `I wouldn't recommend this offer. ${product.name} has a thin margin, and this discount takes you from Rs ${analysis.originalProfit} profit down to a Rs ${analysis.newProfit} loss per sale. ${goalNote}\nYou could try a discount below about ${analysis.safeMaxDiscountPercent}% so you do not lose money.`;
  } else if (analysis.status === 'RISKY') {
    // Still profitable but the margin is badly squeezed.
    text = `This offer is still technically profitable but it removes ${analysis.profitReductionPercent}% of your profit on ${product.name} (from Rs ${analysis.originalProfit} to Rs ${analysis.newProfit} per sale). ${goalNote}\nConsider a smaller discount, or an offer on a higher-margin product.`;
  } else {
    // All good.
    text = `This offer looks financially sensible. On ${product.name}, the customer pays Rs ${analysis.finalPrice} (Rs ${analysis.discountAmount} off) and you still make Rs ${analysis.newProfit} profit per sale. ${goalNote}`;
  }

  return text;
}

// WRAPPERS: one for the real AI, one for the mock.

// Run the real Gemini extraction and remember the owner's words.
async function geminiExtract(prompt, products, groups) {
  const result = await geminiExtractOfferDetails(prompt, products, groups);
  result.originalPrompt = prompt;
  return result;
}

// Run the mock extraction and remember the owner's words.
async function mockExtract(prompt, products, groups) {
  const result = mockExtractOfferDetails(prompt, products, groups);
  result.originalPrompt = prompt;
  return result;
}

// PUBLIC FUNCTIONS: the rest of the app calls these.
// Each one tries Gemini and falls back to mock on any failure.

// Remember which AI actually answered last, so the reply is honest.
let lastUsedMode = USE_GEMINI ? 'gemini' : 'mock';
function markUsed(mode) {
  lastUsedMode = mode;
}

// Tell the outside world which AI is being used right now.
export function aiMode() {
  return lastUsedMode;
}

// Turn the owner's words into structured facts.
export async function extractOfferDetails(prompt, products, groups) {
  if (!USE_GEMINI) {
    markUsed('mock');
    return mockExtract(prompt, products, groups);
  }
  try {
    const result = await geminiExtract(prompt, products, groups);
    markUsed('gemini');
    return result;
  } catch (err) {
    console.warn('Gemini failed, using mock:', err.message);
    markUsed('mock');
    return mockExtract(prompt, products, groups);
  }
}

// Explain that a product was not found.
export async function explainProductNotFound(productName, products) {
  if (!USE_GEMINI) {
    markUsed('mock');
    return mockExplainProductNotFound(productName, products);
  }
  try {
    const result = await geminiExplainProductNotFound(productName, products);
    markUsed('gemini');
    return result;
  } catch (err) {
    console.warn('Gemini failed, using mock:', err.message);
    markUsed('mock');
    return mockExplainProductNotFound(productName, products);
  }
}

// Ask for the missing discount (and mention the safe limit).
export async function suggestDiscount(extraction, product, margins) {
  if (!USE_GEMINI) {
    markUsed('mock');
    return mockSuggestDiscount(product, margins);
  }
  try {
    const result = await geminiSuggestDiscount(extraction, product, margins);
    markUsed('gemini');
    return result;
  } catch (err) {
    console.warn('Gemini failed, using mock:', err.message);
    markUsed('mock');
    return mockSuggestDiscount(product, margins);
  }
}

// Explain the backend's numbers in plain English.
export async function explainResult(extraction, product, analysis, groups, allProducts) {
  if (!USE_GEMINI) {
    markUsed('mock');
    return mockExplainResult(extraction, product, analysis, allProducts);
  }
  try {
    const result = await geminiExplainResult(extraction, product, analysis, groups, allProducts);
    markUsed('gemini');
    return result;
  } catch (err) {
    console.warn('Gemini failed, using mock:', err.message);
    markUsed('mock');
    return mockExplainResult(extraction, product, analysis, allProducts);
  }
}