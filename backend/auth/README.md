# Face Authentication System with RBAC

A secure face recognition authentication system with Role-Based Access Control (RBAC) for your farming application.

## 🌟 Features

- **20-Scan Face Registration**: Captures exactly 20 face samples for high accuracy
- **Real-time Face Detection**: Uses OpenCV Haar Cascades for face detection
- **Machine Learning Recognition**: KNN classifier with optimized parameters
- **Role-Based Access Control**: Admin, Farmer, and Viewer roles with different permissions
- **High Security**: Face detection validation, confidence thresholds, and ambiguity checks
- **Modern UI**: React frontend with real-time camera preview and progress tracking

## 🔧 System Requirements

- Python 3.8+
- OpenCV 4.8+
- Camera/Webcam access
- Node.js 16+ (for frontend)

## 📦 Installation

### Backend Setup

1. **Install Python dependencies:**
```bash
cd backend/auth
pip install -r requirements.txt
```

2. **Run setup script:**
```bash
python setup_face_auth.py
```

3. **Test the system:**
```bash
python test_face_detection.py
```

### Frontend Setup

The frontend is already integrated into your React application. Make sure you have:

```bash
npm install react-webcam framer-motion lucide-react
```

## 🚀 Usage

### 1. User Registration (20-Scan Process)

The system requires exactly 20 face scans for registration:

1. User enters their full name and selects role
2. Camera captures 20 face samples automatically
3. Each sample is validated for face detection
4. System trains the ML model with new data
5. User can now login with face recognition

### 2. Face Login

1. User positions face in camera view
2. System captures single image
3. Face detection validates presence of face
4. ML model predicts user identity
5. Confidence and ambiguity checks ensure security
6. User is authenticated with role-based permissions

### 3. Role-Based Access Control

**Admin Role:**
- Full system access
- User management
- All CRUD operations

**Farmer Role:**
- Read and write access
- Equipment management
- Crop monitoring

**Viewer Role:**
- Read-only access
- Dashboard viewing

## 🔒 Security Features

### Face Detection Validation
- Haar Cascade classifier ensures real faces
- Rejects images without detectable faces
- Prevents spoofing with photos

### Confidence Thresholds
- Minimum 65% confidence required
- Adaptive scoring based on user count
- Ambiguity detection prevents false positives

### Data Protection
- Face data stored as normalized vectors
- No raw images in production database
- Encrypted user information

## 📊 API Endpoints

### Authentication
```
POST /api/auth/signup
POST /api/auth/login/face
GET  /api/auth/users
POST /api/auth/verify-permissions
DELETE /api/auth/users/{user_id}
```

### Example Registration Request
```json
{
  "full_name": "John Farmer",
  "role": "farmer",
  "face_images": ["data:image/jpeg;base64,/9j/4AAQ...", "..."] // 20 images
}
```

### Example Login Response
```json
{
  "success": true,
  "message": "Welcome back, John Farmer! 🎉",
  "confidence": 0.892,
  "user": {
    "id": "abc123",
    "full_name": "John Farmer",
    "role": "farmer",
    "permissions": ["read", "write"]
  },
  "authentication": {
    "method": "face_recognition",
    "timestamp": "2024-01-25T10:30:00Z",
    "confidence_score": 0.892
  }
}
```

## 🛠️ Configuration

### Environment Variables
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
```

### Model Parameters
- **KNN Neighbors**: Adaptive (min 7, max 2×users)
- **Face Size**: 100×100 pixels (30,000 features)
- **Confidence Threshold**: 65% minimum
- **Ambiguity Gap**: 15% minimum between top predictions

## 📁 File Structure

```
backend/auth/
├── router.py              # FastAPI routes
├── setup_face_auth.py     # Setup script
├── test_face_detection.py # Testing utility
├── requirements.txt       # Dependencies
├── README.md             # This file
└── data/
    ├── faces_data.pkl    # Face feature vectors
    ├── names.pkl         # User labels
    └── users/            # User face images
        └── john_farmer/  # Individual user folders
```

## 🧪 Testing

### Live Testing
```bash
python test_face_detection.py
```

### API Testing
```bash
# Test registration
curl -X POST https://let-go-3-0.onrender.com/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"full_name": "Test User", "role": "farmer", "face_images": [...]}'

# Test login
curl -X POST https://let-go-3-0.onrender.com/api/auth/login/face \
  -H "Content-Type: application/json" \
  -d '{"face_image": "data:image/jpeg;base64,..."}'
```

## 🔧 Troubleshooting

### Common Issues

**Camera not working:**
- Check camera permissions
- Ensure no other apps are using camera
- Try different camera index (0, 1, 2...)

**Low recognition accuracy:**
- Ensure good lighting during registration
- Capture faces from different angles
- Re-register with more diverse samples

**Face not detected:**
- Improve lighting conditions
- Position face clearly in frame
- Remove glasses/hats if causing issues

### Debug Mode
Enable debug logging in `router.py`:
```python
import logging
logging.basicConfig(level=logging.DEBUG)
```

## 🚀 Production Deployment

### Security Checklist
- [ ] Use HTTPS for all endpoints
- [ ] Implement rate limiting
- [ ] Add request validation
- [ ] Enable CORS properly
- [ ] Use environment variables for secrets
- [ ] Regular model retraining
- [ ] Monitor authentication logs

### Performance Optimization
- [ ] Use GPU acceleration for OpenCV
- [ ] Implement face detection caching
- [ ] Optimize image compression
- [ ] Add database indexing
- [ ] Use CDN for static assets

## 📈 Monitoring

Track these metrics in production:
- Authentication success rate
- Face detection accuracy
- Response times
- Failed login attempts
- User registration trends

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## 📄 License

This face authentication system is part of your farming application project.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Run the test script
3. Check server logs
4. Review camera permissions

---

**Note**: This system is designed for controlled environments. For high-security applications, consider additional biometric factors and professional security audits.