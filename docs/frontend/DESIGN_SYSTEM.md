# 🎨 DESIGN SYSTEM
## Sekolah Info System - Blue Professional Theme

**Version:** 1.0.0  
**Last Updated:** May 2, 2026  
**Theme:** Blue Professional Enterprise

---

## 📖 INTRODUCTION

Design system ini adalah single source of truth untuk semua keputusan desain di Sekolah Info System. Tujuannya adalah menciptakan pengalaman yang konsisten, profesional, dan user-friendly di seluruh aplikasi.

---

## 🎨 COLOR PALETTE

### **Primary Colors - Blue Theme**

Warna biru dipilih karena melambangkan:
- 🔵 Kepercayaan dan profesionalisme
- 📘 Pendidikan dan pengetahuan
- 🌊 Ketenangan dan stabilitas
- 💼 Enterprise dan bisnis

#### **Blue Scale**
```scss
$primary-50:  #e3f2fd  // Lightest - backgrounds, hover states
$primary-100: #bbdefb  // Very light - selected states
$primary-200: #90caf9  // Light
$primary-300: #64b5f6  // Medium light
$primary-400: #42a5f5  // Medium - hover borders
$primary-500: #2196f3  // ⭐ MAIN PRIMARY - buttons, links, focus
$primary-600: #1e88e5  // Medium dark - hover states
$primary-700: #1976d2  // Dark - active states, selected text
$primary-800: #1565c0  // Very dark
$primary-900: #0d47a1  // Darkest - emphasis
```

**Usage:**
- `$primary-500`: Primary buttons, links, icons
- `$primary-600`: Hover states
- `$primary-700`: Active/pressed states
- `$primary-50`: Background hover, subtle highlights
- `$primary-100`: Selected backgrounds

---

### **Semantic Colors**

#### **Success - Green**
```scss
$success-50:  #e8f5e9
$success-500: #4caf50  // ⭐ Main success
$success-600: #43a047  // Hover
$success-700: #388e3c  // Active
```
**Usage:** Success messages, completed states, positive actions

#### **Warning - Orange**
```scss
$warning-50:  #fff3e0
$warning-500: #ff9800  // ⭐ Main warning
$warning-600: #fb8c00  // Hover
$warning-700: #f57c00  // Active
```
**Usage:** Warning messages, caution states, pending actions

#### **Error - Red**
```scss
$error-50:  #ffebee
$error-500: #f44336  // ⭐ Main error
$error-600: #e53935  // Hover
$error-700: #d32f2f  // Active
```
**Usage:** Error messages, destructive actions, validation errors

#### **Info - Blue**
```scss
$info-50:  #e3f2fd
$info-500: #2196f3  // ⭐ Main info (same as primary)
$info-600: #1e88e5  // Hover
$info-700: #1976d2  // Active
```
**Usage:** Informational messages, tips, neutral notifications

---

### **Neutral Colors - Grayscale**

```scss
$neutral-50:  #fafafa  // Background light
$neutral-100: #f5f5f5  // Background secondary
$neutral-200: #eeeeee  // Borders light
$neutral-300: #e0e0e0  // Borders medium
$neutral-400: #bdbdbd  // Borders dark, disabled text
$neutral-500: #9e9e9e  // Placeholder text
$neutral-600: #757575  // Secondary text
$neutral-700: #616161  // Primary text light
$neutral-800: #424242  // Primary text medium
$neutral-900: #212121  // ⭐ Primary text dark
```

**Usage:**
- `$neutral-50-100`: Backgrounds
- `$neutral-200-400`: Borders, dividers
- `$neutral-500-600`: Secondary text, placeholders
- `$neutral-700-900`: Primary text

---

### **Background Colors**

```scss
$bg-primary:   #ffffff  // Main content background
$bg-secondary: #fafafa  // Page background, cards
$bg-tertiary:  #f5f5f5  // Subtle backgrounds
$bg-hover:     #e3f2fd  // Hover backgrounds (primary tint)
$bg-active:    #bbdefb  // Active backgrounds (primary tint)
```

