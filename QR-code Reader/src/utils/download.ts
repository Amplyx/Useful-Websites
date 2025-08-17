/**
 * Download content as a file
 */
export function downloadFile(content: string | Blob, filename: string, mimeType: string) {
  const blob = content instanceof Blob ? content : new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the blob URL
  URL.revokeObjectURL(url);
}

/**
 * Download PNG from data URL
 */
export function downloadPNG(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = `${filename}.png`;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Download SVG content
 */
export function downloadSVG(svgContent: string, filename: string) {
  downloadFile(svgContent, `${filename}.svg`, 'image/svg+xml');
}

/**
 * Sanitize filename to remove invalid characters
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[<>:"/\\|?*]/g, '') // Remove invalid characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim();
}