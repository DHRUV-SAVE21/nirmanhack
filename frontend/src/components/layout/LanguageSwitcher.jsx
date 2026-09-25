import React from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';
import { supportedLanguages } from '../i18n';

const LanguageSwitcher = ({ className = '' }) => {
    const { i18n } = useTranslation();
    const [isOpen, setIsOpen] = React.useState(false);

    const currentLanguage = supportedLanguages.find(lang => lang.code === i18n.language) || supportedLanguages[0];

    const changeLanguage = (langCode) => {
        i18n.changeLanguage(langCode);
        setIsOpen(false);
        // Persist to localStorage
        localStorage.setItem('i18nextLng', langCode);
    };

    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 dark:bg-white/10 shadow-sm dark:shadow-none hover:bg-white/20 border border-slate-200 dark:border-white/10 transition-all text-sm font-medium"
            >
                <Globe size={16} className="text-slate-600 dark:text-gray-400" />
                <span className="hidden sm:inline">{currentLanguage.nativeName}</span>
                <span className="sm:hidden">{currentLanguage.code.toUpperCase()}</span>
                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsOpen(false)}
                    />
                    
                    {/* Dropdown */}
                    <div className="absolute right-0 top-full mt-2 z-50 min-w-[150px] py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-white/10 shadow-xl">
                        {supportedLanguages.map((lang) => (
                            <button
                                key={lang.code}
                                onClick={() => changeLanguage(lang.code)}
                                className={`w-full px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-white/5 transition-colors flex items-center justify-between ${
                                    lang.code === i18n.language ? 'text-organic-green font-bold' : 'text-gray-700 dark:text-gray-300'
                                }`}
                            >
                                <span>{lang.nativeName}</span>
                                <span className="text-xs text-slate-600 dark:text-gray-400 uppercase">{lang.code}</span>
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
};

export default LanguageSwitcher;
