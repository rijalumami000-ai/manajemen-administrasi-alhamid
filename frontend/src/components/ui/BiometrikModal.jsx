import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Fingerprint, CreditCard, QrCode, SmartphoneNfc } from 'lucide-react';
import { CustomModal } from './CustomModal';
import './BiometrikModal.scss';

export function BiometrikModal({ open, onClose, santri, onRegister, isRegistering }) {
  const [activeTab, setActiveTab] = useState('qr');
  const [nfcUidInput, setNfcUidInput] = useState('');
  const [fingerprintInput, setFingerprintInput] = useState('');

  // Reset when opened
  useEffect(() => {
    if (open) {
      setActiveTab('qr');
      setNfcUidInput('');
      setFingerprintInput('');
    }
  }, [open, santri]);

  const handleRegister = (type, data) => {
    onRegister(type, data);
  };

  return (
    <CustomModal
      open={open}
      onClose={onClose}
      title="Manajemen Biometrik"
      subtitle={santri?.nama}
      icon={<Fingerprint />}
      size="sm"
      destroyOnClose
    >
      <div className="biometrik-modal">
        {/* Tabs */}
        <div className="bio-tabs">
          <button 
            className={`bio-tab ${activeTab === 'qr' ? 'active' : ''}`}
            onClick={() => setActiveTab('qr')}
          >
            <QrCode size={16} /> QR Code
          </button>
          <button 
            className={`bio-tab ${activeTab === 'nfc' ? 'active' : ''}`}
            onClick={() => setActiveTab('nfc')}
          >
            <CreditCard size={16} /> NFC Card
          </button>
          <button 
            className={`bio-tab ${activeTab === 'fingerprint' ? 'active' : ''}`}
            onClick={() => setActiveTab('fingerprint')}
          >
            <Fingerprint size={16} /> Sidik Jari
          </button>
        </div>

        <div className="bio-content">
          {/* TAB: QR */}
          {activeTab === 'qr' && (
            <div className="bio-pane">
              <div className="bio-pane__header">
                <h4>QR Code Identitas</h4>
                <p>Gunakan NIS sebagai data QR Code yang akan dicetak pada ID Card santri.</p>
              </div>

              <div className="qr-display-box">
                <div className="qr-wrapper">
                  <QRCodeSVG value={santri?.qr_code || santri?.nis || '00000'} size={180} level="H" />
                </div>
              </div>

              <div className="bio-pane__actions">
                {santri?.qr_code ? (
                  <div className="status-banner success">
                    <span>✅ QR Code sudah terdaftar ({santri.qr_code})</span>
                  </div>
                ) : (
                  <button 
                    className="btn-primary full-width"
                    onClick={() => handleRegister('qr_code', santri?.nis)}
                    disabled={isRegistering}
                  >
                    Simpan NIS sebagai QR Code
                  </button>
                )}
              </div>
            </div>
          )}

          {/* TAB: NFC */}
          {activeTab === 'nfc' && (
            <div className="bio-pane">
              <div className="bio-pane__header">
                <h4>Pindai Kartu NFC</h4>
                <p>Pastikan kursor berada di kotak input di bawah ini, lalu tap kartu pada alat pembaca NFC.</p>
              </div>

              <div className="scanner-box">
                <div className={`scanner-animation ${nfcUidInput ? 'detected' : ''}`}>
                  <SmartphoneNfc size={48} className="scanner-icon" />
                  <div className="ripple"></div>
                </div>
                
                <input
                  type="text"
                  className="scanner-input"
                  placeholder="Tap kartu NFC sekarang..."
                  value={nfcUidInput}
                  onChange={(e) => setNfcUidInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && nfcUidInput) {
                      handleRegister('nfc_uid', nfcUidInput);
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="bio-pane__actions">
                <button 
                  className="btn-primary full-width"
                  onClick={() => handleRegister('nfc_uid', nfcUidInput)}
                  disabled={isRegistering || !nfcUidInput}
                >
                  Simpan UID NFC
                </button>
                {santri?.nfc_uid && (
                  <div className="current-id-text">
                    ID Saat Ini: <strong>{santri.nfc_uid}</strong>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: FINGERPRINT */}
          {activeTab === 'fingerprint' && (
            <div className="bio-pane">
              <div className="bio-pane__header">
                <h4>Pindai Sidik Jari</h4>
                <p>Pastikan kursor berada di kotak input di bawah ini, lalu pindai jari pada scanner biometrik.</p>
              </div>

              <div className="scanner-box">
                <div className={`scanner-animation ${fingerprintInput ? 'detected' : ''}`}>
                  <Fingerprint size={48} className="scanner-icon" />
                  <div className="ripple"></div>
                </div>
                
                <input
                  type="text"
                  className="scanner-input"
                  placeholder="Tempelkan jari sekarang..."
                  value={fingerprintInput}
                  onChange={(e) => setFingerprintInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fingerprintInput) {
                      handleRegister('fingerprint_id', fingerprintInput);
                    }
                  }}
                  autoFocus
                />
              </div>

              <div className="bio-pane__actions">
                <button 
                  className="btn-primary full-width"
                  onClick={() => handleRegister('fingerprint_id', fingerprintInput)}
                  disabled={isRegistering || !fingerprintInput}
                >
                  Simpan ID Sidik Jari
                </button>
                {santri?.fingerprint_id && (
                  <div className="current-id-text">
                    ID Saat Ini: <strong>{santri.fingerprint_id}</strong>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </CustomModal>
  );
}
