import { Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

/**
 * ConfirmDialog - Utility functions for confirmation dialogs
 */

export const ConfirmDialog = {
  /**
   * Show delete confirmation
   */
  delete: ({ title = 'Hapus Data', content = 'Apakah Anda yakin ingin menghapus data ini?', onOk, onCancel }) => {
    return Modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText: 'Hapus',
      okType: 'danger',
      cancelText: 'Batal',
      onOk,
      onCancel,
    });
  },

  /**
   * Show warning confirmation
   */
  warning: ({ title = 'Peringatan', content, onOk, onCancel }) => {
    return Modal.confirm({
      title,
      icon: <ExclamationCircleOutlined />,
      content,
      okText: 'Ya',
      okType: 'primary',
      cancelText: 'Tidak',
      onOk,
      onCancel,
    });
  },

  /**
   * Show info confirmation
   */
  info: ({ title = 'Informasi', content, onOk }) => {
    return Modal.info({
      title,
      content,
      okText: 'OK',
      onOk,
    });
  },

  /**
   * Show success confirmation
   */
  success: ({ title = 'Berhasil', content, onOk }) => {
    return Modal.success({
      title,
      content,
      okText: 'OK',
      onOk,
    });
  },

  /**
   * Show error confirmation
   */
  error: ({ title = 'Error', content, onOk }) => {
    return Modal.error({
      title,
      content,
      okText: 'OK',
      onOk,
    });
  },
};
