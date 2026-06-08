import './InsightBanner.scss';

export function InsightBanner({ insights = [] }) {
  if (!insights.length) return null;

  return (
    <div className="ui-insight-banner">
      <div className="insight-banner__header">
        <span className="insight-banner__icon">📊</span>
        <span className="insight-banner__title">Ringkasan Cerdas</span>
      </div>
      <div className="insight-banner__items">
        {insights.map((item, i) => (
          <div key={i} className={`insight-item insight-item--${item.type || 'info'}`}>
            <span className="insight-item__icon">{item.icon}</span>
            <span className="insight-item__text">{item.text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
