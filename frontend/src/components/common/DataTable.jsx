import React from 'react';
import { ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
import LoadingState from './LoadingState';
import EmptyState from './EmptyState';
import ErrorState from './ErrorState';
import Pagination from './Pagination';

export function DataTable({
  columns = [],
  data = [],
  isLoading = false,
  error = null,
  onRetry,
  pagination = null,
  sortBy = null,
  sortDirection = 'asc',
  onSort = null,
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  tableLayout = 'auto',
  className = '',
}) {
  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  const isFixed = tableLayout === 'fixed' || columns.some((col) => Boolean(col.width));

  return (
    <div className={`table-container ${className}`}>
      <div className="table-responsive">
        <table
          className={`app-table table mb-0 ${isFixed ? 'table-fixed' : ''}`}
          style={isFixed ? { tableLayout: 'fixed', width: '100%' } : { width: '100%' }}
        >
          <thead>
            <tr>
              {columns.map((col) => {
                const isSortable = col.sortable && onSort;
                const isCurrentSort = sortBy === col.field;
                const isRightAligned =
                  col.className?.includes('text-end') || col.className?.includes('table-actions-cell');

                return (
                  <th
                    key={col.field || col.header}
                    className={`${col.headerClassName || ''} ${col.className || ''}`}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      maxWidth: col.maxWidth,
                      cursor: isSortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      ...col.headerStyle,
                    }}
                    onClick={() => isSortable && onSort(col.field)}
                  >
                    <div
                      className={`d-flex align-items-center gap-1.5 ${
                        isRightAligned ? 'justify-content-end' : ''
                      }`}
                    >
                      <span className="text-nowrap">{col.header}</span>
                      {isSortable && (
                        <span className="text-muted ms-0.5 flex-shrink-0" style={{ display: 'inline-flex', alignItems: 'center' }}>
                          {isCurrentSort ? (
                            sortDirection === 'asc' ? (
                              <ArrowUp size={12} className="text-primary" />
                            ) : (
                              <ArrowDown size={12} className="text-primary" />
                            )
                          ) : (
                            <ArrowUpDown size={11} className="opacity-40" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="p-0 border-0">
                  <LoadingState />
                </td>
              </tr>
            ) : data && data.length > 0 ? (
              data.map((row, rowIdx) => (
                <tr key={row.id || rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.field || colIdx}
                      className={col.className || ''}
                      style={{
                        width: col.width,
                        minWidth: col.minWidth,
                        maxWidth: col.maxWidth,
                        ...col.cellStyle,
                      }}
                    >
                      {col.render ? col.render(row, rowIdx) : row[col.field]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-0 border-0">
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                    actionLabel={emptyActionLabel}
                    onAction={onEmptyAction}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination && !isLoading && data && data.length > 0 && (
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          totalElements={pagination.totalElements}
          pageSize={pagination.pageSize}
          onPageChange={pagination.onPageChange}
          onSizeChange={pagination.onSizeChange}
        />
      )}
    </div>
  );
}

export default DataTable;
