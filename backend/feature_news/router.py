import os
import datetime
import math
import random
import time
import httpx
import asyncio
from fastapi import APIRouter, HTTPException, Query, Body
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

router = APIRouter(prefix="/news", tags=["news"])

# --- CONFIGURATION ---
GNEWS_API_KEY = "36b38d93610935363447703e54bb8688" # Provided key

# Global In-Memory Cache
NEWS_STORAGE = []

# Fallback images used when article has no image
DEFAULT_IMAGES = [
    "https://images.unsplash.com/photo-1596356453261-0d265ae2520a?w=600",
    "https://images.unsplash.com/photo-1542662565-7e4b66b290fc?w=600",
    "https://images.unsplash.com/photo-1454789476662-53eb23ba5907?w=600",
    "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=600", 
    "https://images.unsplash.com/photo-1589824683775-a6e4d588e0dc?w=600"
]

# Keywords for farmer/agriculture detection and categorization
DISASTER_KEYWORDS = {
    'crop': 'Agriculture',
    'farm': 'Agriculture',
    'agriculture': 'Agriculture',
    'harvest': 'Harvest',
    'yield': 'Yield',
    'price': 'Market',
    'market': 'Market',
    'mandi': 'Market',
    'subsidy': 'Scheme',
    'scheme': 'Scheme',
    'loan': 'Finance',
    'insurance': 'Finance',
    'rain': 'Weather',
    'monsoon': 'Weather',
    'drought': 'Weather',
    'irrigation': 'Irrigation',
    'fertilizer': 'Input',
    'seed': 'Input',
    'pest': 'Advisory',
    'disease': 'Advisory',
    'wheat': 'Agriculture',
    'rice': 'Agriculture',
    'paddy': 'Agriculture',
    'onion': 'Market',
    'tomato': 'Market',
    'cotton': 'Agriculture',
    'sugarcane': 'Agriculture',
    'tractor': 'Machinery',
    'policy': 'Government',
    'govt': 'Government',
    'minister': 'Government'
}

# Context keywords to validate categories (Optional for general news but good for specific filtering)
CONTEXT_KEYWORDS = {
    'market': ['price', 'rate', 'quintal', 'msp', 'hike', 'drop', 'sale', 'export', 'import'],
    'scheme': ['government', 'pm', 'kisan', 'yojana', 'apply', 'beneficiary', 'fund', 'release'],
    'advisory': ['warning', 'alert', 'spread', 'control', 'spray', 'protect', 'damage'],
}

# Forbidden keywords to filter out false positives
FORBIDDEN_KEYWORDS = ['election', 'vote', 'poll', 'politics', 'party', 'bjp', 'congress', 'campaign', 
                      'victory', 'seat', 'cricket', 'match', 'sport', 'film', 'movie', 'actor', 'score', 'win', 'game']

# Simple in-memory cache for geocoding
GEOCODE_CACHE = {}

class FetchNewsRequest(BaseModel):
    location: Optional[str] = "India"

def determine_category(title, description):
    """Auto-detects disaster category based on text content with strict validation."""
    import re
    title = (title or "").lower()
    desc = (description or "").lower()
    text = f"{title} {desc}"
    
    # 1. First Pass: Check for Forbidden Terms
    pattern = r'\b(' + '|'.join(map(re.escape, FORBIDDEN_KEYWORDS)) + r')\b'
    if re.search(pattern, text):
        return None

    # 2. Second Pass: Check Disaster Keywords
    for key, category in DISASTER_KEYWORDS.items():
        if key in text:
            # 3. Third Pass: Context Validation for ambiguous terms
            if key in CONTEXT_KEYWORDS:
                required_context = CONTEXT_KEYWORDS[key]
                if not any(ctx in text for ctx in required_context):
                    continue
            return category
            
    return None

    return None, None

# Limit geocoding concurrency to respect API limits and avoid timeouts
geocode_semaphore = asyncio.Semaphore(2)

