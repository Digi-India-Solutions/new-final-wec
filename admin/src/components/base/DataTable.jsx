
import { useState } from 'react';
import Button from './Button';

export default function DataTable({
  data,
  columns,
  loading = false,
  currentPage = 1,
  setCurrentPage,
  totalPages = 1,
  pageSize = 10,
  actions
}) {
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('asc');

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;

    const aValue = a[sortField];
    const bValue = b[sortField];

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <i className="ri-loader-4-line animate-spin text-2xl text-blue-600 w-8 h-8 flex items-center justify-center"></i>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden w-full">
      <div className="overflow-x-auto max-w-full">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column,index) => (
                <th
                  key={index}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center space-x-1">
                    <span>{column.title}</span>
                    {column.sortable && (
                      <button
                        onClick={() => handleSort(String(column.key))}
                        className="text-gray-400 hover:text-gray-600 cursor-pointer"
                      >
                        <i className={`ri-arrow-${sortField === column.key && sortOrder === 'desc' ? 'up' : 'down'}-s-line w-4 h-4 flex items-center justify-center`}></i>
                      </button>
                    )}
                  </div>
                </th>
              ))}
              {actions && (
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {sortedData.map((record, index) => (
              <tr key={index} className="hover:bg-gray-50">
                {columns.map((column ,index) => (
                  <td key={index} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {column.render
                      ? column.render(record[String(column.key)], record)
                      : record[String(column.key)]
                    }
                  </td>
                ))}
                {actions && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {actions(record)}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div>
            <p className="text-sm text-gray-700">
              Showing{' '}
              <span className="font-medium">
                {(currentPage - 1) * pageSize + 1}
              </span>{' '}
              to{' '}
              <span className="font-medium">
                {Math.min(currentPage * pageSize, totalPages)}
              </span>{' '}
              of{' '}
              <span className="font-medium">{totalPages}</span> results
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="rounded-l-md"
              >
                <i className="ri-arrow-left-s-line w-4 h-4 flex items-center justify-center"></i>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                className="rounded-r-md"
              >
                <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center"></i>
              </Button>
            </nav>
          </div>
        </div>
      )}
      {/* {totalPages >= 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between sm:hidden">
            <Button
              variant="secondary"
              disabled={currentPage === 1}
              onClick={() => pagination.onChange(pagination.current - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              disabled={pagination.current * pagination.pageSize >= pagination.total}
              onClick={() => pagination.onChange(pagination.current + 1)}
            >
              Next
            </Button>
          </div>
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700">
                Showing{' '}
                <span className="font-medium">
                  {(pagination.current - 1) * pagination.pageSize + 1}
                </span>{' '}
                to{' '}
                <span className="font-medium">
                  {Math.min(pagination.current * pagination.pageSize, pagination.total)}
                </span>{' '}
                of{' '}
                <span className="font-medium">{pagination.total}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.current === 1}
                  onClick={() => pagination.onChange(pagination.current - 1)}
                  className="rounded-l-md"
                >
                  <i className="ri-arrow-left-s-line w-4 h-4 flex items-center justify-center"></i>
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={pagination.current * pagination.pageSize >= pagination.total}
                  onClick={() => pagination.onChange(pagination.current + 1)}
                  className="rounded-r-md"
                >
                  <i className="ri-arrow-right-s-line w-4 h-4 flex items-center justify-center"></i>
                </Button>
              </nav>
            </div>
          </div>
        </div>
      )} */}
    </div>
  );
}
