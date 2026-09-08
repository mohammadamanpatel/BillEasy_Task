import { Icon } from './icons.jsx';

// Friendlier words for each verdict code.
const STATUS_LABELS = {
  GOOD: 'FINANCIALLY OK',
  RISKY: 'RISKY',
  LOSS: 'NOT RECOMMENDED',
};

// Turn a number into Indian rupees, e.g. 40 -> "Rs 40".
function formatMoney(value) {
  return `Rs ${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

export default function AnalysisCard({ result, saved, onSave }) {
  // Shortcut to the backend's analysis numbers.
  const a = result.analysis;
  // The verdict badge needs the lowercase key (good/risky/loss) for styling.
  const statusLower = a.status.toLowerCase();

  // The money table. "New profit per sale" is the most important row.
  const rows = [
    ['Original price', formatMoney(a.originalPrice)],
    ['Discount', `− ${formatMoney(a.discountAmount)}`],
    ['Customer pays', formatMoney(a.finalPrice)],
    ['Original profit per sale', formatMoney(a.originalProfit)],
    ['New profit per sale', formatMoney(a.newProfit), 'total'],
    ['Profit reduction', `${a.profitReductionPercent}%`, 'hl'],
    ['New profit margin', `${a.newMarginPercent}%`, 'hl'],
  ];

  // A short heading for the card.
  const offerDescription = result.customerGroup
    ? `${result.product.name} — offer for ${result.customerGroup.name}`
    : `${result.product.name} — offer for all customers`;

  return (
    <div className="bubble">
      <div className="analysis">
        {/* Colored verdict badge + offer description. */}
        <div className="verdict">
          <span className={`badge ${statusLower}`}>
            <span className="dot" />
            {STATUS_LABELS[a.status]}
          </span>
          <span className="desc">{offerDescription}</span>
        </div>

        {/* The money table. Every value was calculated by the backend. */}
        <table className="vtable">
          <tbody>
            {rows.map(([label, value, cls]) => (
              <tr key={label} className={cls || undefined}>
                <td>{label}</td>
                <td>{value}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* How far can this discount go before a loss. */}
        <table className="vtable">
          <tbody>
            <tr className="reference">
              <td>Maximum safe discount before a loss</td>
              <td>{a.safeMaxDiscountPercent}%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* The AI's plain-English explanation of those numbers. */}
      <p className="ai-explain">{result.explanation}</p>

      {/* The save button + an honest note about AI vs backend. */}
      <div className="analysis-foot">
        <button className="btn btn-primary" onClick={onSave} disabled={saved}>
          {saved ? (
            <>
              <Icon.Check size={16} />
              Offer saved
            </>
          ) : (
            'Save this offer'
          )}
        </button>
        <span className="save-note">AI explains · backend calculates every number</span>
      </div>
    </div>
  );
}