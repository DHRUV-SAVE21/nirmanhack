import Fuse from 'fuse.js';
import { AVAILABLE_ROUTES } from './routeConfig';
import i18n from '../i18n';

// Common field synonyms to map speech (En, Hi, Mr) to input attributes
const FIELD_SYNONYMS = {
    'name': ['name', 'full name', 'identity', 'naam', 'नाम', 'नाव', 'pura naam', 'mera naam', 'मेरा नाम', 'माझे नाव'],
    'first_name': ['first name', 'pila naam', 'पहला नाम', 'पहिले नाव'],
    'last_name': ['last name', 'surname', 'upnaam', 'aadnaam', 'सरनेम', 'आडनाव', 'kulnaam'],
    'email': ['email', 'mail', 'id', 'ईमेल', 'mail id'],
    'password': ['password', 'passcode', 'code', 'पासवर्ड', 'गुप्त शब्द'],
    'mobile': ['mobile', 'phone', 'contact', 'number', 'phone number', 'मोबाइल', 'फोन', 'mobile number', 'maubail'],
    'aadhaar': ['aadhaar', 'aadhar', 'id card', 'uid', 'आधार', 'aadhaar number', 'aadhar card'],
    'weight': ['weight', 'vajan', 'kg', 'वजन', 'vazaan', 'kilo'],
    'height': ['height', 'un chi', 'tall', 'cm', 'centimeters', 'ऊंचाई', 'उंची', 'unchi', 'lambai'],
    'address': ['address', 'place', 'location', 'village', 'पता', 'पत्ता', 'gaon', 'shahar'],
    'crop': ['crop', 'plant', 'sowing', 'seed', 'फसल', 'पीक', 'fasal', 'peak', 'piik'],
    'area': ['area', 'size', 'acre', 'hectare', 'kshetrafal', 'jagah', 'क्षेत्रफल', 'जागा', 'ekad'],
    'bank': ['bank', 'account', 'branch', 'बैंक', 'khata', 'खाता'],
};

// Action keywords for button clicks
const CLICK_KEYWORDS = [
    'submit', 'save', 'calculate', 'send', 'reset', 'clear', 'open', 'analyze', 'search', 'find', 'buy', 'order', 'start', 'stop', 'login', 'signup', 'sign in', 'register', 'apply',
    'जमा करें', 'बचाएं', 'खोलें', 'खरीदें', 'सर्च', 'आवेदन', 'पुष्टी करा', 'पाठवा', 'submit form', 'save data'
];

// Helper: fuzzy search array of keywords in a text block
const containsFuzzy = (haystack, needlesArray, threshold = 0.3) => {
    if (!haystack || typeof haystack !== 'string') return false;
    // If exact match (fallback / faster)
    if (needlesArray.some(n => haystack.includes(n))) return true;
    
    // Fuzzy matching to find typos or spoken errors
    // We break haystack into words and pairs of words to check against needles
    const words = haystack.split(/\s+/);
    const searchable = [];
    words.forEach(w => searchable.push({ text: w }));
    for(let i=0; i<words.length-1; i++){
        searchable.push({ text: words[i]+" "+words[i+1] });
        if (i<words.length-2) {
            searchable.push({ text: words[i]+" "+words[i+1]+" "+words[i+2] });
        }
    }

    const fuse = new Fuse(searchable, { 
        keys: ['text'], 
        threshold,
        distance: 100,
        ignoreLocation: true,
        minMatchCharLength: 3 // To prevent random 1-2 letter noise matching
    });
    
    for (const needle of needlesArray) {
        // If needle is too short, rely on exact match to prevent false positives
        if (needle.length < 3) continue;
        const result = fuse.search(needle);
        if (result.length > 0) return true;
    }
    return false;
};

