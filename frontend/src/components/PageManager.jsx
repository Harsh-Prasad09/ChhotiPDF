import React, { useEffect, useState } from 'react';
import { api } from '../services/api';

const PageManager = ({ file, operation, onConfirm, onClose }) => {
  // state
  const [pages, setPages] = useState([]);
  const [selectedPages, setSelectedPages] = useState([]); // for split
  const [pageOrder, setPageOrder] = useState([]); // for organize
  const [deletedPages, setDeletedPages] = useState([]); // for organize
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // load previews
  useEffect(() => {
    const loadPagePreviews = async () => {
      setLoading(true);
      setError(null);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const endpoint = operation === 'split' ? '/split/pdf/preview' : '/organize/pdf/preview';
  const { data } = await api.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' }});
        const list = data.pages || [];
        setPages(list);
        if (operation === 'split') setSelectedPages(list.map((_, i) => i + 1));
        if (operation === 'organize') setPageOrder(list.map((_, i) => i + 1));
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    loadPagePreviews();
  }, [file, operation]);

  // actions
  const togglePageSelection = (n) => {
    if (operation !== 'split') return;
    setSelectedPages((prev) =>
      prev.includes(n) ? prev.filter((p) => p !== n) : [...prev, n].sort((a, b) => a - b)
    );
  };

  const togglePageDeletion = (n) => {
    if (operation !== 'organize') return;
    setDeletedPages((prev) =>
      prev.includes(n) ? prev.filter((p) => p !== n) : [...prev, n].sort((a, b) => a - b)
    );
  };

  // drag and drop
  const handleDragStart = (e, n) => {
    if (operation !== 'organize' || deletedPages.includes(n)) return;
    setDraggedItem(n);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragOver = (e, n) => {
    if (operation !== 'organize') return;
    if (draggedItem === n) return;
    e.preventDefault();
    setDragOverItem(n);
  };
  const handleDragLeave = () => setDragOverItem(null);
  const handleDrop = (e, target) => {
    if (operation !== 'organize') return;
    if (!draggedItem || draggedItem === target) return;
    e.preventDefault();
    const newOrder = [...pageOrder];
    const from = newOrder.indexOf(draggedItem);
    const to = newOrder.indexOf(target);
    if (from === -1 || to === -1) return;
    newOrder.splice(from, 1);
    newOrder.splice(to, 0, draggedItem);
    setPageOrder(newOrder);
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const resetOrder = () => {
    setPageOrder(pages.map((_, i) => i + 1));
    setDeletedPages([]);
  };

  const handleConfirm = () => {
    if (operation === 'split') {
      if (selectedPages.length === 0) {
        alert('Please select at least one page');
        return;
      }
      onConfirm({ selectedPages: selectedPages.join(','), pageOrder: null, deletedPages: null });
      return;
    }
    if (operation === 'organize') {
      if (pageOrder.length === 0) {
        alert('Please arrange at least one page');
        return;
      }
      onConfirm({ pageOrder: pageOrder.join(','), deletedPages: deletedPages.join(','), selectedPages: null });
    }
  };

  // UI states
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-0">
        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-base sm:text-lg font-medium text-slate-900">Loading page previews...</p>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">Please wait while we analyze your PDF</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-0">
        <div className="bg-white rounded-lg p-6 sm:p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-slate-900 mb-2">Error Loading Pages</h3>
          <p className="text-xs sm:text-sm text-slate-600 mb-4">{error}</p>
          <button onClick={onClose} className="btn-secondary">Close</button>
        </div>
      </div>
    );
  }

  // derive ordered list for rendering
  const ordered = operation === 'organize'
    ? pageOrder.map((n) => ({ data: pages[n - 1], number: n }))
    : pages.map((p, idx) => ({ data: p, number: idx + 1 }));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              {operation === 'split' ? 'Select Pages to Extract' : 'Organize Pages'}
            </h2>
            <p className="text-slate-600 mt-1 text-sm">
              {operation === 'split'
                ? 'Choose which pages you want to extract from your PDF'
                : 'Drag and drop pages to reorder, or click to delete unwanted pages'}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
          {operation === 'split' ? (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-sm font-medium text-slate-700">
                {selectedPages.length} of {pages.length} pages selected
              </span>
              <button onClick={() => setSelectedPages(pages.map((_, i) => i + 1))} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Select All
              </button>
              <button onClick={() => setSelectedPages([])} className="text-sm text-red-600 hover:text-red-800 font-medium">
                Deselect All
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <span className="text-sm font-medium text-slate-700">
                {pageOrder.length} pages in order, {deletedPages.length} deleted
              </span>
              <button onClick={resetOrder} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                Reset to Original Order
              </button>
              <div className="text-sm text-slate-600">💡 Drag pages to reorder them</div>
            </div>
          )}
        </div>

        {/* Pages Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
            {ordered.map(({ data: page, number: n }) => {
              const isSelected = operation === 'split' ? selectedPages.includes(n) : pageOrder.includes(n);
              const isDeleted = operation === 'organize' ? deletedPages.includes(n) : false;
              const isDragging = draggedItem === n;
              const isDragOver = dragOverItem === n;
              return (
                <div
                  key={`page-${n}`}
                  draggable={operation === 'organize' && !isDeleted}
                  onDragStart={(e) => handleDragStart(e, n)}
                  onDragOver={(e) => handleDragOver(e, n)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, n)}
                  className={`relative group cursor-pointer transition-all duration-200 ${
                    isDeleted ? 'opacity-50' : ''
                  } ${isDragging ? 'scale-95 opacity-75' : ''} ${isDragOver ? 'scale-105' : ''}`}
                  onClick={() => {
                    if (operation === 'split') togglePageSelection(n);
                    if (operation === 'organize') togglePageDeletion(n);
                  }}
                >
                  {/* Page Thumbnail */}
                  <div className={`aspect-[3/4] bg-slate-100 rounded-lg border-2 transition-all duration-200 ${
                    isSelected && !isDeleted
                      ? 'border-blue-500 bg-blue-50'
                      : isDeleted
                      ? 'border-red-300 bg-red-50'
                      : isDragOver
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-blue-300'
                  }`}>
                    {page && page.preview_image ? (
                      <img src={page.preview_image} alt={`Page ${n}`} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {/* Page Number */}
                    <div className="absolute top-1.5 sm:top-2 left-1.5 sm:left-2 bg-white/90 rounded-full w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-medium text-slate-700">{n}</span>
                    </div>
                    {/* Selection Indicator */}
                    {isSelected && !isDeleted && (
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-blue-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {/* Deletion Indicator */}
                    {isDeleted && (
                      <div className="absolute top-1.5 sm:top-2 right-1.5 sm:right-2 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 rounded-full flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                    {/* Drag Handle */}
                    {operation === 'organize' && !isDeleted && (
                      <div className="absolute bottom-1.5 sm:bottom-2 right-1.5 sm:right-2 w-5 h-5 sm:w-6 sm:h-6 bg-slate-800/75 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Page Info */}
                  <div className="mt-2 text-center">
                    <p className="text-xs sm:text-sm font-medium text-slate-900">Page {n}</p>
                    {page && page.width && page.height && (
                      <p className="text-[10px] sm:text-xs text-slate-500">{page.width} × {page.height}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-6 border-t border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row items-center justify-between space-y-3 sm:space-y-0">
            <div className="text-xs sm:text-sm text-slate-600 text-center sm:text-left">
              {operation === 'split' ? (
                <span>Selected pages will be extracted into a new PDF</span>
              ) : (
                <span>Pages will be reordered and deleted pages will be removed</span>
              )}
            </div>
            <div className="flex items-center space-x-3 w-full sm:w-auto">
              <button onClick={onClose} className="btn-secondary flex-1 sm:flex-none px-5 sm:px-6 py-2">Cancel</button>
              <button
                onClick={handleConfirm}
                className="btn-primary flex-1 sm:flex-none px-5 sm:px-6 py-2"
                disabled={(operation === 'split' && selectedPages.length === 0) || (operation === 'organize' && pageOrder.length === 0)}
              >
                {operation === 'split' ? 'Extract Pages' : 'Organize Pages'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PageManager;
