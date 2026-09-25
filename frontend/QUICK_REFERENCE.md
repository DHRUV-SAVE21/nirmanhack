# Quick Reference Guide

## 🚀 New Routes

| Route | Description | User Type |
|-------|-------------|-----------|
| `/modern` | Modern Landing Page | Public |
| `/dashboard-modern` | Modern Farmer Dashboard | Farmer/User |
| `/marketplace-modern` | Modern Marketplace | All |
| `/profile-modern` | Modern Profile Page | Farmer/User |
| `/features-modern` | Features Showcase | Public |

## 📦 Components

### AuroraBackground
```jsx
import AuroraBackground from '../components/ui/AuroraBackground';

<AuroraBackground variant="green">
  {children}
</AuroraBackground>
```

**Variants:** `default`, `green`, `blue`, `multi`

### GlassCard
```jsx
import GlassCard from '../components/ui/GlassCard';

<GlassCard className="p-6" hover={true} gradient={true}>
  {children}
</GlassCard>
```

### StatCard
```jsx
import StatCard from '../components/ui/StatCard';

<StatCard
  icon={Icon}
  label="Label"
  value={value}
  unit="unit"
  trend={{ value: 5, direction: 'up' }}
  color="green"
/>
```

**Colors:** `green`, `blue`, `amber`, `red`, `purple`
**Trend Directions:** `up`, `down`, `neutral`

### ModernNavbar
```jsx
import ModernNavbar from '../components/ui/ModernNavbar';

<ModernNavbar />
```

## 🎨 Color System

### Primary Colors
```css
green:  #16a34a  /* Organic green */
blue:   #2563eb  /* Gov blue */
amber:  #d97706  /* Warning */
purple: #a855f7  /* Accent */
red:    #dc2626  /* Danger */
```

### Glass Effect
```css
bg-white/10          /* Background */
backdrop-blur-md     /* Blur */
border-white/20      /* Border */
```

## 📱 Responsive Classes

```jsx
// Mobile first
className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3"

// Hide on mobile
className="hidden md:block"

// Show only on mobile
className="block md:hidden"
```

## 🎭 Animations

### Fade In
```jsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
```

### Hover Scale
```jsx
<motion.button
  whileHover={{ scale: 1.05 }}
  whileTap={{ scale: 0.95 }}
>
```

### Stagger Children
```jsx
<motion.div
  variants={container}
  initial="hidden"
  animate="show"
>
  {items.map(item => (
    <motion.div variants={item} />
  ))}
</motion.div>
```

## 🔧 Utilities

### Class Name Merger
```jsx
import { cn } from '../utils/cn';

className={cn(
  "base-classes",
  condition && "conditional-classes",
  className
)}
```

## 🎯 Icons

Using Lucide React:
```jsx
import { Icon } from 'lucide-react';

<Icon className="w-5 h-5 text-green-400" />
```

Common icons:
- `Sprout` - Crops
- `Droplets` - Water
- `TrendingUp` - Growth
- `Shield` - Security
- `CloudRain` - Weather
- `BarChart3` - Analytics

## 🌓 Theme Toggle

```jsx
import { useThemeStore } from '../store/themeStore';

const { theme, toggleTheme } = useThemeStore();

<button onClick={toggleTheme}>
  {theme === 'dark' ? <Sun /> : <Moon />}
</button>
```

## 📊 Data Integration

### Sensor Data
```jsx
const [sensorData, setSensorData] = useState(null);

useEffect(() => {
  const fetchData = async () => {
    const response = await fetch(`${apiBase}/api/hardware/latest`);
    const result = await response.json();
    setSensorData(result.data);
  };
  fetchData();
}, []);
```

### User Data
```jsx
const [user, setUser] = useState(null);

useEffect(() => {
  const userData = localStorage.getItem('user');
  if (userData) {
    setUser(JSON.parse(userData));
  }
}, []);
```

## 🎨 Tailwind Custom Classes

### Gov Card
```jsx
className="gov-card p-6"
className="gov-card-elevated"
className="gov-card-interactive"
```

### Buttons
```jsx
className="gov-btn-primary"
className="gov-btn-secondary"
className="gov-btn-outline"
```

### Badges
```jsx
className="gov-badge-success"
className="gov-badge-warning"
className="gov-badge-danger"
```

## 🔍 Common Patterns

### Page Layout
```jsx
<AuroraBackground variant="green">
  <ModernNavbar />
  <div className="min-h-screen pt-32 px-4 sm:px-6 lg:px-8 pb-12 max-w-7xl mx-auto">
    {/* Content */}
  </div>
</AuroraBackground>
```

### Card Grid
```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <GlassCard key={item.id} className="p-6">
      {/* Card content */}
    </GlassCard>
  ))}
</div>
```

### Stat Display
```jsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
  <StatCard icon={Icon} label="Label" value={value} />
</div>
```

## 🐛 Debugging

### Check Theme
```jsx
console.log('Current theme:', document.documentElement.classList.contains('dark') ? 'dark' : 'light');
```

### Check Responsive
```jsx
// Add to component
useEffect(() => {
  const handleResize = () => {
    console.log('Width:', window.innerWidth);
  };
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);
```

## 📝 Best Practices

1. **Always use motion.div for animations**
2. **Use GlassCard for consistent styling**
3. **Add hover effects for interactivity**
4. **Use semantic HTML (nav, main, section)**
5. **Add ARIA labels for accessibility**
6. **Test on mobile devices**
7. **Optimize images (WebP format)**
8. **Use lazy loading for heavy content**

## 🚨 Common Issues

### Aurora not showing
- Check canvas support
- Ensure JavaScript enabled
- Check z-index conflicts

### Glass effect not working
- Update browser
- Check backdrop-filter support
- Verify Tailwind config

### Animations laggy
- Reduce animation complexity
- Check GPU acceleration
- Optimize re-renders

## 📚 Resources

- [Framer Motion Docs](https://www.framer.com/motion/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [React Router](https://reactrouter.com/)

## 🎉 Quick Start

1. Visit `/modern` for landing page
2. Click "View Demo" to see dashboard
3. Toggle theme with sun/moon icon
4. Test on mobile by resizing browser
5. Check all routes listed above

---

**Need help?** Check SETUP_GUIDE.md or MODERN_UI_README.md
