# 🎨 STYLING GUIDE
## Sass Best Practices & Patterns

**Version:** 1.0.0  
**Last Updated:** May 2, 2026

---

## 📖 OVERVIEW

Panduan ini menjelaskan cara menggunakan Sass (SCSS) dalam proyek Sekolah Info System, termasuk best practices, patterns, dan conventions.

---

## 📁 FILE STRUCTURE

```
frontend/src/styles/
├── variables.scss      # Design tokens (colors, spacing, etc)
├── mixins.scss         # Reusable Sass mixins
├── global.scss         # Global styles & utilities
└── antd-theme.scss     # Ant Design customization
```

### **Import Order**

Selalu import dalam urutan ini:

```scss
// 1. Variables first
@import '@/styles/variables.scss';

// 2. Mixins second
@import '@/styles/mixins.scss';

// 3. Your component styles
.my-component {
  // styles here
}
```

---

## 🎨 USING VARIABLES

### **Color Variables**

```scss
@import '@/styles/variables.scss';

.button {
  // ✅ Good: Use semantic variables
  background: $primary-500;
  color: $text-inverse;
  border: 1px solid $border-medium;
  
  &:hover {
    background: $primary-600;
  }
  
  // ❌ Bad: Hardcoded colors
  background: #2196f3;
  color: #ffffff;
}
```

### **Spacing Variables**

```scss
.card {
  // ✅ Good: Use spacing scale
  padding: $spacing-lg;
  margin-bottom: $spacing-md;
  gap: $spacing-sm;
  
  // ❌ Bad: Random values
  padding: 23px;
  margin-bottom: 15px;
}
```

### **Typography Variables**

```scss
.heading {
  // ✅ Good: Use typography scale
  font-size: $font-size-2xl;
  font-weight: $font-weight-semibold;
  line-height: $line-height-tight;
  
  // ❌ Bad: Random values
  font-size: 25px;
  font-weight: 550;
}
```

---

## 🔧 USING MIXINS

### **Layout Mixins**

```scss
@import '@/styles/mixins.scss';

.header {
  // Flexbox utilities
  @include flex-between;  // display: flex; align-items: center; justify-content: space-between;
}

.sidebar {
  @include flex-column;   // display: flex; flex-direction: column;
}

.modal {
  @include flex-center;   // display: flex; align-items: center; justify-content: center;
}
```

### **Card Mixins**

```scss
.card {
  // Apply card styles
  @include card;
  // Includes: background, border-radius, shadow, padding, hover effect
}

.card-bordered {
  // Card with border instead of shadow
  @include card-bordered;
}
```

### **Typography Mixins**

```scss
.page-title {
  @include heading-1;  // 36px, bold, tight line-height
}

.section-title {
  @include heading-3;  // 24px, semibold
}

.description {
  @include body-small;  // 12px, normal weight, secondary color
}

.truncated-text {
  @include text-truncate;  // Single line ellipsis
}

.multi-line-truncate {
  @include text-truncate-lines(3);  // 3 lines with ellipsis
}
```

### **Button Mixins**

```scss
.custom-button {
  @include button-primary;
  // Includes: padding, border-radius, colors, hover, active, disabled states
}

.secondary-button {
  @include button-secondary;
  // Outlined button style
}
```

### **Form Mixins**

```scss
.custom-input {
  @include input-base;
  // Includes: sizing, borders, focus states, disabled states
}
```

### **Animation Mixins**

```scss
.modal {
  @include fade-in;  // Fade in animation
}

.notification {
  @include slide-in-up;  // Slide up animation
}

.dropdown {
  @include slide-in-down;  // Slide down animation
}
```

---

## 📱 RESPONSIVE DESIGN

### **Breakpoint Mixins**

```scss
@import '@/styles/mixins.scss';

.component {
  padding: $spacing-xl;
  
  // Mobile (max-width: 768px)
  @include respond-to(md) {
    padding: $spacing-md;
  }
  
  // Tablet (max-width: 992px)
  @include respond-to(lg) {
    padding: $spacing-lg;
  }
}
```

### **Mobile-First Approach**

```scss
.component {
  // Mobile styles (default)
  font-size: $font-size-sm;
  padding: $spacing-md;
  
  // Tablet and above
  @include respond-above(md) {
    font-size: $font-size-base;
    padding: $spacing-lg;
  }
  
  // Desktop and above
  @include respond-above(lg) {
    font-size: $font-size-lg;
    padding: $spacing-xl;
  }
}
```

### **Available Breakpoints**

