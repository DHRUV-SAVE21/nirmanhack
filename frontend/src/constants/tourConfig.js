/**
 * Tour Step Configuration
 * 
 * Steps target CSS selectors that exist in the live DOM.
 * We use data-tour attributes on key elements for reliability.
 * 
 * Each step has:
 *   - target: CSS selector
 *   - title / content: shown in tooltip (also read aloud)
 *   - page: the route where this step is visible
 *   - disableBeacon: true (we want immediate spotlight)
 * 
 * The tour engine will auto-navigate to the correct page if needed.
 */

// ─── DASHBOARD STEPS ────────────────────────────────────────────────
const getDashboardSteps = (t) => [
    {
        target: '[data-tour="dashboard-greeting"]',
        title: t('tour_dashboard_title', 'Your Dashboard'),
        content: t('tour_dashboard_content', 'This is your personalized command center. It greets you and shows everything about your farm at a glance.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="primary-decision"]',
        title: t('tour_today_action', 'Today\'s Action'),
        content: t('tour_today_action_content', 'This card shows you the most important action to take today, powered by AI analysis of your soil, weather, and crop data.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="zone-map"]',
        title: t('tour_zones_title', 'Irrigation Zones'),
        content: t('tour_zones_content', 'View your farm zones on a live map. Each zone shows irrigation status and water needs in real-time.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="ai-insights"]',
        title: t('tour_ai_title', 'AI Insights'),
        content: t('tour_ai_content', 'Our AI engine analyzes your data and provides actionable insights here. It learns and improves every day!'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="soil-health"]',
        title: t('tour_soil_title', 'Soil Health'),
        content: t('tour_soil_content', 'Real-time soil health metrics including NPK levels, pH, and moisture — directly from your IoT sensors.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="weather-forecast"]',
        title: t('tour_weather_title', 'Weather Forecast'),
        content: t('tour_weather_content', 'Hyperlocal weather predictions for your exact farm location. Plan your activities accordingly.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="smart-irrigation"]',
        title: t('tour_controls_title', 'Smart Controls'),
        content: t('tour_controls_content', 'Control your smart irrigation system right from here. Toggle pumps and set schedules instantly.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="crop-health"]',
        title: t('tour_health_title', 'Crop Health'),
        content: t('tour_health_content', 'Upload crop photos or use your camera for instant AI-based disease detection and treatment recommendations.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="market-prices"]',
        title: t('tour_market_title', 'Market Prices'),
        content: t('tour_market_content', 'Live Mandi prices so you can sell at the best rate. Compare prices across nearby markets.'),
        page: '/dashboard',
        disableBeacon: true,
    },
];

// ─── NAVBAR STEPS ───────────────────────────────────────────────────
const getNavbarSteps = (t) => [
    {
        target: '[data-tour="navbar-brand"]',
        title: t('tour_nav_brand_title', 'Annadata Saathi'),
        content: t('tour_nav_brand_content', 'Click the logo anytime to return to the home page.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="navbar-services"]',
        title: t('tour_nav_services_title', 'Services Menu'),
        content: t('tour_nav_services_content', 'Access all advanced services like Disaster News, Autonomous Farm, Equipment Analyzer, Inventory, and Marketplace from this dropdown.'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="navbar-language"]',
        title: t('tour_nav_lang_title', 'Change Language'),
        content: t('tour_nav_lang_content', 'Switch between English, Hindi, and Marathi. The entire app—including this guide—will adapt to your language!'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="navbar-theme"]',
        title: t('tour_nav_theme_title', 'Dark / Light Mode'),
        content: t('tour_nav_theme_content', 'Toggle between dark and light themes based on your preference or time of day.'),
        page: '/dashboard',
        disableBeacon: true,
    },
];

// ─── CROP RECOMMENDATION STEPS ──────────────────────────────────────
const getCropRecommendationSteps = (t) => [
    {
        target: '[data-tour="crop-recommendation-main"]',
        title: t('tour_crop_rec_title', 'Smart Crop Recommender'),
        content: t('tour_crop_rec_content', 'Enter your soil parameters here and our AI will recommend the best crops to maximize your profit based on your land conditions.'),
        page: '/crop-recommendation',
        disableBeacon: true,
    },
];

// ─── SCHEMES STEPS ──────────────────────────────────────────────────
const getSchemesSteps = (t) => [
    {
        target: '[data-tour="schemes-main"]',
        title: t('tour_schemes_title', 'Government Schemes Assistant'),
        content: t('tour_schemes_content', 'Ask our AI about subsidies, loans, and farming policies. It knows every scheme available in your region.'),
        page: '/schemes-assistant',
        disableBeacon: true,
    },
];

// ─── MARK MY LAND STEPS ─────────────────────────────────────────────
const getMarkMyLandSteps = (t) => [
    {
        target: '[data-tour="markmyland-main"]',
        title: t('tour_land_title', 'Land Mapping Tool'),
        content: t('tour_land_content', 'Draw or walk your farm boundaries to create accurate digital maps for documentation and planning.'),
        page: '/mark-my-land',
        disableBeacon: true,
    },
];

// ─── INVENTORY STEPS ────────────────────────────────────────────────
const getInventorySteps = (t) => [
    {
        target: '[data-tour="inventory-main"]',
        title: t('tour_inv_title', 'Farm Inventory'),
        content: t('tour_inv_content', 'Track your seeds, fertilizers, and harvested produce with blockchain-verified records.'),
        page: '/inventory',
        disableBeacon: true,
    },
];

// ─── MARKETPLACE STEPS ──────────────────────────────────────────────
const getMarketplaceSteps = (t) => [
    {
        target: '[data-tour="marketplace-main"]',
        title: t('tour_marketplace_title', 'Marketplace'),
        content: t('tour_marketplace_content', 'Buy and sell agricultural products directly. Compare prices and connect with verified buyers and sellers.'),
        page: '/marketplace',
        disableBeacon: true,
    },
];

// ─── EQUIPMENT STEPS ────────────────────────────────────────────────
const getEquipmentSteps = (t) => [
    {
        target: '[data-tour="equipment-main"]',
        title: t('tour_equip_title', 'Equipment Analyzer'),
        content: t('tour_equip_content', 'Scan your tools with computer vision to detect wear and tear. Find nearby repair centers instantly.'),
        page: '/equipment',
        disableBeacon: true,
    },
];

// ─── AUTONOMOUS FARM STEPS ──────────────────────────────────────────
const getAutonomousFarmSteps = (t) => [
    {
        target: '[data-tour="autonomous-farm-main"]',
        title: t('tour_autofarm_title', 'Autonomous Farm'),
        content: t('tour_autofarm_content', 'Monitor and control your robotic irrigation, fertilization, and harvesting systems from this central interface.'),
        page: '/autonomous-farm',
        disableBeacon: true,
    },
];

// ─── PROFILE STEPS ──────────────────────────────────────────────────
const getProfileSteps = (t) => [
    {
        target: '[data-tour="profile-main"]',
        title: t('tour_profile_title', 'Your Profile'),
        content: t('tour_profile_content', 'View and update your personal information, farm details, and notification preferences.'),
        page: '/profile',
        disableBeacon: true,
    },
];

// ─── FLOATING CONTROLS STEPS ────────────────────────────────────────
const getFloatingSteps = (t) => [
    {
        target: '[data-tour="voice-assistant"]',
        title: t('tour_voice_title', 'Voice Assistant'),
        content: t('tour_voice_content', 'Tap this button to talk to our AI. Ask questions in your language — it understands Hindi, Marathi, and English!'),
        page: '/dashboard',
        disableBeacon: true,
    },
    {
        target: '[data-tour="calling-assistant"]',
        title: t('tour_call_title', 'Call Assistant'),
        content: t('tour_call_content', 'Need to talk? Tap here for a live AI voice call. It\'s like having an agricultural expert on speed dial!'),
        page: '/dashboard',
        disableBeacon: true,
    },
];

// ─── EXPORTED FULL STEPS ────────────────────────────────────────────

/**
 * Returns the full ordered tour steps translated.
 */
export const getTourSteps = (t) => {
    return [
        // Start on Dashboard
        ...getDashboardSteps(t),
        // Navbar guides
        ...getNavbarSteps(t),
        // Floating buttons
        ...getFloatingSteps(t),
        // Feature pages (one intro step per page)
        ...getCropRecommendationSteps(t),
        ...getSchemesSteps(t),
        ...getMarkMyLandSteps(t),
        ...getInventorySteps(t),
        ...getMarketplaceSteps(t),
        ...getEquipmentSteps(t),
        ...getAutonomousFarmSteps(t),
        ...getProfileSteps(t),
    ];
};

/**
 * Returns only the steps for a specific page path.
 */
export const getStepsForPage = (pagePath, t) => {
    const allSteps = getTourSteps(t || ((key, fallback) => fallback));
    return allSteps.filter(step => step.page === pagePath);
};
