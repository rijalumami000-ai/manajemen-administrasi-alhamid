import React from 'react';
import { Sparkles, CheckCircle2, AlertTriangle, Info, ShieldCheck } from 'lucide-react';
import './InsightBanner.scss';

export interface InsightItem {
  type?: 'success' | 'warning' | 'info' | 'error';
  icon?: React.ReactNode;
  text: string;
}

export interface InsightBannerProps {
  insights?: InsightItem[];
}

export function InsightBanner({ insights = [] }: InsightBannerProps) {
  if (!insights.length) return null;

  return (
    <div className="ui-insight-ribbon">
      <div className="insight-ribbon-lead">
        <div className="ribbon-lens-orb">
          <Sparkles size={15} />
        </div>
        <div className="ribbon-title-wrap">
          <span className="ribbon-title">Kelengkapan Arsip Santri</span>
          <span className="ribbon-subtitle">Kondisi data buku induk terkini</span>
        </div>
      </div>

      <div className="insight-ribbon-pills">
        {insights.map((item, i) => {
          const type = item.type || 'info';
          return (
            <div key={i} className={`ribbon-pill pill-${type}`}>
              <span className="pill-icon">
                {item.icon || (type === 'success' ? <CheckCircle2 size={13} /> : <Info size={13} />)}
              </span>
              <span className="pill-text">{item.text}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