```scss
// Max-width (mobile-first)
@include respond-to(xs)   // max-width: 480px
@include respond-to(sm)   // max-width: 576px
@include respond-to(md)   // max-width: 768px
@include respond-to(lg)   // max-width: 992px
@include respond-to(xl)   // max-width: 1200px
@include respond-to(2xl)  // max-width: 1600px

// Min-width (desktop-first)
@include respond-above(xs)  // min-width: 481px
@include respond-above(sm)  // min-width: 577px
@include respond-above(md)  // min-width: 769px
@include respond-above(lg)  // min-width: 993px
@include respond-above(xl)  // min-width: 1201px
```

---

## 🎯 NESTING BEST PRACTICES

### **Good Nesting**

```scss
// ✅ Good: Max 3 levels deep
.card {
  padding: $spacing-lg;
  
  .card-header {
    @include flex-between;
    margin-bottom: $spacing-md;
    
    .card-title {
      @include heading-4;
    }
  }
  
  .card-body {
    color: $text-secondary;
  }
}
```

### **Bad Nesting**

```scss
// ❌ Bad: Too deep, hard to maintain
.page {
  .container {
    .section {
      .card {
        .card-header {
          .card-title {
            .title-text {
              // Too deep!
            }
          }
        }
      }
    }
  }
}
```

### **BEM Naming Convention**

```scss
// Block
.card {
  // Element
  &__header {
    // Modifier
    &--large {
      padding: $spacing-xl;
    }
  }
  
  &__body {
    padding: $spacing-lg;
  }
  
  &__footer {
    border-top: 1px solid $border-light;
  }
}

// Usage in JSX:
// <div className="card">
//   <div className="card__header card__header--large">
//   <div className="card__body">
//   <div className="card__footer">
```

---

## 🔄 PARENT SELECTOR (&)

### **Pseudo-classes**

```scss
.button {
  background: $primary-500;
  
  // ✅ Good: Use & for pseudo-classes
  &:hover {
    background: $primary-600;
  }
  
  &:active {
    background: $primary-700;
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
  
  &:focus-visible {
    outline: 2px solid $primary-500;
    outline-offset: 2px;
  }
}
```

### **Modifiers**

```scss
.button {
  @include button-base;
  
  // Variants
  &--primary {
    background: $primary-500;
    color: $text-inverse;
  }
  
  &--secondary {
    background: transparent;
    border: 1px solid $primary-500;
    color: $primary-500;
  }
  
  &--danger {
    background: $error-500;
    color: $text-inverse;
  }
  
  // Sizes
  &--small {
    height: $button-height-sm;
    padding: 0 $spacing-sm;
    font-size: $font-size-xs;
  }
  
  &--large {
    height: $button-height-lg;
    padding: 0 $spacing-lg;
    font-size: $font-size-base;
  }
}
```

---

## 🎨 COMPONENT STYLING PATTERNS

### **Pattern 1: Scoped Component Styles**

```scss
// components/MyComponent/MyComponent.scss
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.my-component {
  @include card;
  
  &__header {
    @include flex-between;
    padding: $spacing-md;
    border-bottom: 1px solid $border-light;
  }
  
  &__title {
    @include heading-4;
    margin: 0;
  }
  
  &__body {
    padding: $spacing-lg;
  }
  
  &__footer {
    @include flex-end;
    gap: $spacing-sm;
    padding: $spacing-md;
    border-top: 1px solid $border-light;
  }
}
```

```jsx
// components/MyComponent/MyComponent.jsx
import './MyComponent.scss';

export function MyComponent() {
  return (
    <div className="my-component">
      <div className="my-component__header">
        <h3 className="my-component__title">Title</h3>
      </div>
      <div className="my-component__body">
        Content
      </div>
      <div className="my-component__footer">
        <button>Cancel</button>
        <button>Save</button>
      </div>
    </div>
  );
}
```

### **Pattern 2: Utility Classes**

```scss
// Use global utility classes from global.scss
<div className="d-flex flex-between p-3 mb-2 rounded shadow-sm">
  <span className="text-primary font-semibold">Label</span>
  <span className="text-secondary">Value</span>
</div>
```

### **Pattern 3: Inline Styles (Avoid)**

```jsx
// ❌ Bad: Inline styles
<div style={{ padding: '24px', background: '#ffffff' }}>

// ✅ Good: Use classes
<div className="p-3 bg-primary">
```

---

## 🎭 ANIMATIONS

### **Using Animation Mixins**

```scss
.modal {
  @include fade-in($transition-base);
}

.notification {
  @include slide-in-up($transition-fast);
}

.dropdown {
  @include slide-in-down($transition-fast);
}
```

