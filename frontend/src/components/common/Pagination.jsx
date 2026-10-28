import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export function Pagination({
  currentPage = 0, // 0-indexed
  totalPages = 1,
  totalElements = 0,
  pageSize = 10,
  onPageChange,
  onSizeChange,
}) {
  if (totalElements === 0) return null;

  const startRecord = currentPage * pageSize + 1;
  const endRecord = Math.min((currentPage + 1) * pageSize, totalElements);

  return (
    <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2 py-2 px-3 border-top bg-white">
      <div className="d-flex align-items-center gap-2 text-muted" style={{ fontSize: '0.75rem' }}>
        <span>
          Showing <span className="fw-semibold text-dark">{startRecord}</span> to{' '}
          <span className="fw-semibold text-dark">{endRecord}</span> of{' '}
          <span className="fw-semibold text-dark">{totalElements}</span> results
        </span>

        {onSizeChange && (
          <div className="d-flex align-items-center gap-1.5 ms-3">
            <label htmlFor="pageSizeSelect" className="text-muted mb-0" style={{ fontSize: '0.75rem' }}>Per page:</label>
            <select
              id="pageSizeSelect"
              className="form-select form-select-sm"
              style={{ width: '65px', padding: '0.15rem 1.4rem 0.15rem 0.4rem', fontSize: '0.75rem' }}
              value={pageSize}
              onChange={(e) => onSizeChange(Number(e.target.value))}
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
            </select>
          </div>
        )}
      </div>

      <nav aria-label="Table navigation">
        <ul className="pagination pagination-sm mb-0">
          <li className={`page-item ${currentPage === 0 ? 'disabled' : ''}`}>
            <button
              className="page-link py-1 px-2"
              onClick={() => onPageChange(currentPage - 1)}
              disabled={currentPage === 0}
              aria-label="Previous page"
              style={{ fontSize: '0.75rem' }}
            >
              <ChevronLeft size={14} />
            </button>
          </li>

          {Array.from({ length: Math.min(5, totalPages) }).map((_, idx) => {
            let pageNum = idx;
            if (totalPages > 5 && currentPage > 2) {
              pageNum = Math.min(currentPage - 2 + idx, totalPages - 1);
            }
            return (
              <li
                key={pageNum}
                className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
              >
                <button
                  className="page-link py-1 px-2.5"
                  onClick={() => onPageChange(pageNum)}
                  style={{ fontSize: '0.75rem' }}
                >
                  {pageNum + 1}
                </button>
              </li>
            );
          })}

          <li className={`page-item ${currentPage >= totalPages - 1 ? 'disabled' : ''}`}>
            <button
              className="page-link py-1 px-2"
              onClick={() => onPageChange(currentPage + 1)}
              disabled={currentPage >= totalPages - 1}
              aria-label="Next page"
              style={{ fontSize: '0.75rem' }}
            >
              <ChevronRight size={14} />
            </button>
          </li>
        </ul>
      </nav>
    </div>
  );
}

export default Pagination;
