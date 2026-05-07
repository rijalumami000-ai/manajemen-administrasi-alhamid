# 📱 FRONTEND DOCUMENTATION
## Sekolah Info System - UI/UX Documentation Hub

**Version:** 1.0.0  
**Last Updated:** May 2, 2026  
**Status:** ✅ Phase 1 Complete

---

## 📖 OVERVIEW

Dokumentasi lengkap untuk frontend Sekolah Info System yang menggunakan **React + Vite + Ant Design + Sass**.

---

## 🗂️ DOCUMENTATION INDEX

### **📋 Planning & Progress**
- **[UI/UX Upgrade Plan](./UI_UX_UPGRADE_PLAN.md)** - Rencana lengkap upgrade UI/UX, progress tracking, dan roadmap
  - Phase 1: ✅ Setup & Configuration (Complete)
  - Phase 2: 🔜 Design System Foundation
  - Phase 3: 🔜 Component Migration
  - Phase 4: 🔜 Enhancement & Polish
  - Phase 5: 🔜 Testing & Documentation

### **🎨 Design System**
- **[Design System](./DESIGN_SYSTEM.md)** - Design tokens, color palette, typography, spacing, shadows
  - Color palette (Blue Professional Theme)
  - Typography scale
  - Spacing system (8px base)
  - Border radius, shadows, z-index
  - Responsive breakpoints
  - Accessibility guidelines

### **💅 Styling**
- **[Styling Guide](./STYLING_GUIDE.md)** - Sass best practices, mixins, patterns, conventions
  - Using variables & mixins
  - Responsive design patterns
  - BEM naming convention
  - Animation guidelines
  - Common mistakes to avoid

### **📦 Components**
- **[Component Library](./COMPONENT_LIBRARY.md)** - Ant Design components usage guide
  - Button, Form, Input, Select
  - Table, Card, Modal
  - Message, Notification, Alert
  - Layout, Menu, Tabs
  - And 40+ more components

---

## 🚀 QUICK START

### **1. Install Dependencies**

```bash
cd frontend
npm install
```

### **2. Run Development Server**

```bash
npm run dev
```

### **3. Build for Production**

```bash
npm run build
```

### **4. Preview Production Build**

```bash
npm run preview
```

---

## 🛠️ TECH STACK

| Technology | Version | Purpose |
|------------|---------|---------|
| **React** | 19.x | UI Library |
| **Vite** | 8.x | Build Tool |
| **Ant Design** | 5.x | UI Component Library |
| **Sass** | Latest | CSS Preprocessor |
| **React Router** | 7.x | Routing |
| **Axios** | Latest | HTTP Client |

---

## 📁 PROJECT STRUCTURE

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/          # Reusable components
│   │   ├── features/        # Feature-specific components
│   │   └── layout/          # Layout components
│   ├── pages/               # Page components
│   ├── context/             # React Context
│   ├── hooks/               # Custom hooks
│   ├── services/            # API services
│   ├── utils/               # Utility functions
│   ├── config/
│   │   └── theme.js         # Ant Design theme config
│   ├── styles/
│   │   ├── variables.scss   # Design tokens
│   │   ├── mixins.scss      # Sass mixins
│   │   ├── global.scss      # Global styles
│   │   └── antd-theme.scss  # Ant Design customization
│   ├── App.jsx              # Root component
│   └── main.jsx             # Entry point
├── public/                  # Static assets
├── docs/                    # Documentation
└── package.json
```

---

## 🎨 DESIGN SYSTEM QUICK REFERENCE

### **Colors**

```scss
// Primary (Blue)
$primary-500: #2196f3

// Semantic
$success-500: #4caf50
$warning-500: #ff9800
$error-500: #f44336

// Text
$text-primary: #212121
$text-secondary: #616161
```

### **Spacing**

```scss
$spacing-sm: 8px
$spacing-md: 16px   // Most common
$spacing-lg: 24px
$spacing-xl: 32px
```

### **Typography**

```scss
$font-size-sm: 14px    // Default body
$font-size-base: 16px
$font-size-xl: 20px
$font-size-2xl: 24px
```

---

## 🔧 DEVELOPMENT GUIDELINES

### **Component Creation**

```jsx
// 1. Import dependencies
import { Button, Card } from 'antd';
import './MyComponent.scss';

// 2. Create functional component
export function MyComponent({ title, onSave }) {
  return (
    <Card title={title}>
      <Button type="primary" onClick={onSave}>
        Save
      </Button>
    </Card>
  );
}

// 3. Export component
export default MyComponent;
```

### **Styling Components**

```scss
// MyComponent.scss
@import '@/styles/variables.scss';
@import '@/styles/mixins.scss';

.my-component {
  @include card;
  
  &__header {
    @include flex-between;
    padding: $spacing-md;
  }
  
  &__body {
    padding: $spacing-lg;
  }
}
```

### **Using Ant Design**

```jsx
import { Button, Form, Input, message } from 'antd';

