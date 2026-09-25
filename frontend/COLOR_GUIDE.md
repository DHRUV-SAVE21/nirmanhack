# 🎨 Color Guide & Design System

## Primary Color Palette

### Green (Organic/Agriculture)
```css
organic-green-400: #4ade80  /* Light green */
organic-green-500: #22c55e  /* Medium green */
organic-green-600: #16a34a  /* Primary green */
organic-green-700: #15803d  /* Dark green */
organic-green-800: #166534  /* Darker green */
```

**Usage:**
- Primary actions
- Success states
- Agriculture-related features
- Crop health indicators

### Blue (Technology/Trust)
```css
blue-400: #60a5fa  /* Light blue */
blue-500: #3b82f6  /* Medium blue */
blue-600: #2563eb  /* Primary blue */
blue-700: #1d4ed8  /* Dark blue */
```

**Usage:**
- Technology features
- Water-related elements
- Information displays
- Secondary actions

### Amber (Warning/Energy)
```css
amber-400: #fbbf24  /* Light amber */
amber-500: #f59e0b  /* Medium amber */
amber-600: #d97706  /* Primary amber */
amber-700: #b45309  /* Dark amber */
```

**Usage:**
- Warning states
- Energy indicators
- Temperature displays
- Attention-grabbing elements

### Purple (Premium/AI)
```css
purple-400: #c084fc  /* Light purple */
purple-500: #a855f7  /* Medium purple */
purple-600: #9333ea  /* Primary purple */
purple-700: #7e22ce  /* Dark purple */
```

**Usage:**
- AI features
- Premium features
- Analytics
- Insights

### Red (Danger/Alert)
```css
red-400: #f87171  /* Light red */
red-500: #ef4444  /* Medium red */
red-600: #dc2626  /* Primary red */
red-700: #b91c1c  /* Dark red */
```

**Usage:**
- Error states
- Critical alerts
- Danger warnings
- Urgent actions

## Neutral Colors

### Light Mode
```css
slate-50:  #f8fafc  /* Background */
slate-100: #f1f5f9  /* Card background */
slate-200: #e2e8f0  /* Border */
slate-300: #cbd5e1  /* Divider */
slate-400: #94a3b8  /* Placeholder */
slate-500: #64748b  /* Secondary text */
slate-600: #475569  /* Primary text */
slate-900: #0f172a  /* Heading */
```

### Dark Mode
```css
slate-950: #020617  /* Background */
slate-900: #0f172a  /* Card background */
slate-800: #1e293b  /* Border */
slate-700: #334155  /* Divider */
slate-600: #475569  /* Placeholder */
slate-400: #94a3b8  /* Secondary text */
slate-300: #cbd5e1  /* Primary text */
white:     #ffffff  /* Heading */
```

## Glass Effect Colors

### Background
```css
bg-white/5   /* Very subtle */
bg-white/10  /* Subtle */
bg-white/20  /* Visible */
```

### Border
```css
border-white/10  /* Very subtle */
border-white/20  /* Subtle */
border-white/30  /* Visible */
```

### Backdrop Blur
```css
backdrop-blur-sm  /* 4px */
backdrop-blur-md  /* 8px */
backdrop-blur-lg  /* 12px */
backdrop-blur-xl  /* 16px */
```

## Aurora Background Variants

### Default (Multi-color)
```javascript
colors: [
  { r: 34, g: 197, b: 94, a: 0.3 },   // Green
  { r: 59, g: 130, b: 246, a: 0.25 }, // Blue
  { r: 168, g: 85, b: 247, a: 0.2 }   // Purple
]
```

### Green (Agriculture)
```javascript
colors: [
  { r: 22, g: 163, b: 74, a: 0.35 },  // Dark green
  { r: 34, g: 197, b: 94, a: 0.3 },   // Green
  { r: 132, g: 204, b: 22, a: 0.25 }  // Lime
]
```

### Blue (Technology)
```javascript
colors: [
  { r: 37, g: 99, b: 235, a: 0.3 },   // Blue
  { r: 59, g: 130, b: 246, a: 0.25 }, // Light blue
  { r: 14, g: 165, b: 233, a: 0.2 }   // Sky
]
```

### Multi (Landing)
```javascript
colors: [
  { r: 34, g: 197, b: 94, a: 0.3 },   // Green
  { r: 251, g: 191, b: 36, a: 0.25 }, // Amber
  { r: 59, g: 130, b: 246, a: 0.2 }   // Blue
]
```

