import React, { useState } from 'react';

const FileManager = ({ files, onConfirm, onClose }) => {
  const [fileOrder, setFileOrder] = useState(files.map((_, index) => index));
  const [draggedItem, setDraggedItem] = useState(null);
  const [dragOverItem, setDragOverItem] = useState(null);

  // Drag and drop handlers
  const handleDragStart = (e, fileIndex) => {
    setDraggedItem(fileIndex);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, fileIndex) => {
    if (draggedItem !== null && draggedItem !== fileIndex) {
      e.preventDefault();
      setDragOverItem(fileIndex);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = (e, targetFileIndex) => {
    if (draggedItem !== null && draggedItem !== targetFileIndex) {
      e.preventDefault();
      
      const newOrder = [...fileOrder];
      const draggedIndex = newOrder.indexOf(draggedItem);
      const targetIndex = newOrder.indexOf(targetFileIndex);
      
      // Remove dragged item from its current position
      newOrder.splice(draggedIndex, 1);
      
      // Insert dragged item at target position
      newOrder.splice(targetIndex, 0, draggedItem);
      
      setFileOrder(newOrder);
      setDraggedItem(null);
      setDragOverItem(null);
    }
  };

  const handleConfirm = () => {
    // Return files in the new order
    const orderedFiles = fileOrder.map(index => files[index]);
    onConfirm(orderedFiles);
  };

  const resetOrder = () => {
    setFileOrder(files.map((_, index) => index));
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                Arrange PDF Files
              </h2>
              <p className="text-slate-600 mt-1 text-sm">
                Drag and drop files to arrange them in the order you want them merged
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <span className="text-sm font-medium text-slate-700">
              {files.length} files to merge
            </span>
            <div className="flex items-center space-x-4">
              <button
                onClick={resetOrder}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Reset to Original Order
              </button>
              <div className="text-sm text-slate-600">
                💡 Drag files to reorder them
              </div>
            </div>
          </div>
        </div>

        {/* Files List */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[50vh]">
          <div className="space-y-3">
            {fileOrder.map((fileIndex, orderIndex) => {
              const file = files[fileIndex];
              const isDragging = draggedItem === fileIndex;
              const isDragOver = dragOverItem === fileIndex;

              return (
                <div
                  key={fileIndex}
                  draggable
                  onDragStart={(e) => handleDragStart(e, fileIndex)}
                  onDragOver={(e) => handleDragOver(e, fileIndex)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, fileIndex)}
                  className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 cursor-move ${
                    isDragging 
                      ? 'scale-95 opacity-75 border-blue-300 bg-blue-50' 
                      : isDragOver 
                      ? 'scale-105 border-green-300 bg-green-50' 
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  {/* Order Number */}
                  <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs sm:text-sm font-bold text-blue-600">{orderIndex + 1}</span>
                  </div>

                  {/* File Icon */}
                  <div className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 bg-red-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 sm:w-6 sm:h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-medium text-slate-900 truncate">
                      {file.name}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-600">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  {/* Drag Handle */}
                  <div className="flex-shrink-0 w-6 h-6 text-slate-400">
                    <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M7 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 2zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 7 14zm6-8a2 2 0 1 1-.001-4.001A2 2 0 0 1 13 6zm0 2a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 8zm0 6a2 2 0 1 1 .001 4.001A2 2 0 0 1 13 14z" />
                    </svg>
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
              Files will be merged in the order shown above
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary px-5 sm:px-6 py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="btn-primary px-5 sm:px-6 py-2"
              >
                Merge PDFs
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileManager;
