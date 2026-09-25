import React, { useEffect, useRef, useState } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

/**
 * GoogleTranslate — custom language picker that drives Google Translate.
 *
 * Strategy:
 *  1. `index.html` initialises a REAL (but hidden) TranslateElement so the
 *     Google Translate library actually activates on the page.
 *  2. We use the `doGTranslate("en|{code}")` helper that the library exposes,
 *     which is the officially-supported programmatic API.  This avoids relying
 *     on the invisible iframe select widget.
 *  3. For selecting "English" (reset), we clear the cookie and reload because
 *     the library doesn't expose a clean reset method.
 */

const LANGUAGES = [
  { code: 'en',    label: 'English',    flag: '🇬🇧' },
  { code: 'hi',    label: 'हिन्दी',      flag: '🇮🇳' },
  { code: 'mr',    label: 'मराठी',       flag: '🇮🇳' },
  { code: 'ta',    label: 'தமிழ்',       flag: '🇮🇳' },
  { code: 'te',    label: 'తెలుగు',      flag: '🇮🇳' },
  { code: 'bn',    label: 'বাংলা',       flag: '🇮🇳' },
  { code: 'gu',    label: 'ગુજરાતી',     flag: '🇮🇳' },
  { code: 'kn',    label: 'ಕನ್ನಡ',       flag: '🇮🇳' },
  { code: 'ml',    label: 'മലയാളം',      flag: '🇮🇳' },
  { code: 'pa',    label: 'ਪੰਜਾਬੀ',      flag: '🇮🇳' },
  { code: 'ur',    label: 'اردو',        flag: '🇵🇰' },
  { code: 'fr',    label: 'Français',    flag: '🇫🇷' },
  { code: 'es',    label: 'Español',     flag: '🇪🇸' },
  { code: 'de',    label: 'Deutsch',     flag: '🇩🇪' },
  { code: 'ar',    label: 'العربية',     flag: '🇸🇦' },
  { code: 'zh-CN', label: '中文',         flag: '🇨🇳' },
  { code: 'ja',    label: '日本語',       flag: '🇯🇵' },
  { code: 'ko',    label: '한국어',       flag: '🇰🇷' },
  { code: 'ru',    label: 'Русский',     flag: '🇷🇺' },
  { code: 'pt',    label: 'Português',   flag: '🇧🇷' },
];

/** Read active lang code from the googtrans cookie */
const getActiveLangCode = () => {
  const match = document.cookie.match(/googtrans=\/en\/([^;]+)/);
  return match ? decodeURIComponent(match[1]) : 'en';
};

/** Erase googtrans cookie on both common paths */
const clearGoogTransCookie = () => {
  const hosts = [window.location.hostname, '.' + window.location.hostname];
  const paths = ['/', '/en'];
  hosts.forEach(h => {
    paths.forEach(p => {
      document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${p}; domain=${h}`;
    });
  });
  // also clear without explicit domain
  paths.forEach(p => {
    document.cookie = `googtrans=; expires=Thu, 01 Jan 1970 00:00:01 GMT; path=${p}`;
  });
};

/** Trigger language change via Google's programmatic API */
const applyLanguage = (code) => {
  if (code === 'en') {
    // Reset: clear cookie and reload so original text is restored
    clearGoogTransCookie();
    window.location.reload();
    return;
  }

  // Try the doGTranslate programmatic API first (fastest, no reload needed)
  if (typeof window.doGTranslate === 'function') {
    window.doGTranslate(`en|${code}`);
    return;
  }

  // Fallback: write cookie + reload (works if library isn't fully ready yet)
  clearGoogTransCookie();
  const val = `/en/${code}`;
  document.cookie = `googtrans=${val}; path=/`;
  document.cookie = `googtrans=${val}; path=/en`;
  window.location.reload();
};

const GoogleTranslate = ({ isLandingPageTop = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeLang, setActiveLang] = useState(() => {
    const code = getActiveLangCode();
    return LANGUAGES.find(l => l.code === code) || LANGUAGES[0];
  });
  const wrapperRef = useRef(null);
  const listRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Scroll the active item into view when dropdown opens
  useEffect(() => {
    if (isOpen && listRef.current) {
      const activeEl = listRef.current.querySelector('[data-active="true"]');
      if (activeEl) activeEl.scrollIntoView({ block: 'nearest' });
    }
  }, [isOpen]);

  const handleSelect = (lang) => {
    setActiveLang(lang);
    setIsOpen(false);
    applyLanguage(lang.code);
  };

  return (
    <div className="relative" ref={wrapperRef} style={{ zIndex: 9999 }}>
      {/* ── Trigger button ── */}
      <button
        id="gt-trigger-btn"
        onClick={() => setIsOpen(prev => !prev)}
        data-tour="navbar-language"
        title="Translate this page"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '6px 12px',
          borderRadius: '8px',
          border: isLandingPageTop
            ? '1px solid rgba(255,255,255,0.25)'
            : '1px solid rgba(148,163,184,0.4)',
          background: isLandingPageTop
            ? 'rgba(255,255,255,0.12)'
            : 'rgba(241,245,249,0.9)',
          color: isLandingPageTop ? '#ffffff' : '#334155',
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 600,
          backdropFilter: 'blur(8px)',
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
          userSelect: 'none',
        }}
      >
        <Globe size={14} />
        <span style={{ maxWidth: '80px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {activeLang.flag}&nbsp;{activeLang.label}
        </span>
        <ChevronDown
          size={12}
          style={{
            transition: 'transform 0.2s ease',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        />
      </button>

      {/* ── Dropdown ── */}
      {isOpen && (
        <div
          ref={listRef}
          style={{
            position: 'fixed',          // fixed so it can never be clipped by parent overflow
            top: (() => {
              // position just below the button
              if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                return `${rect.bottom + 8}px`;
              }
              return '64px';
            })(),
            right: (() => {
              if (wrapperRef.current) {
                const rect = wrapperRef.current.getBoundingClientRect();
                return `${window.innerWidth - rect.right}px`;
              }
              return '16px';
            })(),
            width: '210px',
            maxHeight: '340px',
            overflowY: 'auto',
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 16px 48px rgba(0,0,0,0.2), 0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 999999,
            padding: '6px',
            scrollbarWidth: 'thin',
            scrollbarColor: '#cbd5e1 transparent',
          }}
        >
          {/* Header */}
          <div style={{
            padding: '4px 10px 8px',
            fontSize: '10px',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            color: '#94a3b8',
            borderBottom: '1px solid #f1f5f9',
            marginBottom: '4px',
          }}>
            🌐 Select Language
          </div>

          {/* Language options */}
          {LANGUAGES.map((lang) => {
            const isActive = lang.code === activeLang.code;
            return (
              <button
                key={lang.code}
                data-active={isActive}
                onClick={() => handleSelect(lang)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: 'none',
                  background: isActive ? '#f0fdf4' : 'transparent',
                  color: isActive ? '#059669' : '#334155',
                  fontWeight: isActive ? 700 : 400,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s ease',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#f8fafc'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '15px', lineHeight: 1 }}>{lang.flag}</span>
                  <span>{lang.label}</span>
                </span>
                {isActive && <Check size={13} color="#059669" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoogleTranslate;
