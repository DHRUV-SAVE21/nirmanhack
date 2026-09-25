const fs = require('fs');
const langs = ['en', 'hi', 'mr'];
const voiceNav = {
    en: {
        dashboard: 'dashboard, home, main page',
        equipment: 'equipment, machine, tools, analyzer',
        mark_land: 'mark land, map land, land, property',
        crop_health: 'crop health, disease, diagnosis, sick plant',
        insurance: 'insurance, claim',
        auto_farm: 'auto farm, autonomous, robot',
        crop_recommend: 'crop recommendation, yield, yield prediction, what to grow',
        schemes: 'schemes, subsidies, government',
        inventory: 'inventory, stock, storage, supplies',
        news: 'news, disaster, update',
        profile: 'profile, account, my details'
    },
    hi: {
        dashboard: 'डैशबोर्ड, होम, मुख्य पृष्ठ',
        equipment: 'उपकरण, मशीन, टूल, औजार',
        mark_land: 'जमीन, खेत, नक्शा',
        crop_health: 'फसल स्वास्थ्य, बीमारी, रोग',
        insurance: 'बीमा, क्लेम',
        auto_farm: 'स्मार्ट फार्म, ऑटोमेटिक',
        crop_recommend: 'फसल की सलाह, पैदावार',
        schemes: 'योजनाएं, सब्सिडी, सरकारी',
        inventory: 'इन्वेंटरी, स्टॉक, गोदाम, भंडार',
        news: 'समाचार, खबर, आपदा',
        profile: 'प्रोफाइल, खाता'
    },
    mr: {
        dashboard: 'डॅशबोर्ड, होम',
        equipment: 'उपकरण, मशीन, अवजारे',
        mark_land: 'जमीन, शेत, नकाशा',
        crop_health: 'पीक आरोग्य, रोग',
        insurance: 'विमा, क्लेम',
        auto_farm: 'स्मार्ट फार्म, ऑटोमेटिक',
        crop_recommend: 'पीक सल्ला, उत्पादन',
        schemes: 'योजना, सबसिडी, सरकारी',
        inventory: 'इन्व्हेंटरी, स्टॉक, गोदाम, साठा',
        news: 'बातम्या, बातमी',
        profile: 'प्रोफाइल, खाते'
    }
};

for (const lng of langs) {
    const path = `d:\\DEGREE\\ACADEMIC\\Let_Go_3.0\\frontend\\public\\locales\\${lng}\\translation.json`;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    data.voice_nav = voiceNav[lng];
    fs.writeFileSync(path, JSON.stringify(data, null, 2));
}
