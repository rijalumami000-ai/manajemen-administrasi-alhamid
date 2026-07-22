import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Eye } from 'lucide-react';
import './ResponsiveTable.scss';

const ResponsiveTable = ({
  columns = [],
  dataSource = [],
  loading = false,
  pagination,
  onEdit,
  onDelete,
  onView,
  rowKey = 'id',
  mobileCardRender
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMobile) {
    return (
      <div className="responsive-table-mobile" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {dataSource.map(record => {
          if (mobileCardRender) return mobileCardRender(record);

          return (
            <div key={record[rowKey]} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              {columns
                .filter(col => col.dataIndex && !col.hideOnMobile)
                .map(col => (
                  <div key={col.dataIndex} style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 0', fontSize: '13px' }}>
                    <span style={{ color: '#64748b', fontWeight: 500 }}>{col.title}:</span>
                    <span>
                      {col.render ? col.render(record[col.dataIndex], record) : record[col.dataIndex]}
                    </span>
                  </div>
                ))}
              {(onEdit || onDelete || onView) && (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #f1f5f9' }}>
                  {onView && <button type="button" onClick={() => onView(record)} style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer' }}><Eye size={16} /></button>}
                  {onEdit && <button type="button" onClick={() => onEdit(record)} style={{ background: 'none', border: 'none', color: '#2196f3', cursor: 'pointer' }}><Edit2 size={16} /></button>}
                  {onDelete && <button type="button" onClick={() => onDelete(record)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={16} /></button>}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ width: '100%', overflowX: 'auto', background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
        <thead>
          <tr style={{ background: '#f8fafc', borderBottom: '1px solid #cbd5e1' }}>
            {columns.map(col => (
              <th key={col.key || col.dataIndex} style={{ padding: '10px 12px', textAlign: col.align || 'left', width: col.width }}>
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {dataSource.map(record => (
            <tr key={record[rowKey]} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map(col => (
                <td key={col.key || col.dataIndex} style={{ padding: '10px 12px', textAlign: col.align || 'left' }}>
                  {col.render ? col.render(record[col.dataIndex], record) : record[col.dataIndex]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ResponsiveTable;
