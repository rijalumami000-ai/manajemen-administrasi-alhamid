// ============================================
// ANT DESIGN THEME CONFIGURATION
// Blue Professional Theme for Sekolah Info System
// ============================================

export const antdTheme = {
  token: {
    // Primary Colors
    colorPrimary: '#2196f3',
    colorSuccess: '#4caf50',
    colorWarning: '#ff9800',
    colorError: '#f44336',
    colorInfo: '#2196f3',

    // Text Colors
    colorText: '#212121',
    colorTextSecondary: '#616161',
    colorTextTertiary: '#9e9e9e',
    colorTextQuaternary: '#bdbdbd',

    // Background Colors
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#fafafa',
    colorBgSpotlight: '#f5f5f5',

    // Border
    colorBorder: '#e0e0e0',
    colorBorderSecondary: '#eeeeee',

    // Typography
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: 14,
    fontSizeHeading1: 36,
    fontSizeHeading2: 30,
    fontSizeHeading3: 24,
    fontSizeHeading4: 20,
    fontSizeHeading5: 16,

    // Border Radius
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,

    // Spacing
    padding: 16,
    paddingLG: 24,
    paddingSM: 12,
    paddingXS: 8,
    paddingXXS: 4,

    margin: 16,
    marginLG: 24,
    marginSM: 12,
    marginXS: 8,
    marginXXS: 4,

    // Control Heights
    controlHeight: 40,
    controlHeightLG: 48,
    controlHeightSM: 32,

    // Line Height
    lineHeight: 1.5,
    lineHeightHeading: 1.2,

    // Motion
    motionDurationFast: '0.15s',
    motionDurationMid: '0.25s',
    motionDurationSlow: '0.35s',

    // Z-Index
    zIndexPopupBase: 2000,
    zIndexBase: 0,

    // Box Shadow
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    boxShadowSecondary: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',

    // Screen Breakpoints
    screenXS: 480,
    screenSM: 576,
    screenMD: 768,
    screenLG: 992,
    screenXL: 1200,
    screenXXL: 1600,
  },

  components: {
    // Button Component
    Button: {
      primaryShadow: '0 2px 0 rgba(33, 150, 243, 0.1)',
      dangerShadow: '0 2px 0 rgba(244, 67, 54, 0.1)',
      fontWeight: 500,
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingContentHorizontal: 16,
    },

    // Card Component
    Card: {
      borderRadiusLG: 8,
      boxShadowTertiary: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
      headerFontSize: 16,
      headerFontSizeSM: 14,
      headerHeight: 56,
      headerHeightSM: 48,
    },

    // Table Component
    Table: {
      headerBg: '#fafafa',
      headerColor: '#212121',
      headerSortActiveBg: '#f5f5f5',
      headerSortHoverBg: '#f5f5f5',
      rowHoverBg: '#e3f2fd',
      borderColor: '#e0e0e0',
      headerBorderRadius: 6,
      cellPaddingBlock: 16,
      cellPaddingInline: 16,
    },

    // Form Component
    Form: {
      labelFontSize: 14,
      labelColor: '#212121',
      labelHeight: 32,
      itemMarginBottom: 24,
      verticalLabelPadding: '0 0 8px',
    },

    // Input Component
    Input: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      paddingBlock: 8,
      paddingInline: 12,
      borderRadius: 6,
      hoverBorderColor: '#42a5f5',
      activeBorderColor: '#2196f3',
      activeShadow: '0 0 0 3px rgba(33, 150, 243, 0.1)',
    },

    // Select Component
    Select: {
      controlHeight: 40,
      controlHeightLG: 48,
      controlHeightSM: 32,
      borderRadius: 6,
      optionSelectedBg: '#e3f2fd',
      optionSelectedColor: '#1976d2',
      optionActiveBg: '#e3f2fd',
    },

    // Modal Component
    Modal: {
      borderRadiusLG: 8,
      headerBg: '#ffffff',
      contentBg: '#ffffff',
      titleFontSize: 20,
      titleLineHeight: 1.4,
    },

    // Drawer Component
    Drawer: {
      footerPaddingBlock: 16,
      footerPaddingInline: 24,
    },

    // Menu Component
    Menu: {
      itemBorderRadius: 6,
      itemMarginBlock: 4,
      itemMarginInline: 4,
      itemPaddingInline: 16,
      itemHeight: 40,
      itemSelectedBg: '#bbdefb',
      itemSelectedColor: '#1976d2',
      itemActiveBg: '#e3f2fd',
      itemHoverBg: '#e3f2fd',
      itemHoverColor: '#1976d2',
      iconMarginInlineEnd: 12,
    },

    // Pagination Component
    Pagination: {
      itemBorderRadius: 6,
      itemActiveBg: '#2196f3',
      itemLinkBg: '#ffffff',
      itemInputBg: '#ffffff',
    },

    // Tabs Component
    Tabs: {
      itemActiveColor: '#1976d2',
      itemHoverColor: '#2196f3',
      itemSelectedColor: '#1976d2',
      inkBarColor: '#1976d2',
      titleFontSize: 14,
      titleFontSizeLG: 16,
      titleFontSizeSM: 14,
    },

    // Badge Component
    Badge: {
      statusSize: 8,
      dotSize: 8,
      textFontSize: 12,
      textFontSizeSM: 12,
      textFontWeight: 500,
    },

    // Tag Component
    Tag: {
      defaultBg: '#f5f5f5',
      defaultColor: '#616161',
      borderRadiusSM: 4,
      fontSizeSM: 12,
    },

    // Alert Component
    Alert: {
      borderRadiusLG: 6,
      withDescriptionIconSize: 24,
      withDescriptionPadding: '16px 24px',
    },

    // Message Component
    Message: {
      contentBg: '#ffffff',
      contentPadding: '10px 16px',
    },

    // Notification Component
    Notification: {
      width: 384,
      borderRadiusLG: 8,
    },

    // Breadcrumb Component
    Breadcrumb: {
      fontSize: 14,
      iconFontSize: 14,
      linkColor: '#616161',
      linkHoverColor: '#2196f3',
      separatorColor: '#bdbdbd',
      separatorMargin: 8,
    },

    // Steps Component
    Steps: {
      iconSize: 32,
      iconSizeSM: 24,
      dotSize: 8,
      titleLineHeight: 32,
      customIconSize: 32,
      customIconTop: 0,
      customIconFontSize: 24,
    },

    // Switch Component
    Switch: {
      trackHeight: 22,
      trackHeightSM: 16,
      trackMinWidth: 44,
      trackMinWidthSM: 28,
      trackPadding: 2,
      handleSize: 18,
      handleSizeSM: 12,
    },

    // Slider Component
    Slider: {
      trackBg: '#e0e0e0',
      trackHoverBg: '#bdbdbd',
      handleColor: '#2196f3',
      handleActiveColor: '#1976d2',
      handleSize: 14,
      handleSizeHover: 16,
      handleLineWidth: 2,
      handleLineWidthHover: 4,
      railSize: 4,
      dotSize: 8,
    },

    // Upload Component
    Upload: {
      actionsColor: '#616161',
    },

    // Tooltip Component
    Tooltip: {
      borderRadius: 6,
      colorBgSpotlight: 'rgba(0, 0, 0, 0.85)',
    },

    // Popover Component
    Popover: {
      minWidth: 177,
      borderRadiusLG: 8,
    },

    // Layout Component
    Layout: {
      headerBg: '#ffffff',
      headerHeight: 64,
      headerPadding: '0 24px',
      headerColor: '#212121',
      footerBg: '#fafafa',
      footerPadding: '24px 50px',
      siderBg: '#ffffff',
      triggerHeight: 48,
      triggerBg: '#ffffff',
      triggerColor: '#212121',
      zeroTriggerWidth: 36,
      zeroTriggerHeight: 42,
      lightSiderBg: '#ffffff',
      lightTriggerBg: '#ffffff',
      lightTriggerColor: '#212121',
    },
  },

  // Algorithm (optional: dark mode, compact mode)
  // algorithm: theme.defaultAlgorithm,
};

export default antdTheme;
