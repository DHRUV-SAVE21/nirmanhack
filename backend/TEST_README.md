# Testing Guide for Let Go 3.0

## Quick Test (Automated)

**Windows:**
```bash
run_tests.bat
```

This will:
1. Start the backend server
2. Wait 10 seconds
3. Run all tests automatically

## Manual Testing

### Step 1: Start Backend
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### Step 2: Run Tests (in another terminal)
```bash
# Simple test
python test_extensions.py

# Comprehensive test (recommended)
python test_all_features.py
```

## What Gets Tested

### Core Endpoints
- ✓ Root endpoint
- ✓ Health check
- ✓ Products API

### Feature 1: Land Registry (Blockchain)
- ✓ List lands
- ✓ Get land details

### Feature 2: Crop Health & Disease Detection
- ✓ Get agronomists
- ✓ Scheme applications
- ✓ Application statistics
- ✓ Disease prediction (requires image upload)

### Feature 3: Autonomous Farm Control
- ✓ Sensor history
- ✓ Recommendations
- ✓ Real-time sensor data

### Feature 4: Crop Recommendations (DRL)
- ✓ Health check
- ✓ Available crops
- ✓ Get recommendations

### Feature 5: Equipment & Subsidies
- ✓ Get subsidies
- ✓ Available states
- ✓ Calculate subsidy

### Feature 6: Inventory & Blockchain
- ✓ List batches
- ✓ Get timeline
- ✓ Trust score

### Hardware & Sensors
- ✓ Latest sensor data
- ✓ Historical data

### News & Alerts
- ✓ Get news
- ✓ Fetch fresh news

## Expected Results

A healthy system should have:
- **80%+ pass rate** - Excellent
- **50-80% pass rate** - Partial (some features need attention)
- **<50% pass rate** - Critical (many features failing)

## Common Issues

### Backend not starting
```bash
# Check if port 8000 is in use
netstat -ano | findstr :8000

# Kill process if needed
taskkill /PID <PID> /F
```

### Tests failing with connection error
- Make sure backend is running on port 8000
- Check firewall settings
- Verify `BASE_URL` in test file matches your setup

### 404 errors
- Some endpoints return 404 when no data exists (this is expected)
- Check if database is properly configured
- Verify Supabase connection in `.env`

### 422 errors
- Request data format is incorrect
- Check payload structure in test file
- Verify API documentation at http://localhost:8000/docs

## Troubleshooting

1. **Check backend logs** - Look for errors in the terminal running uvicorn
2. **Test individual endpoints** - Use http://localhost:8000/docs (Swagger UI)
3. **Verify environment variables** - Check `.env` file has all required keys
4. **Check database connection** - Verify Supabase credentials

## Manual API Testing

Use the interactive API docs:
```
http://localhost:8000/docs
```

This provides:
- Complete API documentation
- Interactive testing interface
- Request/response examples
- Schema validation

## Next Steps

After tests pass:
1. Deploy to Render (backend)
2. Deploy to Vercel (frontend)
3. Update frontend `.env` with production URLs
4. Run tests against production endpoints