async def get_coordinates(location_name):
    """Get coordinates for a location using geocoding API with concurrency limit."""
    async with geocode_semaphore:
        if not location_name or len(location_name) > 50:
            return None, None
            
        # Check cache first
        if location_name in GEOCODE_CACHE:
            return GEOCODE_CACHE[location_name]

        try:
            # Respect Nominatim Usage Policy - add a small delay
            await asyncio.sleep(0.5)
            
            url = "https://nominatim.openstreetmap.org/search"
            params = {'q': location_name, 'format': 'json', 'limit': 1}
            headers = {
                'User-Agent': 'SanketSathi_DisasterApp/1.0 (sanketsathi@example.com)',
                'Accept-Language': 'en'
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.get(url, params=params, headers=headers, timeout=5)
            
                if response.status_code == 200:
                    data = response.json()
                    if data:
                        coords = (float(data[0]['lat']), float(data[0]['lon']))
                        GEOCODE_CACHE[location_name] = coords
                        return coords
                    else:
                        GEOCODE_CACHE[location_name] = (None, None)
                        return None, None
        except Exception as e:
            print(f"Geocoding error for {location_name}: {e}")
            GEOCODE_CACHE[location_name] = (None, None)
        
        return None, None

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula (in km)."""
    if None in (lat1, lon1, lat2, lon2):
        return float('inf')
    
    R = 6371  # Earth's radius in kilometers
    
    lat1_rad = math.radians(lat1)
    lat2_rad = math.radians(lat2)
    delta_lat = math.radians(lat2 - lat1)
    delta_lon = math.radians(lon2 - lon1)
    
    a = math.sin(delta_lat/2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(delta_lon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c

def extract_location_from_text(text):
    """Extract potential location names from article text."""
    import re
    words = re.findall(r'\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,2}\b', text or '')
    
    ignore_list = {'The', 'A', 'An', 'In', 'On', 'At', 'Of', 'To', 'For', 'With', 'From', 
                   'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
                   'Where', 'When', 'Who', 'How', 'What', 'Why', 'There', 'Here', 'This', 'That',
                   'Flood', 'Earthquake', 'Cyclone', 'Fire', 'Storm', 'Hurricane', 'Alert', 'Warning', 'Tragedy',
                   'Difficult', 'People', 'Woman', 'Man', 'Child', 'Signature', 'Global', 'Kabaddi', 'Isro',
                   'Congress', 'Cites', 'Old', 'Killed', 'Haven'}
    
    candidates = [w for w in words if w not in ignore_list and w.split()[0] not in ignore_list]
    
    return candidates[0] if candidates else None

def get_geolocation_priority(user_lat, user_lon, article_lat, article_lon, location_text):
    if user_lat is None or user_lon is None or article_lat is None or article_lon is None:
        return 3  # No coordinates available
    
    distance = calculate_distance(user_lat, user_lon, article_lat, article_lon)
    
    if distance <= 50:
        return 0  # Very close
    elif distance <= 200:
        return 1  # Nearby region
    elif distance <= 500:
        return 2  # State/region level
    else:
        return 3  # Far away

@router.post("/fetch-news")
async def trigger_fetch_news(request: FetchNewsRequest):
    """Fetches news from GNews and replaces storage."""
    global NEWS_STORAGE
    location = request.location or "India"
    
    print(f"\n=== FETCHING NEWS FOR: {location} ===")

    # Search query
    # GNews doesn't support overly complex boolean logic or many terms well in free tier
    # Simplified query
    api_terms = ['agriculture', 'farming', 'farmers', 'crops', 'monsoon']
    base_query = " OR ".join(api_terms)
    
    # URL-safe encoding is handled by httpx, but logic needs to be simpler
    final_query = f"({base_query}) {location}"
    broad_query = "agriculture OR farming OR crops OR prices"
    
    url = "https://gnews.io/api/v4/search"
    
    async def fetch_api(query):
        params = {
            'q': query,
            'lang': 'en',
            'max': 40,
            'sortby': 'publishedAt',
            'apikey': GNEWS_API_KEY
        }
        try:
            async with httpx.AsyncClient() as client:
                r = await client.get(url, params=params, timeout=10)
                if r.status_code == 200:
                    return r.json().get('articles', [])
                return []
        except Exception as e:
            print(f"API Error: {e}")
            return []

    # Parallel Execution
    results = await asyncio.gather(
        fetch_api(final_query),
        fetch_api(broad_query)
    )
    
    # Deduplicate articles based on URL and Title
    seen_urls = set()
    seen_titles = set()
    unique_articles = []
    
    # Combine results and filter
    raw_articles = results[0] + results[1]
    
    for article in raw_articles:
        url = article.get('url')
        title = article.get('title')
        
        if url and url not in seen_urls and title and title not in seen_titles:
            seen_urls.add(url)
            seen_titles.add(title)
            unique_articles.append(article)
            
    articles = unique_articles

    if not articles:
        return {"status": "error", "message": "Failed to fetch from GNews"}

    # Process articles
    processed_articles = []
    
    # Get coordinates for the search location
    search_lat, search_lon = await get_coordinates(location)
    
    # Prepare all geolocation tasks and process in parallel to reduce wait time
    async def process_single_article(article):
        title = article.get('title')
        desc = article.get('description')
        url = article.get('url')
        
        if not title or not url:
            return None
            
        img_url = article.get('image')
        source = article.get('source', {}).get('name')
        pub_date_str = article.get('publishedAt') 
        
        try:
            pub_date = pub_date_str if isinstance(pub_date_str, str) else datetime.datetime.now().isoformat()
        except:
            pub_date = datetime.datetime.now().isoformat()

        category = determine_category(title, desc)
        # Fallback for agriculture content that didn't hit specific keywords but came from search
        if not category:
            text_content = (title + " " + (desc or "")).lower()
            if any(t in text_content for t in ['farmer', 'agriculture', 'rural', 'village', 'kisan']):
                category = "Agriculture"
            else:
                category = "General News"

        if not img_url or img_url == "null":
            img_url = random.choice(DEFAULT_IMAGES)
        
        extracted_location = extract_location_from_text(title + " " + (desc or ""))
        
        article_lat, article_lon = None, None
        if extracted_location:
            article_lat, article_lon = await get_coordinates(extracted_location)
        
        distance_km = None
        if None not in (search_lat, search_lon, article_lat, article_lon):
            distance_km = round(calculate_distance(search_lat, search_lon, article_lat, article_lon), 1)
            
        priority_score = get_geolocation_priority(
            search_lat, search_lon, 
            article_lat, article_lon,
            extracted_location or location
        )
        
        return {
            'title': title,
            'description': desc,
            'image_url': img_url,
            'source_name': source,
            'article_url': url,
            'published_at': pub_date,
            'category': category,
            'location_name': extracted_location or location,
            'priority_score': priority_score,
            'distance_km': distance_km,
            'article_lat': article_lat,
            'article_lon': article_lon
        }

    # Execute all processing in parallel
    processed_data = await asyncio.gather(*(process_single_article(a) for a in articles))
    
    # Filter out Nones
    processed_articles = [p for p in processed_data if p is not None]

    # Store in memory
    NEWS_STORAGE = processed_articles
    
    # Assign IDs
    for i, item in enumerate(NEWS_STORAGE):
        item['id'] = i + 1
        item['created_at'] = datetime.datetime.now().isoformat()
    
    new_count = len(NEWS_STORAGE)
    print(f"Stored {new_count} articles")

    return {"status": "success", "new_articles_count": new_count}

@router.get("/")
async def get_news(
    location: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(8, ge=1),
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None)
):
    """Retrieves stored news with geolocation-based prioritization."""
    global NEWS_STORAGE
    
    # Auto-fetch if storage is empty
    if not NEWS_STORAGE:
        print("Storage empty, triggering initial fetch...")
        try:
             # Use a default fetch request
             await trigger_fetch_news(FetchNewsRequest(location=location or "India"))
        except Exception as e:
            print(f"Auto-fetch failed: {e}")

    results = list(NEWS_STORAGE)
    
    start_index = (page - 1) * limit
    end_index = start_index + limit
    
    user_location = location or "India"
    user_lat = latitude
    user_lon = longitude
    
    # Get coordinates for search location if provided and user coords missing
    search_lat, search_lon = None, None
    if user_location and user_location.lower() != "india" and (user_lat is None):
        search_lat, search_lon = await get_coordinates(user_location)
    
    def get_sort_key(item):
        reference_lat = user_lat if user_lat is not None else search_lat
        reference_lon = user_lon if user_lon is not None else search_lon
        
        priority = 3
        
        if reference_lat is not None and reference_lon is not None:
            article_lat = item.get('article_lat')
            article_lon = item.get('article_lon')
            
            if article_lat is not None and article_lon is not None:
                distance = calculate_distance(reference_lat, reference_lon, article_lat, article_lon)
                # Store dynamic distance for the response
                item['_dynamic_distance'] = round(distance, 1)

                if distance <= 50: priority = 0
                elif distance <= 200: priority = 1
                elif distance <= 500: priority = 2
                else: priority = 3
            else:
                 # Text match fallback
                text_content = (item.get('title', '') + ' ' + item.get('description', '')).lower()
                if user_location and user_location.lower() in text_content:
                    priority = 1
        else:
             text_content = (item.get('title', '') + ' ' + item.get('description', '')).lower()
             if user_location and user_location.lower() in text_content:
                 priority = 1
             elif "india" in text_content or "indian" in text_content:
                 priority = 2
        
        try:
            date_val = datetime.datetime.fromisoformat(item.get('published_at', '').replace('Z', '+00:00')).timestamp()
        except:
            date_val = 0
            
        return (priority, -date_val)
    
    results.sort(key=get_sort_key)
    
    # Update returned items with dynamic distance if calculated
    # Note: dicts in NEWS_STORAGE are mutable, avoiding modifying global storage with user-specific distances is better
    # But for simplicity, we'll clone the dicts we return
    
    total_count = len(results)
    paginated_items = results[start_index:end_index]
    
    # Create response items (cleaning internal keys if needed)
    response_items = []
    for item in paginated_items:
        resp_item = item.copy()
        if '_dynamic_distance' in item:
            resp_item['distance_km'] = item['_dynamic_distance']
        # Recalculate if we have user coords
        if user_lat is not None and user_lon is not None and item.get('article_lat') and item.get('article_lon'):
             dist = calculate_distance(user_lat, user_lon, item['article_lat'], item['article_lon'])
             resp_item['distance_km'] = round(dist, 1)
        
        response_items.append(resp_item)

    return {
        'articles': response_items,
        'total': total_count,
        'page': page,
        'limit': limit,
        'has_more': end_index < total_count,
        'user_location': user_location if user_location else 'Global'
    }