### **Custom Animations**

```scss
@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-10px);
  }
}

.bouncing-element {
  animation: bounce 1s ease-in-out infinite;
}
```

### **Transition Best Practices**

```scss
.button {
  // ✅ Good: Specific properties
  transition: background-color $transition-fast,
              transform $transition-fast;
  
  // ❌ Bad: Transition all (performance issue)
  transition: all $transition-fast;
}
```

---

## 🔍 CUSTOM SCROLLBAR

```scss
.scrollable-container {
  @include custom-scrollbar;
  // Applies custom scrollbar styling
}

// Or manually:
.custom-scroll {
  &::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: $neutral-100;
    border-radius: $radius-full;
  }
  
  &::-webkit-scrollbar-thumb {
    background: $neutral-400;
    border-radius: $radius-full;
    
    &:hover {
      background: $neutral-500;
    }
  }
}
```

---

## ♿ ACCESSIBILITY

### **Focus Styles**

```scss
.interactive-element {
  // Always provide focus styles
  &:focus-visible {
    outline: 2px solid $primary-500;
    outline-offset: 2px;
  }
  
  // Remove default outline only if you provide alternative
  &:focus {
    outline: none;
  }
}
```

### **Screen Reader Only**

```scss
.sr-only {
  @include visually-hidden;
  // Hides visually but keeps for screen readers
}
```

### **Reduced Motion**

```scss
// Automatically handled in global.scss
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 📏 SPACING UTILITIES

### **Margin Utilities**

```scss
.m-0   // margin: 0
.mt-1  // margin-top: 8px
.mt-2  // margin-top: 16px
.mt-3  // margin-top: 24px
.mb-1  // margin-bottom: 8px
.mb-2  // margin-bottom: 16px
.mb-3  // margin-bottom: 24px
.ml-1  // margin-left: 8px
.mr-1  // margin-right: 8px
```

### **Padding Utilities**

```scss
.p-0  // padding: 0
.p-1  // padding: 8px
.p-2  // padding: 16px
.p-3  // padding: 24px
```

---

## 🎨 COLOR UTILITIES

```scss
// Text colors
.text-primary    // #212121
.text-secondary  // #616161
.text-success    // #4caf50
.text-warning    // #ff9800
.text-error      // #f44336
.text-info       // #2196f3

// Background colors
.bg-primary      // #ffffff
.bg-secondary    // #fafafa
.bg-success      // #e8f5e9
.bg-warning      // #fff3e0
.bg-error        // #ffebee
```

---

## 🚫 COMMON MISTAKES

### **1. Not Using Variables**

```scss
// ❌ Bad
.button {
  padding: 12px 20px;
  background: #2196f3;
  border-radius: 6px;
}

// ✅ Good
.button {
  padding: $spacing-sm $spacing-md;
  background: $primary-500;
  border-radius: $radius-md;
}
```

### **2. Deep Nesting**

```scss
// ❌ Bad: 6 levels deep
.page .container .section .card .header .title {
  font-size: 20px;
}

// ✅ Good: Flat structure
.card-title {
  font-size: $font-size-xl;
}
```

### **3. Not Using Mixins**

```scss
// ❌ Bad: Repeating code
.card-1 {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 24px;
}

.card-2 {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  padding: 24px;
}

// ✅ Good: Use mixin
.card-1, .card-2 {
  @include card;
}
```

### **4. Hardcoded Colors**

```scss
// ❌ Bad
.error-message {
  color: #f44336;
  background: #ffebee;
}

// ✅ Good
.error-message {
  color: $error-500;
  background: $error-50;
}
```

---

## ✅ CHECKLIST

Before committing styles, check:

- [ ] Used design tokens (variables) instead of hardcoded values
- [ ] Used mixins for common patterns
- [ ] Nesting is max 3 levels deep
- [ ] Responsive design implemented
- [ ] Focus states provided for interactive elements
- [ ] Animations respect prefers-reduced-motion
- [ ] No !important (unless absolutely necessary)
- [ ] BEM naming convention followed
- [ ] Code is DRY (Don't Repeat Yourself)

---

## 📚 RESOURCES

- [Sass Documentation](https://sass-lang.com/documentation/)
- [BEM Methodology](http://getbem.com/)
- [CSS Guidelines](https://cssguidelin.es/)
- [Design System](./DESIGN_SYSTEM.md)

---

**Maintained by:** Sekolah Info System Team  
**Last Updated:** May 2, 2026
