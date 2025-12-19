# Typography System Guide

## Tổng quan
Hệ thống typography đã được chuẩn hóa để đảm bảo tính nhất quán trong toàn bộ ứng dụng.

## Cách sử dụng

### 1. Trong CSS Files
Sử dụng CSS variables:
```css
.my-class {
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
}
```

### 2. Trong Inline Styles (React Components)
Import và sử dụng constants từ `fontStyles.js`:
```javascript
import { fontSize, fontWeight, textStyles } from '../../utils/fontStyles';

// Cách 1: Sử dụng trực tiếp
<div style={{ fontSize: fontSize.base, fontWeight: fontWeight.medium }}>
  Text content
</div>

// Cách 2: Sử dụng preset
<div style={textStyles.body}>
  Body text
</div>

// Cách 3: Spread và override
<div style={{ ...textStyles.h3, color: '#red' }}>
  Heading with custom color
</div>
```

### 3. Font Size Scale
```
xs:   0.7rem  (11.2px) - Badges, small labels
sm:   0.75rem (12px)   - Captions, metadata
base: 0.875rem (14px)  - Body text (default)
md:   0.9rem  (14.4px) - Emphasized text
lg:   1rem    (16px)   - Section titles
xl:   1.25rem (20px)   - Card titles
2xl:  1.35rem (21.6px) - Page titles
3xl:  1.875rem (30px)  - Large headings
4xl:  2rem    (32px)   - Hero headings
```

### 4. Font Weights
```
normal:   400
medium:   500
semibold: 600
bold:     700
```

### 5. Text Presets
```javascript
textStyles.h1        // Large heading
textStyles.h2        // Page title
textStyles.h3        // Section title
textStyles.h4        // Subsection title
textStyles.body      // Body text
textStyles.bodySmall // Small body text
textStyles.label     // Form labels
textStyles.caption   // Captions, metadata
textStyles.badge     // Badges, status
textStyles.button    // Button text
```

## Migration Guide

### Thay thế hardcoded values:

**Trước:**
```javascript
<div style={{ fontSize: "0.875rem", fontWeight: 600 }}>
```

**Sau:**
```javascript
import { fontSize, fontWeight } from '../../utils/fontStyles';
<div style={{ fontSize: fontSize.base, fontWeight: fontWeight.semibold }}>
```

### Common replacements:
- `"0.7rem"` → `fontSize.xs`
- `"0.75rem"` → `fontSize.sm`
- `"0.8rem"` → `fontSize.base`
- `"0.875rem"` → `fontSize.base`
- `"0.9rem"` → `fontSize.md`
- `"1rem"` → `fontSize.lg`
- `"1.25rem"` → `fontSize.xl`
- `"1.35rem"` → `fontSize['2xl']`
- `"1.875rem"` → `fontSize['3xl']`
- `"2rem"` → `fontSize['4xl']`

## Best Practices

1. **Luôn sử dụng typography system** thay vì hardcoded values
2. **Sử dụng presets** khi có thể để đảm bảo consistency
3. **Import từ fontStyles.js** cho inline styles
4. **Sử dụng CSS variables** trong CSS files
5. **Không mix** hardcoded values với typography system

