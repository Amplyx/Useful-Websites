import QRCode from 'qrcode';

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H';

export interface QRCodeOptions {
  size: number;
  foregroundColor: string;
  backgroundColor: string;
  errorCorrectionLevel: ErrorCorrectionLevel;
  margin: number;
}

/**
 * Generate QR code as data URL (PNG format)
 */
export async function generateQRCodePNG(
  text: string,
  options: QRCodeOptions
): Promise<string> {
  try {
    const canvas = document.createElement('canvas');
    await QRCode.toCanvas(canvas, text, {
      width: options.size,
      margin: options.margin,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor,
      },
      errorCorrectionLevel: options.errorCorrectionLevel,
    });
    
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating QR code PNG:', error);
    throw new Error('Failed to generate QR code PNG');
  }
}

/**
 * Generate QR code as SVG string
 */
export async function generateQRCodeSVG(
  text: string,
  options: QRCodeOptions
): Promise<string> {
  try {
    const svg = await QRCode.toString(text, {
      type: 'svg',
      width: options.size,
      margin: options.margin,
      color: {
        dark: options.foregroundColor,
        light: options.backgroundColor,
      },
      errorCorrectionLevel: options.errorCorrectionLevel,
    });
    
    return svg;
  } catch (error) {
    console.error('Error generating QR code SVG:', error);
    throw new Error('Failed to generate QR code SVG');
  }
}

/**
 * Validate QR code content
 */
export function validateQRContent(content: string): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!content.trim()) {
    errors.push('Content cannot be empty');
  }
  
  // QR codes have a maximum capacity depending on the error correction level
  // For safe measure, we'll limit to 2000 characters for mixed content
  if (content.length > 2000) {
    errors.push('Content is too long (maximum 2000 characters)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate URL format
 */
export function validateURL(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    // If URL constructor fails, try with http:// prefix
    try {
      new URL(`http://${url}`);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Normalize URL (add protocol if missing)
 */
export function normalizeURL(url: string): string {
  try {
    new URL(url);
    return url;
  } catch {
    return `http://${url}`;
  }
}