import { Result, Button, Space } from 'antd';
import { ReloadOutlined, HomeOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './ErrorState.scss';

/**
 * ErrorState Component
 *
 * @param {string} status - Error status: '403', '404', '500', 'error', 'warning'
 * @param {string} title - Error title
 * @param {string} subtitle - Error description
 * @param {boolean} showRetry - Show retry button
 * @param {function} onRetry - Retry button click handler
 * @param {boolean} showHome - Show home button
 */
export function ErrorState({
  status = 'error',
  title = 'Terjadi Kesalahan',
  subtitle = 'Maaf, terjadi kesalahan. Silakan coba lagi.',
  showRetry = true,
  onRetry,
  showHome = false
}) {
  const navigate = useNavigate();

  const handleRetry = () => {
    if (onRetry) {
      onRetry();
    } else {
      window.location.reload();
    }
  };

  const handleHome = () => {
    navigate('/');
  };

  const extra = [];

  if (showRetry) {
    extra.push(
      <Button type="primary" icon={<ReloadOutlined />} onClick={handleRetry} key="retry">
        Coba Lagi
      </Button>
    );
  }

  if (showHome) {
    extra.push(
      <Button icon={<HomeOutlined />} onClick={handleHome} key="home">
        Kembali ke Home
      </Button>
    );
  }

  return (
    <div className="error-state">
      <Result
        status={status}
        title={title}
        subTitle={subtitle}
        extra={extra.length > 0 ? <Space>{extra}</Space> : null}
      />
    </div>
  );
}
