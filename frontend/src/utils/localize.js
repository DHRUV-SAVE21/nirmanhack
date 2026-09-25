/**
 * Localization utilities for numbers and item names.
 */

const DEVANAGARI_DIGITS = ['०', '१', '२', '३', '४', '५', '६', '७', '८', '९'];

/**
 * Convert a number (or numeric string) to Devanagari digits for hi/mr,
 * keeping Indian comma grouping.  English stays as-is.
 */
export function localizeNumber(value, lang) {
    if (value == null) return '';
    const str = typeof value === 'number'
        ? value.toLocaleString('en-IN')       // Indian grouping  (1,23,456)
        : String(value);
    if (lang !== 'hi' && lang !== 'mr') return str;
    return str.replace(/\d/g, d => DEVANAGARI_DIGITS[d]);
}

/**
 * Short-hand for currency: ₹1,23,456 → ₹१,२३,४५६
 */
export function localizeCurrency(num, lang) {
    if (num == null) return '';
    const formatted = typeof num === 'number'
        ? num.toLocaleString('en-IN')
        : String(num);
    const rupee = `₹${formatted}`;
    if (lang !== 'hi' && lang !== 'mr') return rupee;
    return rupee.replace(/\d/g, d => DEVANAGARI_DIGITS[d]);
}

/**
 * Translate common crop / input / asset names.
 * Key = lowercased English name from the DB.
 */
