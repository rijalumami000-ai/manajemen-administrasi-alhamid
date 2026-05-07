import { Card, Tag, Button, Progress, Descriptions } from 'antd';
import { EditOutlined, DeleteOutlined, HomeOutlined, TeamOutlined, ToolOutlined } from '@ant-design/icons';
import './KamarCard.scss';

export function KamarCard({ kamar, onEdit, onDelete }) {
  const persenTerisi = kamar.kapasitas > 0
    ? Math.round((kamar.terisi / kamar.kapasitas) * 100)
    : 0;

  const statusColor =
    kamar.status === 'Penuh' ? 'error' :
    kamar.status === 'Maintenance' ? 'warning' :
    'success';

  const jenisColor = kamar.jenis === 'Putra' ? 'blue' : 'magenta';

  const progressColor =
    persenTerisi >= 90 ? '#f44336' :
    persenTerisi >= 70 ? '#ff9800' :
    '#4caf50';

  return (
    <Card
      className="kamar-card"
      hoverable
      actions={[
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(kamar)}
        >
          Edit
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(kamar.id, kamar.nama)}
        >
          Hapus
        </Button>
      ]}
    >
      <div className="kamar-card-header">
        <div className="kamar-info">
          <h4 className="kamar-nama">
            <HomeOutlined /> {kamar.nama || '-'}
          </h4>
          <Tag color={jenisColor} className="kamar-jenis-tag">
            {kamar.jenis || 'Kamar'}
          </Tag>
        </div>
        <Tag color={statusColor} className="kamar-status-tag">
          {kamar.status || 'Tersedia'}
        </Tag>
      </div>

      <Descriptions column={1} size="small" className="kamar-details">
        {kamar.gedung && (
          <Descriptions.Item label="Gedung">
            {kamar.gedung}
          </Descriptions.Item>
        )}

        {kamar.lantai && (
          <Descriptions.Item label="Lantai">
            Lantai {kamar.lantai}
          </Descriptions.Item>
        )}

        <Descriptions.Item label={<><TeamOutlined /> Kapasitas</>}>
          <div className="kapasitas-info">
            <span className="kapasitas-text">
              {kamar.terisi} / {kamar.kapasitas} orang
            </span>
            <Progress
              percent={persenTerisi}
              size="small"
              strokeColor={progressColor}
              showInfo={false}
            />
          </div>
        </Descriptions.Item>

        {kamar.fasilitas && (
          <Descriptions.Item label={<><ToolOutlined /> Fasilitas</>}>
            {kamar.fasilitas}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