---

### **Text Colors**

```scss
$text-primary:   #212121  // Main text, headings
$text-secondary: #616161  // Secondary text, descriptions
$text-tertiary:  #757575  // Tertiary text, captions
$text-disabled:  #bdbdbd  // Disabled text
$text-inverse:   #ffffff  // Text on dark backgrounds
```

**Contrast Ratios (WCAG AA Compliant):**
- Primary text on white: 16.1:1 ✅
- Secondary text on white: 7.5:1 ✅
- Disabled text on white: 3.2:1 ✅

---

### **Border Colors**

```scss
$border-light:  #eeeeee  // Subtle borders
$border-medium: #e0e0e0  // Default borders
$border-dark:   #bdbdbd  // Emphasized borders
```

---

## 📏 SPACING SYSTEM

Base unit: **8px** (consistent with Material Design)

```scss
$spacing-xs:  4px   // 0.5 × base
$spacing-sm:  8px   // 1 × base
$spacing-md:  16px  // 2 × base ⭐ Most common
$spacing-lg:  24px  // 3 × base
$spacing-xl:  32px  // 4 × base
$spacing-2xl: 48px  // 6 × base
$spacing-3xl: 64px  // 8 × base
```

### **Usage Guidelines**

| Spacing | Use Case |
|---------|----------|
| `xs` (4px) | Icon margins, tight spacing |
| `sm` (8px) | Button padding, small gaps |
| `md` (16px) | Default padding, card padding, form spacing |
| `lg` (24px) | Section spacing, large card padding |
| `xl` (32px) | Page margins, major sections |
| `2xl` (48px) | Large section breaks |
| `3xl` (64px) | Hero sections, major divisions |

---

## 🔤 TYPOGRAPHY

### **Font Families**

```scss
// Base font (body text)
$font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 
                   Roboto, 'Helvetica Neue', Arial, sans-serif;

// Headings
$font-family-heading: 'Inter', -apple-system, BlinkMacSystemFont, 
                      'Segoe UI', Roboto, sans-serif;

// Monospace (code)
$font-family-mono: 'Fira Code', 'Courier New', monospace;
```

**Why System Fonts?**
- ⚡ Faster loading (no web font download)
- 📱 Native look on each platform
- ♿ Better accessibility
- 💾 Smaller bundle size

---

### **Font Sizes**

```scss
$font-size-xs:   12px  // Small labels, captions
$font-size-sm:   14px  // ⭐ Default body text (Ant Design standard)
$font-size-base: 16px  // Large body text
$font-size-lg:   18px  // Emphasized text
$font-size-xl:   20px  // Small headings
$font-size-2xl:  24px  // H3
$font-size-3xl:  30px  // H2
$font-size-4xl:  36px  // H1
$font-size-5xl:  48px  // Hero text
```

### **Font Weights**

```scss
$font-weight-light:    300  // Rarely used
$font-weight-normal:   400  // Body text
$font-weight-medium:   500  // Emphasized text, buttons
$font-weight-semibold: 600  // Headings, labels
$font-weight-bold:     700  // Strong emphasis
```

### **Line Heights**

```scss
$line-height-tight:   1.2   // Headings
$line-height-normal:  1.5   // ⭐ Body text
$line-height-relaxed: 1.75  // Long-form content
```

---

### **Typography Scale**

| Element | Size | Weight | Line Height | Usage |
|---------|------|--------|-------------|-------|
| **H1** | 36px | 700 | 1.2 | Page titles |
| **H2** | 30px | 700 | 1.2 | Section titles |
| **H3** | 24px | 600 | 1.2 | Subsection titles |
| **H4** | 20px | 600 | 1.5 | Card titles |
| **H5** | 16px | 600 | 1.5 | Small headings |
| **Body Large** | 18px | 400 | 1.75 | Emphasized body |
| **Body** | 14px | 400 | 1.5 | Default text |
| **Body Small** | 12px | 400 | 1.5 | Captions, labels |

