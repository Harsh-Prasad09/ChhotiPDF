import React, { useState, useEffect } from 'react';
import { api } from './services/api';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import FileUpload from './components/FileUpload';
import ResultDisplay from './components/ResultDisplay';

function App() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileProcess = async (processData) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      
      // Handle files properly - each file needs a unique field name for multiple files
      if (processData.files.length === 1) {
        formData.append('file', processData.files[0]);
      } else {
        // For multiple files, append each with 'files' field name
        processData.files.forEach((file) => {
          formData.append('files', file);
        });
      }

      // Add compression level if available
      if (processData.compressionLevel) {
        formData.append('compression_level', processData.compressionLevel);
      }

      // Add split pages if available
      if (processData.splitPages) {
        formData.append('selected_pages', processData.splitPages);
      }

      // Add organize pages if available
      if (processData.organizePages) {
        formData.append('page_order', processData.organizePages);
      }

      // Add deleted pages if available
      if (processData.deletedPages) {
        formData.append('deleted_pages', processData.deletedPages);
      }

      // Map frontend operations to backend endpoints
      const endpointMap = {
        'compress': '/compress/pdf',
        'merge': '/merge/pdf',
        'split': '/split/pdf/pages',
        'organize': '/organize/pdf/pages',
        'compress-image': '/compress/image'
      };

      // Build a suggested file name for certain operations
      const baseFrom = (file) => file?.name?.replace(/\.[^/.]+$/, '') || 'file';
      let suggestedFileName;
      if (['merge', 'split', 'organize'].includes(processData.operation)) {
        const first = processData.files?.[0];
        suggestedFileName = `chhotipdf-${baseFrom(first)}.pdf`;
      }

      const endpoint = endpointMap[processData.operation];
      if (!endpoint) {
        throw new Error('Invalid operation');
      }

      const { data } = await api.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setResult({
        ...data,
        operation: processData.operation,
        compressionLevel: processData.compressionLevel,
        suggestedFileName,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setLoading(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    if (result) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [result]);

  // Allow other components (e.g., Navbar) to trigger the same reset as "Process Another File"
  useEffect(() => {
    const handleReset = () => reset();
    window.addEventListener('reset-app', handleReset);
    return () => window.removeEventListener('reset-app', handleReset);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#eaf2f2] via-[#f8fafa] to-[#eef4f5]">
      <Navbar />
      
      <main className="container mx-auto px-4 pt-20 md:pt-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center space-x-3 mb-2">
              <img src="/ChhotiPDF-LOGO.png" alt="ChhotiPDF" className="w-8 h-8 sm:w-10 sm:h-10 rounded" />
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-l from-red-600 via-indigo-600 to-blue-900 text-transparent bg-clip-text">ChhotiPDF</h1>
            </div>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Professional PDF management tools for compression, merging, splitting, and organization
            </p>
          </div>

          {!result && (
            <FileUpload onFileProcess={handleFileProcess} loading={loading} />
          )}
          
          {/* Loading indicator moved to the FileUpload submit button to avoid duplicate messages */}

          {error && (
            <div className="mt-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">{error}</div>
                </div>
              </div>
            </div>
          )}

          {result && <ResultDisplay result={result} onReset={reset} />}
        </div>

  {/* Why ChhotiPDF Section */}
  <div className="mt-16 md:mt-20 scroll-mt-24" id="why-chhotipdf">
          <div className="text-center mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-4">Why Choose 
              <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-l from-red-600 via-indigo-600 to-blue-900 text-transparent bg-clip-text mb-4"> ChhotiPDF
              </span>?</h2>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto px-2">
              Built for professionals who demand quality, speed, and reliability
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Lightning Fast</h3>
              <p className="text-slate-600 leading-relaxed">
                Process your documents in seconds with our optimized algorithms. 
                No waiting, no delays.
              </p>
            </div>
            
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Secure & Private</h3>
              <p className="text-slate-600 leading-relaxed">
                Your files are encrypted and automatically deleted after processing. 
                Your privacy is our priority.
              </p>
            </div>
            
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">High Quality</h3>
              <p className="text-slate-600 leading-relaxed">
                Maintain document quality while reducing file size. 
                Professional results every time.
              </p>
            </div>
            
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">No Installation</h3>
              <p className="text-slate-600 leading-relaxed">
                Works directly in your browser. No downloads, no installations, 
                no software to manage.
              </p>
            </div>
            
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Easy Download</h3>
              <p className="text-slate-600 leading-relaxed">
                Get your processed files instantly with secure download links 
                or direct downloads.
              </p>
            </div>
            
            <div className="card p-8 feature-card">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6 feature-icon">
                <span className="text-green-600 text-2xl font-bold">₹</span>
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">Free to Use</h3>
              <p className="text-slate-600 leading-relaxed">
                No hidden costs or fees. Use all our PDF tools completely free 
                with no credit card required.
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default App;