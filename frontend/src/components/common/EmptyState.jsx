import { Empty, Button, Space, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import './EmptyState.scss';

const { Text } = Typography;

/**
 * EmptyState Component
 *
 * @param {string} title - Empty state title
 * @param {string} description - Empty state description
 * @param {string} image - Empty image type: 'default', 'simple', or custom image URL
 * @param {string} actionText - Action button text
 * @param {function} onAction - Action button click handler
 * @param {node} icon - Custom icon for action button
 */
export function EmptyState({
  title = 'Tidak ada data',
  description = 'Belum ada data yang tersedia',
  image = Empty.PRESENTED_IMAGE_DEFAULT,
  actionText,
  onAction,
  icon = <PlusOutlined />
}) {
  return (
    <div className="empty-state">
      <Empty
        image={image}
        imageStyle={{
          height: 120,
        }}
        description={
          <Space direction="vertical" size={4}>
            <Text strong className="empty-title">{title}</Text>
            <Text type="secondary" className="empty-description">{description}</Text>
          </Space>
        }
      >
        {actionText && onAction && (
          <Button type="primary" icon={icon} onClick={onAction}>
            {actionText}
          </Button>
        )}
      </Empty>
    </div>
  );
}
