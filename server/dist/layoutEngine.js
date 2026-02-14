/**
 * Layout Engine - Intelligent layout calculation with design rules
 *
 * Features:
 * - Z-pattern and F-pattern reading flow awareness
 * - WCAG AA contrast checking (4.5:1 ratio)
 * - Dynamic font sizing based on text length
 * - Safe zone enforcement per format
 * - Logo placement rules (top-right or bottom-right, never center)
 * - CTA placement (lower third, centered or right-aligned)
 * - Visual weight balancing
 */
import { FORMAT_CONFIGS } from './promptEngine.js';
// WCAG AA contrast ratio requirement
export const WCAG_AA_RATIO = 4.5;
export const SAFE_ZONES = {
    square: { top: 80, right: 40, bottom: 100, left: 40 },
    portrait: { top: 100, right: 40, bottom: 140, left: 40 },
    story: { top: 120, right: 40, bottom: 200, left: 40 },
};
export const FONT_SIZES = {
    headline: { min: 24, max: 48, default: 36 },
    subhead: { min: 14, max: 24, default: 18 },
    cta: { min: 12, max: 20, default: 16 },
};
/**
 * Calculate relative luminance for contrast calculation
 * WCAG 2.0 formula
 */
function getLuminance(hex) {
    // Remove # if present
    const hexClean = hex.replace('#', '');
    // Parse RGB
    const r = parseInt(hexClean.substring(0, 2), 16) / 255;
    const g = parseInt(hexClean.substring(2, 4), 16) / 255;
    const b = parseInt(hexClean.substring(4, 6), 16) / 255;
    // Convert to linear RGB
    const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    const rLinear = toLinear(r);
    const gLinear = toLinear(g);
    const bLinear = toLinear(b);
    // Calculate luminance
    return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}
/**
 * Calculate contrast ratio between two colors
 * WCAG 2.0 formula
 */
export function calculateContrastRatio(color1, color2) {
    const L1 = getLuminance(color1);
    const L2 = getLuminance(color2);
    const lighter = Math.max(L1, L2);
    const darker = Math.min(L1, L2);
    return (lighter + 0.05) / (darker + 0.05);
}
/**
 * Check if contrast ratio meets WCAG AA
 */
export function meetsContrastRequirement(color1, color2) {
    return calculateContrastRatio(color1, color2) >= WCAG_AA_RATIO;
}
/**
 * Find a text color that meets contrast requirements against a background
 */
export function findAccessibleTextColor(backgroundColor, preferredColor = '#FFFFFF') {
    // Check if preferred color works
    if (meetsContrastRequirement(backgroundColor, preferredColor)) {
        return {
            color: preferredColor,
            ratio: calculateContrastRatio(backgroundColor, preferredColor),
        };
    }
    // Try white and black
    const white = '#FFFFFF';
    const black = '#000000';
    const whiteRatio = calculateContrastRatio(backgroundColor, white);
    const blackRatio = calculateContrastRatio(backgroundColor, black);
    if (whiteRatio >= WCAG_AA_RATIO && whiteRatio >= blackRatio) {
        return { color: white, ratio: whiteRatio };
    }
    if (blackRatio >= WCAG_AA_RATIO) {
        return { color: black, ratio: blackRatio };
    }
    // Neither meets requirements, return the better one
    return whiteRatio >= blackRatio
        ? { color: white, ratio: whiteRatio }
        : { color: black, ratio: blackRatio };
}
/**
 * Calculate dynamic font size based on text length
 */
export function calculateFontSize(text, config, maxWidth) {
    const charCount = text.length;
    // Estimate character width (rough approximation)
    // Average character width is about 0.5 * fontSize for most fonts
    const estimatedCharWidth = config.default * 0.5;
    const estimatedWidth = charCount * estimatedCharWidth;
    if (estimatedWidth <= maxWidth) {
        return config.default;
    }
    // Scale down to fit
    const scaleFactor = maxWidth / estimatedWidth;
    const newSize = Math.floor(config.default * scaleFactor);
    // Clamp to min/max
    return Math.max(config.min, Math.min(config.max, newSize));
}
/**
 * Determine reading pattern based on format and content structure
 */
function determineReadingPattern(format, hasVisualElement) {
    // Z-pattern works well for story format with visual hierarchy
    // F-pattern works well for text-heavy square/portrait ads
    if (format === 'story') {
        return 'z-pattern';
    }
    return 'f-pattern';
}
/**
 * Calculate element position based on reading pattern
 */
function calculateTextPositions(format, safeZone, width, height, readingPattern) {
    const contentWidth = width - safeZone.left - safeZone.right;
    if (readingPattern === 'z-pattern') {
        // Z-pattern: Top-left → Top-right → Bottom-right
        return {
            headline: {
                x: safeZone.left,
                y: safeZone.top + 20,
            },
            subhead: {
                x: safeZone.left,
                y: safeZone.top + 70,
            },
            cta: {
                x: width - safeZone.right - 150, // Right-aligned
                y: height - safeZone.bottom - 20,
            },
        };
    }
    else {
        // F-pattern: Top-left emphasis, vertical scan
        return {
            headline: {
                x: safeZone.left,
                y: safeZone.top + 20,
            },
            subhead: {
                x: safeZone.left,
                y: safeZone.top + 70,
            },
            cta: {
                x: safeZone.left + (contentWidth - 120) / 2, // Centered
                y: height - safeZone.bottom - 20,
            },
        };
    }
}
/**
 * Calculate logo position (always top-right or bottom-right, never center)
 */
