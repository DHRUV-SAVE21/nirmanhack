import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { Phone, PhoneOff, Mic } from 'lucide-react';
import Vapi from '@vapi-ai/web';

const VAPI_KEY = import.meta.env.VITE_VAPI_API_KEY;

// Full inline assistant config — no pre-created assistant ID needed
const ASSISTANT_CONFIG = {
  name: 'Annadata Saathi',
  firstMessage: 'नमस्ते! मैं अन्नदाता साथी हूँ। आपकी खेती में कैसे मदद कर सकता हूँ? You can also speak in Marathi or English.',
  transcriber: {
    provider: 'deepgram',
    model: 'nova-2',
    language: 'hi', // Hindi primary; Deepgram auto-detects mixed speech
  },
  model: {
    provider: 'openai',
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'system',
        content: `You are Annadata Saathi (अन्नदाता साथी), a friendly AI farming assistant for Indian farmers.

LANGUAGE RULE: Detect the farmer's language (Hindi, Marathi, or English) and ALWAYS reply in the same language. Default to Hindi if unclear.

You help with:
- Crop diseases & pest control
- Irrigation & fertilizer guidance  
- Soil health & weather advice
- Crop selection by season/region
- Government schemes (PM-KISAN, crop insurance, subsidies)
- Mandi prices & best time to sell

Rules:
- Speak simply — farmers may not know technical terms
- Give practical, actionable advice
- Be warm, patient, and respectful
- If unsure, suggest consulting the local Krishi Vigyan Kendra (KVK)`,
      },
    ],
  },
  voice: {
    provider: '11labs',
    voiceId: 'pNInz6obpgDQGcFmaJgB', // Adam — clear, neutral voice
  },
};

const ASSISTANT_ID = import.meta.env.VITE_VAPI_ASSISTANT_ID;

const CallingAssistantButton = () => {
  const [status, setStatus] = useState('idle'); // idle | connecting | active | error
  const [errorMsg, setErrorMsg] = useState('');
  const vapiRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    return () => {
      if (vapiRef.current) {
        vapiRef.current.stop();
      }
    };
  }, []);

  // Must be AFTER all hooks to avoid "Rendered fewer hooks" error
  if (location.pathname === '/auth' || location.pathname === '/auth-face') return null;

  const getErrorMessage = (err) => {
    try {
      if (typeof err === 'string') return err;
      if (err?.error?.message && typeof err.error.message === 'string') return err.error.message;
      if (err?.message && typeof err.message === 'string') return err.message;
      if (err?.message && typeof err.message === 'object') return JSON.stringify(err.message);
      return JSON.stringify(err) || 'Call failed';
    } catch {
      return 'Unknown error occurred';
    }
  };

  const getVapiInstance = () => {
    if (vapiRef.current) return vapiRef.current;
    
    if (!VAPI_KEY || VAPI_KEY === 'your_vapi_public_key_here') {
      console.warn('[Vapi] VITE_VAPI_API_KEY is not set in frontend/.env');
      throw new Error('VITE_VAPI_API_KEY is missing');
    }
    
    const vapi = new Vapi(VAPI_KEY);
    vapiRef.current = vapi;

    vapi.on('call-start', () => setStatus('active'));
    vapi.on('call-end', () => setStatus('idle'));
    vapi.on('error', (e) => {
      console.error('[Vapi error]', e);
      setStatus('error');
      setErrorMsg(getErrorMessage(e));
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 6000);
    });
    
    return vapi;
  };

  const handleClick = async () => {
    let vapi;
    try {
      vapi = getVapiInstance();
    } catch (err) {
      setStatus('error');
      setErrorMsg('Vapi config missing. Check VITE_VAPI_API_KEY.');
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 4000);
      return;
    }

    if (status === 'active' || status === 'connecting') {
      vapi.stop();
      setStatus('idle');
      return;
    }

    try {
      setStatus('connecting');
      // The .env VITE_VAPI_ASSISTANT_ID is a 10-digit phone number, which throws 400 Bad Request.
      // So we will use the inline ASSISTANT_CONFIG instead.
      await vapi.start(ASSISTANT_CONFIG);
    } catch (e) {
      console.error('[Vapi start error]', e);
      setStatus('error');
      setErrorMsg(getErrorMessage(e));
      setTimeout(() => { setStatus('idle'); setErrorMsg(''); }, 6000);
    }
  };

  const isActive = status === 'active';
  const isConnecting = status === 'connecting';

  return (
    <div data-tour="calling-assistant" className="fixed bottom-44 right-6 z-50 flex flex-col items-end gap-3">

      {/* Error toast */}
      <AnimatePresence>
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-500 text-white text-xs px-3 py-2 rounded-lg shadow-lg max-w-[200px] text-center"
          >
            {errorMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative">
        {/* Pulse rings when active/connecting */}
        <AnimatePresence>
          {(isActive || isConnecting) && (
            <>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.4, 0, 0.4], scale: [1, 1.6, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute inset-0 bg-blue-500 rounded-full"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: [0.2, 0, 0.2], scale: [1, 2.2, 1] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
                className="absolute inset-0 bg-blue-500 rounded-full"
              />
            </>
          )}
        </AnimatePresence>

        {/* Main button */}
        <motion.button
          whileHover={{ scale: 1.07 }}
          whileTap={{ scale: 0.93 }}
          onClick={handleClick}
          title={isActive ? 'End call' : 'Talk to Annadata Saathi'}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-colors duration-300 z-10 border-2 text-white
            ${isActive
              ? 'bg-gradient-to-br from-red-500 to-red-600 border-red-300 shadow-[0_0_18px_rgba(239,68,68,0.5)]'
              : isConnecting
                ? 'bg-gradient-to-br from-blue-400 to-blue-500 border-blue-300'
                : 'bg-gradient-to-br from-indigo-500 to-indigo-600 border-indigo-400 hover:shadow-[0_0_15px_rgba(99,102,241,0.5)]'
            }`}
        >
          {isConnecting ? (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          ) : isActive ? (
            <PhoneOff size={22} />
          ) : (
            <Phone size={24} />
          )}
        </motion.button>

        {/* Idle tooltip */}
        {status === 'idle' && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg pointer-events-none"
          >
            Annadata Saathi
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-white dark:bg-slate-900 rotate-45" />
          </motion.div>
        )}

        {/* Active label */}
        {isActive && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="absolute right-full mr-3 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg whitespace-nowrap shadow-lg flex items-center gap-1.5 pointer-events-none"
          >
            <Mic size={11} className="animate-pulse" /> Speaking...
            <div className="absolute top-1/2 -translate-y-1/2 -right-1 w-2 h-2 bg-blue-600 rotate-45" />
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CallingAssistantButton;
