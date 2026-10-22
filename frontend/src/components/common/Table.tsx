import React, { ReactNode } from 'react';

export interface TableColumn<T = any> {
  key: string;
  label: ReactNode;
  render?: (value: any, row: T) => ReactNode;
}

export interface TableProps<T extends Record<string, any> = Record<string, any>> {
  columns: TableColumn<T>[];
  data?: T[];
  onEdit?: (row: T) => void;
  onDelete?: (id: any) => void;
  actions?: boolean;
}

export function Table<T extends Record<string, any> = Record<string, any>>({
  columns,
  data,
  onEdit,
  onDelete,
  actions = true
}: TableProps<T>) {
  return (
    <div className="table-scroll">
      <table>
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col.key}>{col.label}</th>
            ))}
            {actions && <th>Aksi</th>}
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((row, index) => (
              <tr key={row.id !== undefined ? row.id : index}>
                {columns.map(col => (
                  <td key={col.key}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
                {actions && (
                  <td>
                    <div className="action-buttons">
                      {onEdit && (
                        <button
                          type="button"
                          className="btn-edit"
                          onClick={() => onEdit(row)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          className="btn-delete"
                          onClick={() => onDelete(row.id)}
                          title="Hapus"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + (actions ? 1 : 0)} style={{ textAlign: 'center' }}>
                Tidak ada data
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