function calculateLogoPosition(format, safeZone, width, logoWidth = 80) {
    // Prefer top-right for most formats
    return {
        x: width - safeZone.right - logoWidth,
        y: safeZone.top,
    };
}
/**
 * Generate complete layout for an ad
 */
export function generateLayout(format, headline, subhead, cta, backgroundColor, accentColor, hasVisualElement = true) {
    // Normalize format
    const adFormat = format === 'story' || format === '9:16'
        ? 'story'
        : format === 'portrait' || format === '4:5'
            ? 'portrait'
            : 'square';
    const formatConfig = FORMAT_CONFIGS[adFormat];
    const safeZone = SAFE_ZONES[adFormat];
    const width = formatConfig.width;
    const height = formatConfig.height;
    // Determine reading pattern
    const readingPattern = determineReadingPattern(adFormat, hasVisualElement);
    // Calculate text positions
    const positions = calculateTextPositions(adFormat, safeZone, width, height, readingPattern);
    // Calculate content width for font sizing
    const contentWidth = width - safeZone.left - safeZone.right;
    // Calculate dynamic font sizes
    const headlineFontSize = calculateFontSize(headline, FONT_SIZES.headline, contentWidth);
    const subheadFontSize = calculateFontSize(subhead, FONT_SIZES.subhead, contentWidth);
    const ctaFontSize = calculateFontSize(cta, FONT_SIZES.cta, 120); // CTA is usually in a button
    // Find accessible text colors
    const headlineColor = findAccessibleTextColor(backgroundColor);
    const subheadColor = findAccessibleTextColor(backgroundColor);
    // CTA typically on accent color background
    const ctaBgColor = accentColor;
    const ctaTextColor = findAccessibleTextColor(ctaBgColor);
    // Build element layouts
    const headlineLayout = {
        position: positions.headline,
        fontSize: headlineFontSize,
        width: contentWidth,
        height: headlineFontSize * 1.2,
        alignment: 'left',
    };
    const subheadLayout = {
        position: positions.subhead,
        fontSize: subheadFontSize,
        width: contentWidth,
        height: subheadFontSize * 1.2,
        alignment: 'left',
    };
    const ctaLayout = {
        position: positions.cta,
        fontSize: ctaFontSize,
        width: 120,
        height: 40,
        alignment: readingPattern === 'z-pattern' ? 'right' : 'center',
    };
    return {
        format: adFormat,
        width,
        height,
        safeZone,
        headline: headlineLayout,
        subhead: subheadLayout,
        cta: ctaLayout,
        logoPosition: calculateLogoPosition(adFormat, safeZone, width),
        textColors: {
            headline: headlineColor.color,
            subhead: subheadColor.color,
            cta: ctaTextColor.color,
            ctaBackground: ctaBgColor,
        },
        contrastRatios: {
            headline: headlineColor.ratio,
            subhead: subheadColor.ratio,
            cta: ctaTextColor.ratio,
        },
        readingPattern,
    };
}
/**
 * Validate layout meets all requirements
 */
export function validateLayout(layout) {
    const warnings = [];
    // Check contrast ratios
    if (layout.contrastRatios.headline < WCAG_AA_RATIO) {
        warnings.push(`Headline contrast ratio ${layout.contrastRatios.headline.toFixed(2)}:1 is below WCAG AA requirement of ${WCAG_AA_RATIO}:1`);
    }
    if (layout.contrastRatios.subhead < WCAG_AA_RATIO) {
        warnings.push(`Subhead contrast ratio ${layout.contrastRatios.subhead.toFixed(2)}:1 is below WCAG AA requirement of ${WCAG_AA_RATIO}:1`);
    }
    if (layout.contrastRatios.cta < WCAG_AA_RATIO) {
        warnings.push(`CTA contrast ratio ${layout.contrastRatios.cta.toFixed(2)}:1 is below WCAG AA requirement of ${WCAG_AA_RATIO}:1`);
    }
    // Check safe zone violations
    if (layout.headline.position.y < layout.safeZone.top) {
        warnings.push('Headline position violates top safe zone');
    }
    if (layout.cta.position.y + layout.cta.height > layout.height - layout.safeZone.bottom) {
        warnings.push('CTA position violates bottom safe zone');
    }
    return {
        valid: warnings.length === 0,
        warnings,
    };
}
/**
 * Adjust layout for visual weight balancing
 * If product image is on one side, offset text to the other
 */
export function balanceVisualWeight(layout, productImagePosition) {
    if (productImagePosition === 'center') {
        return layout; // No adjustment needed
    }
    const adjusted = { ...layout };
    const offset = productImagePosition === 'left' ? 100 : -100;
    // Shift text elements opposite to image position
    adjusted.headline = {
        ...layout.headline,
        position: {
            x: layout.headline.position.x + offset,
            y: layout.headline.position.y,
        },
    };
    adjusted.subhead = {
        ...layout.subhead,
        position: {
            x: layout.subhead.position.x + offset,
            y: layout.subhead.position.y,
        },
    };
    return adjusted;
}