const ITEM_NAMES = {
    // ─── Produce / Crops ──────────────────────────────────
    wheat:        { hi: 'गेहूं',      mr: 'गहू' },
    rice:         { hi: 'चावल',       mr: 'तांदूळ' },
    paddy:        { hi: 'धान',        mr: 'भात' },
    maize:        { hi: 'मक्का',      mr: 'मका' },
    corn:         { hi: 'मक्का',      mr: 'मका' },
    bajra:        { hi: 'बाजरा',      mr: 'बाजरी' },
    jowar:        { hi: 'ज्वार',      mr: 'ज्वारी' },
    sorghum:      { hi: 'ज्वार',      mr: 'ज्वारी' },
    ragi:         { hi: 'रागी',       mr: 'नाचणी' },
    barley:       { hi: 'जौ',         mr: 'जव' },
    potato:       { hi: 'आलू',        mr: 'बटाटा' },
    tomato:       { hi: 'टमाटर',      mr: 'टोमॅटो' },
    onion:        { hi: 'प्याज',      mr: 'कांदा' },
    garlic:       { hi: 'लहसुन',      mr: 'लसूण' },
    ginger:       { hi: 'अदरक',       mr: 'आले' },
    turmeric:     { hi: 'हल्दी',      mr: 'हळद' },
    chilli:       { hi: 'मिर्च',      mr: 'मिरची' },
    chili:        { hi: 'मिर्च',      mr: 'मिरची' },
    brinjal:      { hi: 'बैंगन',      mr: 'वांगे' },
    eggplant:     { hi: 'बैंगन',      mr: 'वांगे' },
    cabbage:      { hi: 'पत्ता गोभी', mr: 'कोबी' },
    cauliflower:  { hi: 'फूल गोभी',   mr: 'फुलकोबी' },
    spinach:      { hi: 'पालक',       mr: 'पालक' },
    okra:         { hi: 'भिंडी',      mr: 'भेंडी' },
    ladyfinger:   { hi: 'भिंडी',      mr: 'भेंडी' },
    peas:         { hi: 'मटर',        mr: 'वाटाणे' },
    carrot:       { hi: 'गाजर',       mr: 'गाजर' },
    radish:       { hi: 'मूली',       mr: 'मुळा' },
    beetroot:     { hi: 'चुकंदर',     mr: 'बीट' },
    sugarcane:    { hi: 'गन्ना',      mr: 'ऊस' },
    cotton:       { hi: 'कपास',       mr: 'कापूस' },
    soybean:      { hi: 'सोयाबीन',    mr: 'सोयाबीन' },
    soyabean:     { hi: 'सोयाबीन',    mr: 'सोयाबीन' },
    groundnut:    { hi: 'मूंगफली',    mr: 'भुईमूग' },
    peanut:       { hi: 'मूंगफली',    mr: 'भुईमूग' },
    mustard:      { hi: 'सरसों',      mr: 'मोहरी' },
    sunflower:    { hi: 'सूरजमुखी',   mr: 'सूर्यफूल' },
    sesame:       { hi: 'तिल',        mr: 'तीळ' },
    lentil:       { hi: 'मसूर',       mr: 'मसूर' },
    moong:        { hi: 'मूंग',       mr: 'मूग' },
    urad:         { hi: 'उड़द',       mr: 'उडीद' },
    chana:        { hi: 'चना',        mr: 'हरभरा' },
    chickpea:     { hi: 'चना',        mr: 'हरभरा' },
    toor:         { hi: 'तुअर',       mr: 'तूर' },
    arhar:        { hi: 'अरहर',       mr: 'तूर' },
    mango:        { hi: 'आम',         mr: 'आंबा' },
    banana:       { hi: 'केला',       mr: 'केळी' },
    grapes:       { hi: 'अंगूर',      mr: 'द्राक्षे' },
    pomegranate:  { hi: 'अनार',       mr: 'डाळिंब' },
    orange:       { hi: 'संतरा',      mr: 'संत्रा' },
    lemon:        { hi: 'नींबू',      mr: 'लिंबू' },
    papaya:       { hi: 'पपीता',      mr: 'पपई' },
    guava:        { hi: 'अमरूद',      mr: 'पेरू' },
    coconut:      { hi: 'नारियल',     mr: 'नारळ' },
    watermelon:   { hi: 'तरबूज',      mr: 'कलिंगड' },
    cucumber:     { hi: 'खीरा',       mr: 'काकडी' },
    bitter_gourd: { hi: 'करेला',      mr: 'कारले' },
    bottle_gourd: { hi: 'लौकी',       mr: 'दुधी भोपळा' },
    pumpkin:      { hi: 'कद्दू',      mr: 'भोपळा' },
    coriander:    { hi: 'धनिया',      mr: 'कोथिंबीर' },
    fenugreek:    { hi: 'मेथी',       mr: 'मेथी' },
    drumstick:    { hi: 'सहजन',       mr: 'शेवगा' },
    capsicum:     { hi: 'शिमला मिर्च',mr: 'ढोबळी मिरची' },
    mint:         { hi: 'पुदीना',     mr: 'पुदिना' },
    tea:          { hi: 'चाय',        mr: 'चहा' },
    coffee:       { hi: 'कॉफी',       mr: 'कॉफी' },
    jute:         { hi: 'जूट',        mr: 'ताग' },
    tobacco:      { hi: 'तम्बाकू',    mr: 'तंबाखू' },
    rubber:       { hi: 'रबर',        mr: 'रबर' },

    // ─── Inputs / Fertilizers / Pesticides ────────────────
    urea:         { hi: 'यूरिया',     mr: 'युरिया' },
    dap:          { hi: 'डीएपी',      mr: 'डीएपी' },
    'dap fertilizer': { hi: 'डीएपी खाद', mr: 'डीएपी खत' },
    npk:          { hi: 'एनपीके',     mr: 'एनपीके' },
    potash:       { hi: 'पोटाश',      mr: 'पोटॅश' },
    superphosphate: { hi: 'सुपर फॉस्फेट', mr: 'सुपर फॉस्फेट' },
    vermicompost: { hi: 'वर्मीकम्पोस्ट', mr: 'गांडूळ खत' },
    compost:      { hi: 'खाद',        mr: 'कंपोस्ट' },
    fertilizer:   { hi: 'उर्वरक',     mr: 'खत' },
    pesticide:    { hi: 'कीटनाशक',    mr: 'कीटकनाशक' },
    insecticide:  { hi: 'कीटनाशक',    mr: 'कीटकनाशक' },
    fungicide:    { hi: 'फफूंदनाशक',   mr: 'बुरशीनाशक' },
    herbicide:    { hi: 'शाकनाशी',    mr: 'तणनाशक' },
    seed:         { hi: 'बीज',        mr: 'बियाणे' },
    seeds:        { hi: 'बीज',        mr: 'बियाणे' },

    // ─── Assets / Equipment ───────────────────────────────
    tractor:      { hi: 'ट्रैक्टर',   mr: 'ट्रॅक्टर' },
    pump:         { hi: 'पंप',        mr: 'पंप' },
    sprayer:      { hi: 'स्प्रेयर',   mr: 'फवारणी यंत्र' },
    plough:       { hi: 'हल',         mr: 'नांगर' },
    harvester:    { hi: 'हार्वेस्टर', mr: 'कापणी यंत्र' },
    thresher:     { hi: 'थ्रेशर',     mr: 'मळणी यंत्र' },
    cultivator:   { hi: 'कल्टीवेटर',  mr: 'कल्टिवेटर' },
    rotavator:    { hi: 'रोटावेटर',   mr: 'रोटाव्हेटर' },
    drip:         { hi: 'ड्रिप',      mr: 'ठिबक' },
    'drip system':{ hi: 'ड्रिप सिस्टम', mr: 'ठिबक सिंचन' },
    pipe:         { hi: 'पाइप',       mr: 'पाईप' },
    generator:    { hi: 'जनरेटर',     mr: 'जनरेटर' },
    motor:        { hi: 'मोटर',       mr: 'मोटर' },
};

/**
 * Translate an item name (crop / input / asset) to the current language.
 * Falls back to the original name if no translation exists.
 */
export function localizeItemName(name, lang) {
    if (!name || lang === 'en') return name;
    const key = name.toLowerCase().trim();
    const entry = ITEM_NAMES[key];
    if (entry && entry[lang]) return entry[lang];
    // Try first word match (e.g. "Potato Grade A" → "आलू Grade A")
    const firstWord = key.split(/\s+/)[0];
    const partial = ITEM_NAMES[firstWord];
    if (partial && partial[lang]) {
        return partial[lang] + name.slice(firstWord.length);
    }
    return name;
}

/**
 * Accept-Language value for geocoding APIs based on i18n language.
 */
export function geoLang(lang) {
    if (lang === 'hi') return 'hi-IN,hi';
    if (lang === 'mr') return 'mr-IN,mr';
    return 'en-IN,en';
}
