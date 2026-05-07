import React, { useState, useEffect } from 'react';
import { Table, Card, Row, Col, Tag, Space, Button } from 'antd';
import { EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons';
import './ResponsiveTable.scss';

const ResponsiveTable = ({
  columns,
  dataSource,
  loading,
  pagination,
  onEdit,
  onDelete,
  onView,
  rowKey = 'id',
  mobileCardRender,
  ...props
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile Card View
  const renderMobileCard = (record) => {
    // Custom render jika disediakan
    if (mobileCardRender) {
      return mobileCardRender(record);
    }

    // Default render
    return (
      <Card
        key={record[rowKey]}
        className="responsive-table-card"
        size="small"
      >
        {columns
          .filter(col => col.dataIndex && !col.hideOnMobile)
          .map(col => (
            <div key={col.dataIndex} className="card-row">
              <span className="card-label">{col.title}:</span>
              <span className="card-value">
                {col.render
                  ? col.render(record[col.dataIndex], record)
                  : record[col.dataIndex]}
              </span>
            </div>
          ))}

        {(onEdit || onDelete || onView) && (
          <div className="card-actions">
            <Space>
              {onView && (
                <Button
                  type="link"
                  icon={<EyeOutlined />}
                  onClick={() => onView(record)}
                >
                  Lihat
                </Button>
              )}
              {onEdit && (
                <Button
                  type="link"
                  icon={<EditOutlined />}
                  onClick={() => onEdit(record)}
                >
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  type="link"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => onDelete(record)}
                >
                  Hapus
                </Button>
              )}
            </Space>
          </div>
        )}
      </Card>
    );
  };

  // Desktop Table View
  if (!isMobile) {
    return (
      <Table
        columns={columns}
        dataSource={dataSource}
        loading={loading}
        pagination={pagination}
        rowKey={rowKey}
        className="responsive-table-desktop"
        {...props}
      />
    );
  }

  // Mobile Card View
  return (
    <div className="responsive-table-mobile">
      {loading ? (
        <Card loading={true} />
      ) : (
        <>
          <div className="mobile-cards-container">
            {dataSource?.map(record => renderMobileCard(record))}
          </div>

          {pagination && dataSource?.length > 0 && (
            <div className="mobile-pagination">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div className="pagination-info">
                  Menampilkan {dataSource.length} dari {pagination.total} data
                </div>
                {pagination.current < Math.ceil(pagination.total / pagination.pageSize) && (
                  <Button
                    block
                    onClick={() => pagination.onChange(pagination.current + 1)}
                  >
                    Muat Lebih Banyak
                  </Button>
                )}
              </Space>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ResponsiveTable;