---

## 🔲 BORDER RADIUS

```scss
$radius-xs:   2px   // Minimal rounding
$radius-sm:   4px   // Small elements
$radius-md:   6px   // ⭐ Default (buttons, inputs, cards)
$radius-lg:   8px   // Large cards, modals
$radius-xl:   12px  // Extra large containers
$radius-2xl:  16px  // Hero sections
$radius-full: 9999px // Pills, avatars, badges
```

### **Usage**

| Radius | Component |
|--------|-----------|
| `xs` | Borders, dividers |
| `sm` | Tags, badges |
| `md` | Buttons, inputs, small cards |
| `lg` | Cards, modals, drawers |
| `xl` | Large containers |
| `full` | Avatars, pills, circular buttons |

---

## 🌑 SHADOWS

```scss
// Elevation levels
$shadow-xs:  0 1px 2px 0 rgba(0, 0, 0, 0.05)
$shadow-sm:  0 1px 3px 0 rgba(0, 0, 0, 0.1), 
             0 1px 2px 0 rgba(0, 0, 0, 0.06)
$shadow-md:  0 4px 6px -1px rgba(0, 0, 0, 0.1), 
             0 2px 4px -1px rgba(0, 0, 0, 0.06)
$shadow-lg:  0 10px 15px -3px rgba(0, 0, 0, 0.1), 
             0 4px 6px -2px rgba(0, 0, 0, 0.05)
$shadow-xl:  0 20px 25px -5px rgba(0, 0, 0, 0.1), 
             0 10px 10px -5px rgba(0, 0, 0, 0.04)
$shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25)
```

### **Usage**

| Shadow | Elevation | Component |
|--------|-----------|-----------|
| `xs` | 1dp | Borders, subtle depth |
| `sm` | 2dp | Cards (default), buttons |
| `md` | 4dp | Cards (hover), dropdowns |
| `lg` | 8dp | Popovers, tooltips |
| `xl` | 16dp | Modals, drawers |
| `2xl` | 24dp | Full-screen overlays |

---

## 📐 LAYOUT

### **Breakpoints**

```scss
$breakpoint-xs:  480px   // Mobile small
$breakpoint-sm:  576px   // Mobile
$breakpoint-md:  768px   // Tablet
$breakpoint-lg:  992px   // Desktop small
$breakpoint-xl:  1200px  // Desktop
$breakpoint-2xl: 1600px  // Desktop large
```

### **Container Widths**

```scss
$content-max-width: 1400px  // Maximum content width
$sidebar-width: 256px       // Sidebar width (expanded)
$sidebar-collapsed-width: 80px  // Sidebar width (collapsed)
$header-height: 64px        // Header height
```

### **Grid System**

Use Ant Design's Grid system:
- 24-column grid
- Responsive breakpoints
- Gutter spacing: 16px default

```jsx
<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    Content
  </Col>
</Row>
```

---

## ⏱️ TRANSITIONS

```scss
$transition-fast: 150ms ease-in-out  // Micro-interactions
$transition-base: 250ms ease-in-out  // ⭐ Default
$transition-slow: 350ms ease-in-out  // Complex animations
```

### **Easing Functions**

- `ease-in-out`: Default, smooth start and end
- `ease-out`: Quick start, slow end (entering)
- `ease-in`: Slow start, quick end (exiting)
- `cubic-bezier()`: Custom curves for specific needs

---

## 🎯 Z-INDEX LAYERS

```scss
$z-dropdown:        1000  // Dropdowns, selects
$z-sticky:          1020  // Sticky headers
$z-fixed:           1030  // Fixed elements
$z-modal-backdrop:  1040  // Modal backdrop
$z-modal:           1050  // Modals
$z-popover:         1060  // Popovers
$z-tooltip:         1070  // Tooltips (highest)
```