function MyForm() {
  const [form] = Form.useForm();
  
  const onFinish = async (values) => {
    try {
      await api.save(values);
      message.success('Saved successfully!');
    } catch (error) {
      message.error('Failed to save!');
    }
  };
  
  return (
    <Form form={form} onFinish={onFinish} layout="vertical">
      <Form.Item 
        label="Name" 
        name="name"
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      
      <Form.Item>
        <Button type="primary" htmlType="submit">
          Submit
        </Button>
      </Form.Item>
    </Form>
  );
}
```

---

## 📱 RESPONSIVE DESIGN

### **Breakpoints**

```scss
// Mobile: < 768px
// Tablet: 768px - 992px
// Desktop: > 992px

.component {
  padding: $spacing-xl;
  
  @include respond-to(md) {
    padding: $spacing-md;  // Mobile
  }
}
```

### **Ant Design Grid**

```jsx
import { Row, Col } from 'antd';

<Row gutter={[16, 16]}>
  <Col xs={24} sm={12} md={8} lg={6}>
    Content
  </Col>
</Row>
```

---

## ✅ CODE QUALITY CHECKLIST

Before committing:

- [ ] Used Ant Design components instead of custom ones
- [ ] Used design tokens (variables) instead of hardcoded values
- [ ] Used Sass mixins for common patterns
- [ ] Implemented responsive design
- [ ] Added loading states for async operations
- [ ] Added error handling
- [ ] Provided user feedback (message/notification)
- [ ] Tested on mobile and desktop
- [ ] No console errors or warnings
- [ ] Code follows project conventions

---

## 🐛 TROUBLESHOOTING

### **Build Errors**

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Clear Vite cache
rm -rf .vite
npm run dev
```

### **Sass Import Warnings**

Warning tentang `@import` deprecated adalah normal dan tidak mempengaruhi functionality. Akan di-update ke `@use` di future release.

### **Ant Design Not Styled**

Pastikan `ConfigProvider` sudah wrap App di `main.jsx`:

```jsx
import { ConfigProvider } from 'antd';
import antdTheme from './config/theme';

<ConfigProvider theme={antdTheme}>
  <App />
</ConfigProvider>
```

---

## 📚 LEARNING RESOURCES

### **Official Documentation**
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vite.dev/)
- [Ant Design Documentation](https://ant.design/)
- [Sass Documentation](https://sass-lang.com/)

### **Tutorials**
- [React Tutorial](https://react.dev/learn)
- [Ant Design Pro](https://pro.ant.design/) - Enterprise template
- [Sass Basics](https://sass-lang.com/guide)

### **Tools**
- [React DevTools](https://react.dev/learn/react-developer-tools)
- [Ant Design Icons](https://ant.design/components/icon/)
- [Color Palette Generator](https://coolors.co/)

---

## 🤝 CONTRIBUTING

### **Before Starting**

1. Read all documentation in this folder
2. Review existing components
3. Check Ant Design components first
4. Follow the design system

### **Development Workflow**

1. Create feature branch
2. Implement changes
3. Test thoroughly
4. Update documentation if needed
5. Create pull request

### **Code Style**

- Use functional components
- Use hooks for state management
- Keep components small and focused
- Extract reusable logic
- Write meaningful comments
- Follow BEM naming for CSS classes

---

## 📊 CURRENT STATUS

### **✅ Completed**
- [x] Ant Design setup
- [x] Sass configuration
- [x] Design system (variables, mixins)
- [x] Theme customization
- [x] Global styles
- [x] Documentation structure

### **🔜 Next Steps**
- [ ] Migrate layout components
- [ ] Migrate common components
- [ ] Migrate feature components
- [ ] Migrate pages
- [ ] Add animations
- [ ] Performance optimization

---

## 📞 SUPPORT

Need help?

1. **Check Documentation:** Read docs in this folder
2. **Check Examples:** Look at existing components
3. **Ant Design Docs:** Check official documentation
4. **Ask Team:** Reach out to team members

---

## 📝 CHANGELOG

### **May 2, 2026**
- ✅ Initial setup complete
- ✅ Ant Design v5 installed
- ✅ Sass configured
- ✅ Design system created
- ✅ Theme customization done
- ✅ Documentation created

---

## 🎯 GOALS

### **Short Term (1-2 weeks)**
- Complete component migration
- Implement responsive design
- Add loading states

### **Medium Term (1 month)**
- Performance optimization
- Accessibility improvements
- Animation polish

### **Long Term (3 months)**
- Dark mode support
- Advanced features
- Mobile app (PWA)

---

## 📄 LICENSE

Internal project - Ponpes Al-Hamid

---

**Maintained by:** Sekolah Info System Team  
**Project Start:** May 2, 2026  
**Last Updated:** May 2, 2026

---

## 🔗 QUICK LINKS

- [UI/UX Upgrade Plan](./UI_UX_UPGRADE_PLAN.md)
- [Design System](./DESIGN_SYSTEM.md)
- [Styling Guide](./STYLING_GUIDE.md)
- [Component Library](./COMPONENT_LIBRARY.md)
- [Main Project README](../../README.md)
