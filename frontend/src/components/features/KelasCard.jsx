import { Card, Tag, Button, Space } from 'antd';
import { EditOutlined, DeleteOutlined, BookOutlined } from '@ant-design/icons';
import './KelasCard.scss';

export function KelasCard({ kelas, onEdit, onDelete }) {
  const jenisColor = kelas.jenis === 'Sekolah' ? 'purple' : 'blue';

  return (
    <Card
      className="kelas-card"
      hoverable
      actions={[
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(kelas)}
        >
          Edit
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(kelas.id, kelas.nama)}
        >
          Hapus
        </Button>
      ]}
    >
      <div className="kelas-card-content">
        <Tag color={jenisColor} className="kelas-jenis-tag">
          {kelas.jenis || 'Kelas'}
        </Tag>

        <div className="kelas-nama">
          <BookOutlined className="kelas-icon" />
          <h4>{kelas.nama || '-'}</h4>
        </div>
        {kelas.mustahiq_nama && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
            <span style={{ fontWeight: 'bold' }}>Wali Kelas:</span> {kelas.mustahiq_nama}
          </div>
        )}
      </div>
    </Card>
  );
}