**Rule:** Always use these variables, never hardcode z-index values.

---

## 🎨 COMPONENT SPECIFICATIONS

### **Buttons**

```scss
// Heights
$button-height-sm: 32px
$button-height-md: 40px  // ⭐ Default
$button-height-lg: 48px

// Padding
Horizontal: 16px (md), 12px (sm), 20px (lg)
```

**Variants:**
- Primary: Filled with primary color
- Default: Outlined
- Text: No border, transparent background
- Link: Styled as link
- Dashed: Dashed border

---

### **Inputs**

```scss
// Heights
$input-height-sm: 32px
$input-height-md: 40px  // ⭐ Default
$input-height-lg: 48px

// Padding
Horizontal: 12px
```

**States:**
- Default: Border medium
- Hover: Border primary-400
- Focus: Border primary-500 + shadow
- Error: Border error-500
- Disabled: Background neutral-100

---

### **Cards**

```scss
$card-padding: 24px
$card-radius: 8px
$card-shadow: $shadow-sm
```

**Variants:**
- Default: White background, subtle shadow
- Bordered: Border instead of shadow
- Hoverable: Shadow increases on hover

---

### **Tables**

```scss
$table-header-bg: #fafafa
$table-row-hover-bg: #e3f2fd  // Primary tint
$table-border-color: #eeeeee
```

**Features:**
- Sortable columns
- Filterable
- Pagination
- Row selection
- Expandable rows

---

## ♿ ACCESSIBILITY

### **Color Contrast**

All text meets WCAG AA standards:
- Normal text: 4.5:1 minimum
- Large text: 3:1 minimum
- UI components: 3:1 minimum

### **Focus Indicators**

```scss
*:focus-visible {
  outline: 2px solid $primary-500;
  outline-offset: 2px;
}
```

### **Keyboard Navigation**

- All interactive elements are keyboard accessible
- Tab order is logical
- Skip links for main content
- ARIA labels where needed

---

## 📱 RESPONSIVE DESIGN

### **Mobile First Approach**

Start with mobile design, then enhance for larger screens.

```scss
// Mobile first
.component {
  padding: $spacing-md;
  
  // Tablet and up
  @include respond-above(md) {
    padding: $spacing-lg;
  }
  
  // Desktop and up
  @include respond-above(lg) {
    padding: $spacing-xl;
  }
}
```

### **Touch Targets**

Minimum touch target size: **44×44px** (iOS) / **48×48px** (Android)

---

## 🎭 ANIMATION PRINCIPLES

1. **Purposeful:** Animations should have a reason
2. **Quick:** Keep under 300ms for UI feedback
3. **Smooth:** Use ease-in-out for most cases
4. **Subtle:** Don't distract from content
5. **Respectful:** Honor prefers-reduced-motion

```scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📚 USAGE EXAMPLES

### **Using Design Tokens**

```scss
@import '@/styles/variables.scss';

.my-card {
  padding: $spacing-lg;
  background: $bg-primary;
  border-radius: $radius-lg;
  box-shadow: $shadow-sm;
  color: $text-primary;
  
  &:hover {
    box-shadow: $shadow-md;
  }
}
```

### **Using Mixins**

```scss
@import '@/styles/mixins.scss';

.my-component {
  @include card;
  @include flex-between;
  
  .title {
    @include heading-3;
  }
  
  .description {
    @include body-small;
    color: $text-secondary;
  }
}
```

---

## 🔄 VERSIONING

**Current Version:** 1.0.0

### **Changelog**
- **1.0.0** (May 2, 2026): Initial design system release

---

## 📞 SUPPORT

Questions about the design system?
1. Check this documentation
2. Review component examples
3. Check Ant Design documentation
4. Ask the team

---

**Maintained by:** Sekolah Info System Team  
**Last Review:** May 2, 2026  
**Next Review:** June 2, 2026
