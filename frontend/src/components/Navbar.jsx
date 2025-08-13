import React, { useState } from 'react';

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const scrollToFeatures = () => {
    const section = document.getElementById('why-chhotipdf');
    if (section) {
      section.style.scrollMarginTop = '96px';
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const openContact = () => {
    window.location.href = 'mailto:support.chhotipdf@gmail.com';
  };

  const goHome = () => {
    // Trigger the same reset as "Process Another File"
    window.dispatchEvent(new Event('reset-app'));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
    <nav className="sticky top-0 inset-x-0 z-40 bg-[#ccdbdc] backdrop-blur border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4">
      <div className="flex justify-between items-center h-14 md:h-16">
            {/* Logo - click to go home */}
            <button type="button" onClick={goHome} className="flex items-center space-x-3 hover:opacity-90">
              <img src="/ChhotiPDF-LOGO.png" alt="ChhotiPDF logo" className="w-8 h-8 rounded-lg" />
              <span className="text-xl font-bold bg-gradient-to-l from-red-600 via-indigo-600 to-blue-900 text-transparent bg-clip-text">ChhotiPDF
              </span>
            </button>

            {/* Navigation Links */}
            <div className="hidden md:flex items-center space-x-8">
              <button onClick={scrollToFeatures} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Features
              </button>
              <button onClick={openContact} className="text-slate-600 hover:text-blue-600 font-medium transition-colors">
                Contact
              </button>
            </div>

            {/* CTA Button */}
            <div className="hidden md:block">
              <button className="btn-primary" onClick={() => setShowModal(true)}>
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                aria-label="Open menu"
                aria-expanded={mobileOpen}
                aria-controls="mobile-menu"
                className="text-slate-600 hover:text-blue-600 p-2"
                onClick={() => setMobileOpen((v) => !v)}
              >
                {mobileOpen ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
        {/* Mobile Menu */}
        {mobileOpen && (
          <div id="mobile-menu" className="md:hidden border-t border-slate-200 bg-[#ccdbdc]">
            <div className="px-4 py-3 space-y-2">
              <button
                onClick={() => { setMobileOpen(false); scrollToFeatures(); }}
                className="block w-full text-left px-3 py-2 rounded-md text-slate-700 hover:bg-white/60"
              >
                Features
              </button>
              <button
                onClick={() => { setMobileOpen(false); openContact(); }}
                className="block w-full text-left px-3 py-2 rounded-md text-slate-700 hover:bg-white/60"
              >
                Contact
              </button>
              <button
                onClick={() => { setMobileOpen(false); setShowModal(true); }}
                className="btn-primary w-full"
              >
                Get Started
              </button>
            </div>
          </div>
        )}
      </nav>

      {showModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-3 sm:p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 md:p-12 w-full max-w-sm sm:max-w-md md:max-w-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <img src="/ChhotiPDF-LOGO.png" alt="ChhotiPDF" className="w-7 h-7 sm:w-8 sm:h-8 rounded" />
              <h3 className="text-base sm:text-lg font-semibold text-slate-900">Continue as guest <span aria-hidden>😊</span></h3>
            </div>
            <p className="text-slate-600 mb-4 sm:mb-6 text-sm sm:text-base">No signup required. Start using ChhotiPDF tools instantly.</p>
            <div>
              <button className="btn-primary w-full" onClick={() => setShowModal(false)}>Get started for free</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
