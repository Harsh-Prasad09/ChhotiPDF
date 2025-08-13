import React, { useState, useRef } from 'react';
import PageManager from './PageManager';
import FileManager from './FileManager';

const FileUpload = ({ onFileProcess, loading }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [selectedOperation, setSelectedOperation] = useState('compress');
  const [compressionLevel, setCompressionLevel] = useState('medium');
  const [dragActive, setDragActive] = useState(false);
  const [showPageManager, setShowPageManager] = useState(false);
  const [showFileManager, setShowFileManager] = useState(false);
  const fileInputRef = useRef(null);

  const operations = [
    {
      id: 'compress',
      name: 'Compress PDF',
      description: 'Reduce file size while maintaining quality',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      acceptsMultiple: false,
      fileTypes: ['.pdf'],
      hasCompressionLevel: true
    },
    {
      id: 'merge',
      name: 'Merge PDFs',
      description: 'Combine multiple PDFs into one document',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      acceptsMultiple: true,
      fileTypes: ['.pdf'],
      hasCompressionLevel: false,
      requiresFileArrangement: true
    },
    {
      id: 'split',
      name: 'Split PDF',
      description: 'Extract pages or split large PDFs',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      acceptsMultiple: false,
      fileTypes: ['.pdf'],
      hasCompressionLevel: false,
      requiresPages: true
    },
    {
      id: 'organize',
      name: 'Organize PDFs',
      description: 'Sort and arrange your documents',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      acceptsMultiple: false,
      fileTypes: ['.pdf'],
      hasCompressionLevel: false,
      requiresPages: true
    },
    {
      id: 'compress-image',
      name: 'Compress Images',
      description: 'Reduce image file size',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      acceptsMultiple: true,
      fileTypes: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'],
      hasCompressionLevel: true
    }
  ];

  // Listen for global operation change (from Footer quick links or elsewhere)
  React.useEffect(() => {
    const handler = (e) => {
      const op = e.detail;
      if (operations.find(o => o.id === op)) {
        setSelectedOperation(op);
        setSelectedFiles([]);
        fileInputRef.current && (fileInputRef.current.value = '');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('set-operation', handler);
    return () => window.removeEventListener('set-operation', handler);
  }, []);

  const compressionLevels = [
    {
      id: 'light',
      name: 'Light',
      description: 'High quality, moderate compression',
      percentage: '15-25%',
      icon: '🌱'
    },
    {
      id: 'medium',
      name: 'Medium',
      description: 'Recommended - Perfect balance of quality and size',
      percentage: '30-50%',
      icon: '⚖️'
    },
    {
      id: 'heavy',
      name: 'Heavy',
      description: 'Maximum compression for smallest size',
      percentage: '50-70%',
      icon: '🔥'
    }
  ];

  const currentOperation = operations.find(op => op.id === selectedOperation);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFiles = (files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(file => {
      const extension = '.' + file.name.split('.').pop().toLowerCase();
      return currentOperation.fileTypes.includes(extension);
    });

    if (validFiles.length === 0) {
      alert(`Please select valid files: ${currentOperation.fileTypes.join(', ')}`);
      return;
    }

    if (!currentOperation.acceptsMultiple && validFiles.length > 1) {
      setSelectedFiles([validFiles[0]]);
    } else {
      setSelectedFiles(validFiles);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (selectedFiles.length === 0) {
      alert('Please select at least one file');
      return;
    }

    // For split and organize operations, show the page manager
    if (currentOperation.requiresPages) {
      setShowPageManager(true);
      return;
    }

    // For merge operations, show the file manager
    if (currentOperation.requiresFileArrangement) {
      setShowFileManager(true);
      return;
    }

    // For other operations, process directly
    const processData = {
      files: selectedFiles,
      operation: selectedOperation,
      compressionLevel: currentOperation.hasCompressionLevel ? compressionLevel : undefined
    };
    
    onFileProcess(processData);
  };

  const handlePageManagerConfirm = (pageData) => {
    setShowPageManager(false);
    
    const processData = {
      files: selectedFiles,
      operation: selectedOperation,
      compressionLevel: currentOperation.hasCompressionLevel ? compressionLevel : undefined,
      splitPages: pageData.selectedPages,
      organizePages: pageData.pageOrder,
      deletedPages: pageData.deletedPages
    };
    
    onFileProcess(processData);
  };

  const handleFileManagerConfirm = (orderedFiles) => {
    setShowFileManager(false);
    
    const processData = {
      files: orderedFiles,
      operation: selectedOperation,
      compressionLevel: currentOperation.hasCompressionLevel ? compressionLevel : undefined
    };
    
    onFileProcess(processData);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <>
  <div className="card p-4 sm:p-6 md:p-8 ">
        {/* Operation Selection */}
        <div className="mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 sm:mb-6">Choose Your Operation</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {operations.map((operation) => (
              <button
                key={operation.id}
                onClick={() => {
                  setSelectedOperation(operation.id);
                  setSelectedFiles([]);
                }}
                className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                  selectedOperation === operation.id
                    ? 'bg-blue-50 text-blue-900'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-1.5 sm:p-2 rounded-lg ${
                    selectedOperation === operation.id ? 'bg-blue-100' : 'bg-slate-100'
                  }`}>
                    {operation.icon}
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base">{operation.name}</h3>
                    <p className="text-xs sm:text-sm text-slate-600 mt-1">{operation.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Compression Level Selection */}
        {currentOperation.hasCompressionLevel && (
          <div className="mb-6 sm:mb-8">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">Choose Compression Level</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {compressionLevels.map((level) => {
                const isSelected = compressionLevel === level.id;
                const unselectedHoverClass =
                  level.id === 'light'
                    ? 'border-slate-200 hover:border-green-300 hover:bg-green-50'
                    : level.id === 'heavy'
                    ? 'border-slate-200 hover:border-red-300 hover:bg-red-50'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-blue-50';

                const selectedClass = isSelected
                  ? level.id === 'light'
                    ? 'bg-green-50'
                    : level.id === 'heavy'
                    ? 'bg-red-50'
                    : 'bg-blue-50'
                  : unselectedHoverClass;

                const badgeSelectedClass =
                  level.id === 'light'
                    ? isSelected ? 'bg-green-200 text-green-800' : 'bg-green-100 text-green-700'
                    : level.id === 'heavy'
                    ? isSelected ? 'bg-red-200 text-red-800' : 'bg-red-100 text-red-700'
                    : isSelected ? 'bg-blue-200 text-blue-800' : 'bg-blue-100 text-blue-700';

                return (
                  <button
                    key={level.id}
                    onClick={() => setCompressionLevel(level.id)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-all duration-200 text-left ${selectedClass}`}
                  >
                    <div className="flex items-center justify-between mb-1 sm:mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-base sm:text-lg">{level.icon}</span>
                        <h4 className="font-semibold text-sm sm:text-base">{level.name}</h4>
                      </div>
                      <div className={`px-2 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-medium ${badgeSelectedClass}`}>
                        {level.percentage}
                      </div>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600">{level.description}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* File Upload Area */}
        <div className="mb-6">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900 mb-3 sm:mb-4">
            {currentOperation.name}
          </h3>
          
          <div
            className={`file-upload-area ${dragActive ? 'dragover' : ''}`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple={currentOperation.acceptsMultiple}
              accept={currentOperation.fileTypes.join(',')}
              onChange={handleFileInput}
              className="hidden"
            />
            
            <div className="space-y-3 sm:space-y-4">
              <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 sm:w-8 sm:h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              
              <div>
                <p className="text-base sm:text-lg font-medium text-slate-900">
                  Drop your files here or click to browse
                </p>
                <p className="text-slate-600 mt-1 sm:mt-2 text-sm">
                  Supports: {currentOperation.fileTypes.join(', ')}
                  {currentOperation.acceptsMultiple ? ' (Multiple files allowed)' : ' (Single file)'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Selected Files */}
        {selectedFiles.length > 0 && (
          <div className="mb-6 max-h-60 overflow-auto pr-1">
            <h4 className="font-semibold text-slate-900 mb-3">Selected Files:</h4>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <svg className="w-5 h-5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <p className="font-medium text-slate-900 text-sm sm:text-base">{file.name}</p>
                      <p className="text-xs sm:text-sm text-slate-600">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="text-slate-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
    <div className="text-center">
          <button
            onClick={handleSubmit}
            disabled={selectedFiles.length === 0 || loading}
      className={`btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg ${
              selectedFiles.length === 0 || loading
                ? 'opacity-50 cursor-not-allowed'
                : 'hover-lift'
            }`}
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Processing...</span>
              </div>
            ) : (
              `Process ${currentOperation.name}`
            )}
          </button>
        </div>
      </div>

      {/* Page Manager Modal */}
      {showPageManager && selectedFiles.length > 0 && (
        <PageManager
          file={selectedFiles[0]}
          operation={selectedOperation}
          onConfirm={handlePageManagerConfirm}
          onClose={() => setShowPageManager(false)}
        />
      )}

      {/* File Manager Modal */}
      {showFileManager && selectedFiles.length > 0 && (
        <FileManager
          files={selectedFiles}
          onConfirm={handleFileManagerConfirm}
          onClose={() => setShowFileManager(false)}
        />
      )}
    </>
  );
};

export default FileUpload;