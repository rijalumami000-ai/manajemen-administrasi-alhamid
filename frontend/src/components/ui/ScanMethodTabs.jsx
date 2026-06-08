import { Camera, QrCode, CreditCard, Fingerprint } from 'lucide-react';
import './ScanMethodTabs.scss';

const METHODS = [
  { id: 'wajah', label: 'Face Scan', icon: Camera },
  { id: 'qr', label: 'QR Code', icon: QrCode },
  { id: 'nfc', label: 'NFC Card', icon: CreditCard },
  { id: 'fingerprint', label: 'Fingerprint', icon: Fingerprint }
];

export function ScanMethodTabs({ activeTab, onChange }) {
  return (
    <div className="scan-method-tabs">
      {METHODS.map((method) => {
        const Icon = method.icon;
        const isActive = activeTab === method.id;
        
        return (
          <button
            key={method.id}
            className={`scan-method-tabs__btn ${isActive ? 'active' : ''}`}
            onClick={() => onChange(method.id)}
            type="button"
          >
            <Icon size={24} className="scan-method-tabs__icon" />
            <span className="scan-method-tabs__label">{method.label}</span>
            {isActive && <div className="scan-method-tabs__indicator" />}
          </button>
        );
      })}
    </div>
  );
}
