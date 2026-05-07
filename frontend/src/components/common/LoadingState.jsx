import { Spin, Space, Typography } from 'antd';
import { LoadingOutlined } from '@ant-design/icons';
import './LoadingState.scss';

const { Text } = Typography;

/**
 * LoadingState Component
 *
 * @param {string} tip - Loading text
 * @param {string} size - Spinner size: 'small', 'default', 'large'
 * @param {boolean} fullscreen - Show fullscreen loading
 * @param {node} children - Content to show with loading overlay
 */
export function LoadingState({
  tip = 'Loading...',
  size = 'large',
  fullscreen = false,
  children
}) {
  const antIcon = <LoadingOutlined style={{ fontSize: size === 'large' ? 48 : 24 }} spin />;

  if (fullscreen) {
    return (
      <div className="loading-state-fullscreen">
        <Space direction="vertical" align="center" size="large">
          <Spin indicator={antIcon} size={size} />
          <Text type="secondary">{tip}</Text>
        </Space>
      </div>
    );
  }

  if (children) {
    return (
      <Spin spinning tip={tip} size={size}>
        {children}
      </Spin>
    );
  }

  return (
    <div className="loading-state">
      <Space direction="vertical" align="center" size="middle">
        <Spin indicator={antIcon} size={size} />
        <Text type="secondary">{tip}</Text>
      </Space>
    </div>
  );
}
