import { Card, Tag, Button, Space, Descriptions } from 'antd';
import {
  UserOutlined,
  PhoneOutlined,
  MailOutlined,
  HomeOutlined,
  TrophyOutlined,
  CalendarOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined
} from '@ant-design/icons';
import { formatDate } from '../../utils/formatters';
import './AlumniCard.scss';

export function AlumniCard({ alumni, onDetail, onEdit, onDelete }) {
  return (
    <Card
      className="alumni-card"
      hoverable
      actions={[
        <Button
          key="detail"
          type="link"
          icon={<EyeOutlined />}
          onClick={() => onDetail(alumni.id)}
        >
          Detail
        </Button>,
        <Button
          key="edit"
          type="link"
          icon={<EditOutlined />}
          onClick={() => onEdit(alumni)}
        >
          Edit
        </Button>,
        <Button
          key="delete"
          type="link"
          danger
          icon={<DeleteOutlined />}
          onClick={() => onDelete(alumni.id, alumni.nama)}
        >
          Hapus
        </Button>
      ]}
    >
      <div className="alumni-card-header">
        <div className="alumni-info">
          <h3 className="alumni-name">
            <UserOutlined /> {alumni.nama}
          </h3>
          <p className="alumni-nis">NIS: {alumni.nis}</p>
        </div>
        <Tag color="blue" icon={<CalendarOutlined />} className="alumni-year-tag">
          Lulus {alumni.tahun_lulus}
        </Tag>
      </div>

      <Descriptions column={1} size="small" className="alumni-details">
        {(alumni.tempat_lahir || alumni.tanggal_lahir) && (
          <Descriptions.Item label="Lahir">
            {alumni.tempat_lahir || ''}{alumni.tempat_lahir && alumni.tanggal_lahir ? ', ' : ''}
            {alumni.tanggal_lahir ? formatDate(alumni.tanggal_lahir) : ''}
          </Descriptions.Item>
        )}

        {alumni.tahun_masuk && (
          <Descriptions.Item label="Tahun Masuk">
            {alumni.tahun_masuk}
          </Descriptions.Item>
        )}

        {alumni.kelas_terakhir && (
          <Descriptions.Item label="Kelas Terakhir">
            {alumni.kelas_terakhir}
          </Descriptions.Item>
        )}

        {alumni.no_hp && (
          <Descriptions.Item label={<><PhoneOutlined /> No. HP</>}>
            {alumni.no_hp}
          </Descriptions.Item>
        )}

        {alumni.email && (
          <Descriptions.Item label={<><MailOutlined /> Email</>}>
            {alumni.email}
          </Descriptions.Item>
        )}

        {alumni.pekerjaan && (
          <Descriptions.Item label="Pekerjaan">
            {alumni.pekerjaan}
          </Descriptions.Item>
        )}

        {alumni.status_pernikahan && (
          <Descriptions.Item label="Status">
            <Tag color={alumni.status_pernikahan === 'Sudah Menikah' ? 'green' : 'default'}>
              {alumni.status_pernikahan}
            </Tag>
          </Descriptions.Item>
        )}

        {alumni.alamat_sekarang && (
          <Descriptions.Item label={<><HomeOutlined /> Alamat Sekarang</>}>
            {alumni.alamat_sekarang}
          </Descriptions.Item>
        )}

        {alumni.instansi && (
          <Descriptions.Item label="Instansi">
            {alumni.instansi}
          </Descriptions.Item>
        )}

        {alumni.prestasi_utama && (
          <Descriptions.Item label={<><TrophyOutlined /> Prestasi</>}>
            {alumni.prestasi_utama}
          </Descriptions.Item>
        )}
      </Descriptions>
    </Card>
  );
}
