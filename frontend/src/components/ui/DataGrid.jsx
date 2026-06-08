import './DataGrid.scss';

export function DataGrid({ columns, data, rowKey = 'id', onRowClick }) {
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
                    {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
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
