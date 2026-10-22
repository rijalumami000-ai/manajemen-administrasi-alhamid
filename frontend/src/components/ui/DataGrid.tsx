import React, { ReactNode } from 'react';
import './DataGrid.scss';

export interface DataGridColumn<T = any> {
  key?: string;
  title: ReactNode;
  dataIndex?: string;
  width?: string | number;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, record: T) => ReactNode;
}

export interface DataGridProps<T = any> {
  columns: DataGridColumn<T>[];
  data?: T[];
  rowKey?: string;
  onRowClick?: (row: T) => void;
}

export function DataGrid<T extends Record<string, any> = Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  onRowClick
}: DataGridProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="ui-datagrid empty">
        <div className="empty-state">
          <span className="empty-state__icon">📭</span>
          <p className="empty-state__text">Tidak ada data untuk ditampilkan</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ui-datagrid">
      <div className="ui-datagrid__table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, i) => (
                <th key={col.key || i} style={{ width: col.width, textAlign: col.align || 'left' }}>
                  {col.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIndex) => (
              <tr 
                key={row[rowKey] || rowIndex} 
                onClick={() => onRowClick && onRowClick(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((col, colIndex) => (
                  <td key={`${row[rowKey] || rowIndex}-${col.key || colIndex}`} style={{ textAlign: col.align || 'left' }}>
                    {col.render 
                      ? col.render(col.dataIndex ? row[col.dataIndex] : undefined, row, rowIndex) 
                      : (col.dataIndex ? row[col.dataIndex] : null)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataGrid;