export const processVoiceLocally = (transcript, currentPath, isInterim = false) => {
    let text = transcript || "";
    text = text.toLowerCase().trim();

    // 0. Base System Actions
    if (containsFuzzy(text, ['go back', 'piche', 'मागे'])) {
        return { targetPath: -1, feedback: 'Going back. पीछे जा रहे हैं। मागे जात आहोत।' };
    }
    if (containsFuzzy(text, ['refresh', 'reload', 'ताज़ा', 'रीफ्रेश'])) {
        return { action: { type: 'click', selector: 'refresh' }, feedback: 'Refreshing page. पेज रीफ्रेश हो रहा है। पेज रिफ्रेश होत आहे।' };
    }

    // 1. Navigation Intent (Disease Diagnosis / Yield Prediction Specifics)
    if (containsFuzzy(text, ['disease', 'bimari', 'rog', 'बीमारी', 'रोग', 'पिकावर रोग', 'health'])) {
        return { 
            targetPath: '/crop-health', 
            feedback: 'Opening Disease Diagnosis tools. फसल रोग निदान उपकरण खोल रहे हैं।' 
        };
    }

    if (containsFuzzy(text, ['yield', 'utpadan', 'पैदावार', 'उत्पादन', 'कितना अनाज', 'harvest', 'recommendation'])) {
        return { 
            targetPath: '/crop-recommendation', 
            feedback: 'Navigating to Yield Prediction and Analysis. पैदावार और विश्लेषण पर जा रहे हैं।' 
        };
    }

    const voiceNavKeywords = {
        'dashboard': ['dashboard', 'home', 'main page', 'डॅशबोर्ड', 'मुख्य पृष्ठ', 'डैशबोर्ड'],
        'equipment': ['equipment', 'machine', 'tools', 'analyzer', 'उपकरण', 'मशीन', 'यंत्र', 'साधने'],
        'mark_land': ['mark land', 'map land', 'land', 'property', 'जमीन चिन्हांकित करा', 'भूमी', 'जमीन'],
        'crop_health': ['crop health', 'disease', 'diagnosis', 'sick plant', 'पिकांचे आरोग्य', 'रोग', 'फसल स्वास्थ्य', 'बीमारी'],
        'insurance': ['insurance', 'claim', 'वीमा', 'विमा', 'क्लेम'],
        'auto_farm': ['auto farm', 'autonomous', 'robot', 'स्वयंचलित शेती', 'ऑटो फार्म', 'रोबोट'],
        'crop_recommend': ['crop recommendation', 'yield', 'what to grow', 'पीक शिफारस', 'उत्पादन', 'फसल की सिफारिश', 'पैदावार'],
        'schemes': ['schemes', 'subsidies', 'government', 'योजना', 'सबसिडी', 'सरकारी योजना'],
        'inventory': ['inventory', 'stock', 'storage', 'supplies', 'इन्व्हेंटरी', 'साठा', 'स्टॉक', 'भंडारण'],
        'news': ['news', 'disaster', 'update', 'बातम्या', 'आपत्ती', 'समाचार', 'अपडेट'],
        'profile': ['profile', 'account', 'my details', 'प्रोफाइल', 'खाते', 'माझे तपशील', 'अकाउंट']
    };

    const voiceNavKeys = [
        { key: 'dashboard', path: '/dashboard' },
        { key: 'equipment', path: '/equipment' },
        { key: 'mark_land', path: '/mark-my-land' },
        { key: 'crop_health', path: '/crop-health' },
        { key: 'insurance', path: '/insurance-claim' },
        { key: 'auto_farm', path: '/autonomous-farm' },
        { key: 'crop_recommend', path: '/crop-recommendation' },
        { key: 'schemes', path: '/schemes-assistant' },
        { key: 'inventory', path: '/inventory' },
        { key: 'news', path: '/disaster-news' },
        { key: 'profile', path: '/profile' }
    ];

    for (const { key, path } of voiceNavKeys) {
        const allKeywords = voiceNavKeywords[key] || [];
        if (allKeywords.length > 0 && containsFuzzy(text, allKeywords, 0.25)) {
             return {
                  targetPath: path,
                  feedback: `Opening ${key.replace('_', ' ')}...`
             };
        }
    }

    // 1.5 Form Filling & Profile Setup (Advanced)
    const fillMatch = text.match(/(?:set|change|my|the|mera|mera naam|naam|naam hai|nav|नाव|नाव आहे|नाव आहे|नाम है|नाम)\s+(.*?)\s+(?:is|to|as|hai|aahe|है|आहे)\s+(.+)/i) ||
        text.match(/(.*?)\s+(?:is|to|hai|aahe|है|आहे)\s+(.+)/i) ||
        text.match(/(.*?)\s+(?:नाम है|नाम|नाव आहे|नाव)\s+(.+)/i);

    if (fillMatch) {
        const extractedField = fillMatch[1].trim();
        const extractedValue = fillMatch[2].trim();

        for (const [canonical, synonyms] of Object.entries(FIELD_SYNONYMS)) {
            if (containsFuzzy(extractedField, synonyms, 0.4) || containsFuzzy(extractedField, [canonical], 0.4)) {
                return {
                    action: {
                        type: 'fill',
                        selector: canonical,
                        value: extractedValue
                    },
                    feedback: `Setting ${canonical.replace('_', ' ')} to ${extractedValue}. ${canonical} सेट कर दिया।`
                };
            }
        }
    }

    // 2. High-Accuracy Field Extractions (Numbers)
    const patterns = {
        phone: /(\d{10})/,
        aadhaar: /(\d{12})|(\d{4}\s\d{4}\s\d{4})/,
    };

    if ((text.includes('aadhaar') || text.includes('आधार') || containsFuzzy(text, ['aadhaar', 'aadhar', 'आधार'], 0.2)) && text.match(patterns.aadhaar)) {
        const val = text.match(patterns.aadhaar)[0].replace(/\s/g, '');
        return { action: { type: 'fill', selector: 'aadhaar', value: val }, feedback: 'Updating Aadhaar number. आधार नंबर अपडेट कर दिया।' };
    }
    if ((containsFuzzy(text, ['phone', 'mobile', 'नंबर', 'फोन'], 0.2)) && text.match(patterns.phone)) {
        const val = text.match(patterns.phone)[1];
        return { action: { type: 'fill', selector: 'mobile', value: val }, feedback: 'Updating mobile number. फोन नंबर सेट कर दिया।' };
    }

    // 3. Click Actions
    if (containsFuzzy(text, CLICK_KEYWORDS, 0.2)) {
        // Find which keyword was exactly matched or fuzzy matched
        const words = text.split(/\s+/);
        const fuse = new Fuse(CLICK_KEYWORDS.map(k=>({key:k})), { keys: ['key'], threshold: 0.3 });
        let matchedKeyword = null;
        
        for(let w of words) {
            const res = fuse.search(w);
            if(res.length > 0) {
                matchedKeyword = res[0].item.key;
                break;
            }
        }
        
        if (matchedKeyword) {
            return {
                action: { type: 'click', selector: matchedKeyword },
                feedback: `Executing action: ${matchedKeyword}. शुरू कर दिया।`
            };
        }
    }

    // 4. Scroll & UI Controls
    if (containsFuzzy(text, ['scroll down', 'niche', 'खाली'])) {
        return { action: { type: 'scroll', value: 'down' }, feedback: 'Moving down. नीचे जा रहे हैं।' };
    }
    if (containsFuzzy(text, ['scroll up', 'upar', 'वर'])) {
        return { action: { type: 'scroll', value: 'up' }, feedback: 'Moving up. ऊपर जा रहे हैं।' };
    }

    // 5. Special: Schemes Chat Interface
    // Only send to chat if it's the final result, to avoid spamming the AI backend in real-time
    if (!isInterim && currentPath === '/schemes-assistant' && text.length > 5) {
        return {
            action: { type: 'chat', query: transcript },
            feedback: `Processing your request... आपके सवाल का जवाब ढूंढ रहे हैं।`
        };
    }

    // 7. Generic Fallback
    return {
        targetPath: null,
        action: null,
        feedback: "Listening...", // For real-time, we can show "Listening..." instead of full help text
        isFallback: true
    };
};
