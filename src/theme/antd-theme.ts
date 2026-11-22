import { theme as antdTheme, type ThemeConfig } from 'antd';
import { radius, size, themedColors, type ThemeMode } from './tokens';

/**
 * Ant Design's theme, built from the design tokens.
 *
 * antd's cssinjs needs real colour values (it derives hover and disabled shades
 * from them), so this reads src/theme/tokens.ts, which is generated from the
 * same design-tokens/tokens.json as the CSS custom properties. Nothing here is
 * a literal colour.
 *
 * Values follow the Pencil components: 38px controls (10px padding around a
 * 14px label), 8px corners, 12px on cards and dialogs, a 1px border-strong
 * boundary on inputs that becomes a 2px focus border, and flat overlays: no
 * shadows anywhere, a hairline ring instead.
 */
const CONTROL_HEIGHT = 38;

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  const c = themedColors[mode];
  const hairline = `0 0 0 1px ${c.border}`;
  // A 1px border plus a 1px ring reads as the design's 2px focus border.
  const focusRing = `0 0 0 1px ${c.focus}`;
  const errorRing = `0 0 0 1px ${c.danger}`;

  return {
    algorithm: mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
    token: {
      colorPrimary: c.primary,
      colorPrimaryHover: c['primary-hover'],
      colorPrimaryActive: c['primary-hover'],
      colorTextLightSolid: c['on-primary'],
      colorLink: c.link,
      colorLinkHover: c.link,
      colorLinkActive: c.link,
      colorSuccess: c.success,
      colorWarning: c.warning,
      colorError: c.danger,
      colorInfo: c.info,
      colorText: c.text,
      colorTextHeading: c.text,
      colorTextSecondary: c['text-secondary'],
      colorTextTertiary: c['text-muted'],
      colorTextDescription: c['text-muted'],
      colorTextPlaceholder: c['text-muted'],
      colorIcon: c['text-secondary'],
      colorIconHover: c.text,
      colorBorder: c['border-strong'],
      colorBorderSecondary: c.border,
      colorSplit: c.border,
      colorBgBase: c.surface,
      colorBgContainer: c.surface,
      colorBgElevated: c.surface,
      colorBgLayout: c.bg,
      colorFillAlter: c['surface-muted'],
      controlItemBgActive: c['surface-muted'],
      controlItemBgActiveHover: c['surface-muted'],
      controlOutline: c.focus,
      controlOutlineWidth: 1,
      lineWidthFocus: size['focus-width'],
      borderRadius: radius.control,
      borderRadiusLG: radius.card,
      borderRadiusSM: radius.chip,
      borderRadiusXS: radius.badge,
      controlHeight: CONTROL_HEIGHT,
      fontSize: 14,
      fontFamily: 'var(--font-sans)',
      fontFamilyCode: 'var(--font-mono)',
      boxShadow: hairline,
      boxShadowSecondary: hairline,
      boxShadowTertiary: hairline,
    },
    components: {
      // Button md: 38px, 16px sides, 14px semibold label, 16px icon 8px from it.
      // Button lg: 51px, 24px sides, 16px label, 10px corners. Ghost is the
      // text button in text-secondary; hover states are not drawn in the design,
      // so they step to the next quiet surface.
      Button: {
        primaryShadow: 'none',
        defaultShadow: 'none',
        dangerShadow: 'none',
        fontWeight: 600,
        contentFontSize: 14,
        contentFontSizeLG: 16,
        paddingInline: 16,
        paddingInlineLG: 24,
        controlHeightLG: 51,
        borderRadiusLG: radius['control-lg'],
        iconGap: 8,
        defaultBorderColor: c['border-strong'],
        defaultColor: c.text,
        defaultBg: c.surface,
        defaultHoverBg: c['surface-muted'],
        defaultHoverColor: c.text,
        defaultHoverBorderColor: c['border-strong'],
        defaultActiveBg: c['surface-muted'],
        defaultActiveColor: c.text,
        defaultActiveBorderColor: c['border-strong'],
        textTextColor: c['text-secondary'],
        textTextHoverColor: c.text,
        textTextActiveColor: c.text,
        textHoverBg: c['surface-muted'],
      },
      // Fields are 41px: 11px above and below 15px text, 14px at the sides (antd
      // counts the 1px border inside the padding).
      Input: { inputFontSize: 15, paddingBlock: 8, paddingInline: 13, activeBorderColor: c.focus, hoverBorderColor: c['border-strong'], activeShadow: focusRing, errorActiveShadow: errorRing },
      InputNumber: { inputFontSize: 15, paddingBlock: 8, paddingInline: 13, activeBorderColor: c.focus, hoverBorderColor: c['border-strong'], activeShadow: focusRing, errorActiveShadow: errorRing },
      Select: { controlHeight: 41, fontSize: 15, activeBorderColor: c.focus, hoverBorderColor: c['border-strong'], activeOutlineColor: c.focus, optionSelectedBg: c['surface-muted'] },
      DatePicker: { controlHeight: 41, fontSize: 15, activeBorderColor: c.focus, hoverBorderColor: c['border-strong'], activeShadow: focusRing, errorActiveShadow: errorRing },
      // Checkbox: an 18px box with 4px corners.
      Checkbox: { controlInteractiveSize: 18, borderRadiusSM: radius.badge },
      // Toggle: a 36 by 20 track with a 16px thumb.
      Switch: { trackHeight: 20, trackMinWidth: 36, handleSize: 16, trackPadding: 2 },
      // Segmented: 3px track padding around 29px items, 13px labels.
      Segmented: {
        trackPadding: 3,
        trackBg: c['surface-muted'],
        itemSelectedBg: c.surface,
        itemColor: c['text-secondary'],
        itemSelectedColor: c.text,
        itemHoverColor: c.text,
        itemHoverBg: 'transparent',
        itemActiveBg: 'transparent',
        controlHeight: 29,
        fontSize: 13,
        borderRadius: radius.control,
        borderRadiusSM: radius.chip,
      },
      // Tabs: 28px apart, 10px under the label, a 2px text-coloured underline.
      Tabs: {
        horizontalItemGutter: 28,
        horizontalItemPadding: '0 0 10px',
        horizontalMargin: '0',
        titleFontSize: 14,
        inkBarColor: c.text,
        itemColor: c['text-secondary'],
        itemSelectedColor: c.text,
        itemHoverColor: c.text,
        itemActiveColor: c.text,
      },
      // Card is the design's Panel: 20px sides, a 47px head (14px above and below a
      // 15px semibold title), 20px body. The design has one panel size, so the
      // small card (size="small") gets the same values.
      Card: {
        borderRadiusLG: radius.card,
        headerFontSize: 15,
        headerFontSizeSM: 15,
        headerHeight: 47,
        headerHeightSM: 47,
        headerPadding: 20,
        headerPaddingSM: 20,
        bodyPadding: 20,
        bodyPaddingSM: 20,
      },
      Modal: { borderRadiusLG: radius.card, contentBg: c.surface, headerBg: c.surface },
      // Rows are 46px: 11px above and below a 14px cell, 20px at the sides.
      Table: {
        headerBg: c['surface-muted'],
        headerColor: c['text-muted'],
        headerSplitColor: 'transparent',
        borderColor: c.border,
        rowHoverBg: c['surface-muted'],
        cellPaddingBlock: 11,
        cellPaddingInline: 20,
        headerBorderRadius: 0,
      },
      Tag: { borderRadiusSM: radius.chip },
    },
  };
}
