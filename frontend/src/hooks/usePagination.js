import { useState, useCallback } from 'react';

export function usePagination(initialPage = 0, initialSize = 10) {
  const [page, setPage] = useState(initialPage);
  const [size, setSize] = useState(initialSize);
  const [sortBy, setSortBy] = useState('id');
  const [sortDirection, setSortDirection] = useState('desc');

  const handlePageChange = useCallback((newPage) => {
    setPage(newPage);
  }, []);

  const handleSizeChange = useCallback((newSize) => {
    setSize(newSize);
    setPage(0);
  }, []);

  const handleSort = useCallback((field) => {
    setSortBy((prev) => {
      if (prev === field) {
        setSortDirection((dir) => (dir === 'asc' ? 'desc' : 'asc'));
        return field;
      }
      setSortDirection('asc');
      return field;
    });
    setPage(0);
  }, []);

  const resetPagination = useCallback(() => {
    setPage(0);
  }, []);

  return {
    page,
    size,
    sortBy,
    sortDirection,
    setPage,
    setSize,
    handlePageChange,
    handleSizeChange,
    handleSort,
    resetPagination,
    queryParams: {
      page,
      size,
      sortBy,
      sortDirection,
    },
  };
}

export default usePagination;