## Component Color Usage

### StatCard
```jsx
<StatCard color="green" />  // Agriculture
<StatCard color="blue" />   // Water/Tech
<StatCard color="amber" />  // Energy/Warning
<StatCard color="purple" /> // AI/Premium
<StatCard color="red" />    // Danger/Alert
```

### Badges
```jsx
className="gov-badge-success"  // Green
className="gov-badge-warning"  // Amber
className="gov-badge-danger"   // Red
className="gov-badge-info"     // Blue
```

### Buttons
```jsx
className="gov-btn-primary"    // Green
className="gov-btn-secondary"  // Slate
className="gov-btn-outline"    // Green outline
```

## Gradient Combinations

### Success Gradient
```css
bg-gradient-to-r from-green-500 to-green-600
```

### Info Gradient
```css
bg-gradient-to-r from-blue-500 to-blue-600
```

### Warning Gradient
```css
bg-gradient-to-r from-amber-500 to-amber-600
```

### Premium Gradient
```css
bg-gradient-to-r from-purple-500 to-purple-600
```

### Multi-color Gradient
```css
bg-gradient-to-r from-green-400 via-blue-400 to-purple-400
```

## Text Colors

### Light Mode
```css
text-slate-900  /* Headings */
text-slate-700  /* Body text */
text-slate-500  /* Secondary text */
text-slate-400  /* Placeholder */
```

### Dark Mode
```css
text-white      /* Headings */
text-slate-300  /* Body text */
text-slate-400  /* Secondary text */
text-slate-500  /* Placeholder */
```

### Colored Text
```css
text-green-400   /* Success */
text-blue-400    /* Info */
text-amber-400   /* Warning */
text-red-400     /* Danger */
text-purple-400  /* Premium */
```

## Shadow Colors

### Light Shadows
```css
shadow-sm        /* Subtle */
shadow-md        /* Medium */
shadow-lg        /* Large */
shadow-xl        /* Extra large */
shadow-2xl       /* Maximum */
```

### Colored Shadows
```css
shadow-green-500/30   /* Green glow */
shadow-blue-500/30    /* Blue glow */
shadow-purple-500/30  /* Purple glow */
```

## Border Colors

### Light Mode
```css
border-slate-200  /* Subtle */
border-slate-300  /* Visible */
border-slate-400  /* Strong */
```

### Dark Mode
```css
border-slate-800  /* Subtle */
border-slate-700  /* Visible */
border-slate-600  /* Strong */
```

### Colored Borders
```css
border-green-500/20   /* Green subtle */
border-green-500/30   /* Green visible */
border-blue-500/20    /* Blue subtle */
border-amber-500/20   /* Amber subtle */
```

## Usage Examples

### Success Card
```jsx
<div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
  <p className="text-green-400">Success message</p>
</div>
```

### Warning Card
```jsx
<div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
  <p className="text-amber-400">Warning message</p>
</div>
```

### Info Card
```jsx
<div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
  <p className="text-blue-400">Info message</p>
</div>
```

### Danger Card
```jsx
<div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
  <p className="text-red-400">Error message</p>
</div>
```

## Accessibility

### Contrast Ratios
- Headings: 7:1 (AAA)
- Body text: 4.5:1 (AA)
- Large text: 3:1 (AA)

### Color Blind Safe
- Use icons with colors
- Add text labels
- Use patterns/textures
- Test with simulators

## Best Practices

1. **Consistency**: Use the same color for the same meaning
2. **Hierarchy**: Darker colors for important elements
3. **Contrast**: Ensure readable text
4. **Feedback**: Use colors for user feedback
5. **Branding**: Green for agriculture theme
6. **Accessibility**: Test with color blind simulators

## Quick Reference

| Color | Usage | Light | Dark |
|-------|-------|-------|------|
| Green | Success, Agriculture | #16a34a | #4ade80 |
| Blue | Info, Technology | #2563eb | #60a5fa |
| Amber | Warning, Energy | #d97706 | #fbbf24 |
| Red | Danger, Alert | #dc2626 | #f87171 |
| Purple | Premium, AI | #9333ea | #c084fc |
| Slate | Neutral, Text | #475569 | #cbd5e1 |

---

**Pro Tip:** Use the color picker in your browser DevTools to test different combinations!
