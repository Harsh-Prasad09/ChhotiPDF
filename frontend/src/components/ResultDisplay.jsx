import React from 'react';
import { api } from '../services/api';

const ResultDisplay = ({ result, onReset }) => {
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const calculateCompressionRatio = (original, compressed) => {
    if (!original || !compressed) return 0;
    return Math.round(((original - compressed) / original) * 100);
  };

  // Determine display sizes and reduction; if backend indicated the original was used (no gain),
  // show compressed size equal to original and reduction 0 (computed, not hard-coded).
  const usedOriginal = result.usedOriginal === true;
  const displayOriginalSize = result.originalSize || 0;
  const displayCompressedSize = usedOriginal ? displayOriginalSize : (result.compressedSize || 0);
  const displayReduction = usedOriginal ? 0 : calculateCompressionRatio(displayOriginalSize, displayCompressedSize);

  const handleDownload = async () => {
    if (result.url) {
      try {
        // Create full URL for download
  const base = api.defaults.baseURL?.replace(/\/$/, '') || '';
  const downloadUrl = `${base}${result.url}`;
        
        // Fetch the file first to ensure it's valid
        const response = await fetch(downloadUrl, {
          method: 'GET',
          headers: {
            'Accept': 'application/pdf,image/*,*/*',
          },
        });

        if (!response.ok) {
          throw new Error(`Download failed: ${response.status} ${response.statusText}`);
        }

        // Get the file as a blob
        const blob = await response.blob();
        
        // Create a download link
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
  link.download = result.suggestedFileName || result.fileName || 'processed-file.pdf';
        link.target = '_blank';
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the object URL
        URL.revokeObjectURL(link.href);
      } catch (error) {
        console.error('Download error:', error);
        alert(`Download failed: ${error.message}`);
      }
    }
  };

  const getOperationIcon = (operation) => {
    const icons = {
      compress: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      ),
      merge: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      split: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
        </svg>
      ),
      organize: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      ),
      'compress-image': (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    };
    return icons[result.operation] || icons.compress;
  };

  const getCompressionLevelInfo = (level) => {
    const levels = {
      light: { name: 'Light', icon: '🌱', description: 'High quality, moderate compression' },
      medium: { name: 'Medium', icon: '⚖️', description: 'Perfect balance of quality and size' },
      heavy: { name: 'Heavy', icon: '🔥', description: 'Maximum compression for smallest size' }
    };
    return levels[level] || levels.medium;
  };

  return (
    <div className="mt-6 sm:mt-8">
      <div className="card p-5 sm:p-8">
        {/* Success Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-2">
            Processing Complete!
          </h2>
          <p className="text-slate-600 text-sm sm:text-base">
            Your files have been processed successfully
          </p>
        </div>

        {/* Operation Details */}
        <div className="bg-slate-50 rounded-lg p-4 sm:p-6 mb-5 sm:mb-6">
          <div className="flex items-center space-x-3 mb-3 sm:mb-4">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              {getOperationIcon(result.operation)}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                {result.operation === 'compress' && 'PDF Compression'}
                {result.operation === 'merge' && 'PDF Merging'}
                {result.operation === 'split' && 'PDF Splitting'}
                {result.operation === 'organize' && 'PDF Organization'}
                {result.operation === 'compress-image' && 'Image Compression'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600">
                {result.fileName || 'Processed file'}
              </p>
            </div>
          </div>
        </div>

        {/* Download Section - moved up */}
        <div className="text-center mb-5 sm:mb-6">
          <button
            onClick={handleDownload}
            className="btn-primary w-full sm:w-auto px-6 sm:px-8 py-3 text-base sm:text-lg hover-lift"
          >
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download Processed File</span>
            </div>
          </button>
          <p className="text-xs sm:text-sm text-slate-500 mt-2 sm:mt-3">
            Your file will be automatically deleted after 5 minutes for security
          </p>
        </div>

        {/* Compression Level Info */}
        {result.compressionLevel && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
            <div className="flex items-center space-x-3">
              <span className="text-xl sm:text-2xl">{getCompressionLevelInfo(result.compressionLevel).icon}</span>
              <div>
                <h4 className="font-medium text-blue-900 text-sm sm:text-base">
                  {getCompressionLevelInfo(result.compressionLevel).name} Compression Applied
                </h4>
                <p className="text-xs sm:text-sm text-blue-800">
                  {getCompressionLevelInfo(result.compressionLevel).description}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* File Size Comparison */}
  {displayOriginalSize && (displayCompressedSize || displayCompressedSize === 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="text-center p-3 sm:p-4 bg-red-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-red-600 mb-1">
    {formatFileSize(displayOriginalSize)}
              </div>
              <div className="text-sm text-red-600">Original Size</div>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-green-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-green-600 mb-1">
    {formatFileSize(displayCompressedSize)}
              </div>
              <div className="text-sm text-green-600">New Size</div>
            </div>
            
            <div className="text-center p-3 sm:p-4 bg-blue-50 rounded-lg">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 mb-1">
    {displayReduction}%
              </div>
              <div className="text-sm text-blue-600">Reduction</div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
    {displayOriginalSize && (displayCompressedSize || displayCompressedSize === 0) && (
          <div className="mb-6 sm:mb-8">
            <div className="flex justify-between text-xs sm:text-sm text-slate-600 mb-2">
              <span>File size reduction</span>
        <span>{displayReduction}% smaller</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-blue-500 h-3 rounded-full transition-all duration-1000"
                style={{ 
          width: `${Math.min(100, Math.max(0, displayReduction))}%`
                }}
              ></div>
            </div>
          </div>
        )}

        {/* Additional Info */}
        {result.compressionDescription && (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4 mb-5 sm:mb-6">
            <div className="flex items-start space-x-3">
              <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
        <h4 className="font-medium text-blue-900 mb-1 text-sm sm:text-base">Processing Details</h4>
        <p className="text-xs sm:text-sm text-blue-800">{result.compressionDescription}</p>
              </div>
            </div>
          </div>
        )}

        

        {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-slate-200">
          <button
            onClick={() => (onReset ? onReset() : window.location.reload())}
      className="btn-secondary w-full sm:flex-1"
          >
            Process Another File
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultDisplay;