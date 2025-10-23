/**
 * Copy text to clipboard using the Clipboard API
 * Falls back to legacy method if Clipboard API is not available
 */
export async function copyToClipboard(text: string): Promise<void> {
  try {
    // Try modern Clipboard API first
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return;
    }
    
    // Fallback for older browsers or non-secure contexts
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    
    if (!successful) {
      throw new Error('Failed to copy text');
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    throw new Error('Failed to copy to clipboard');
  }
}

/**
 * Check if clipboard functionality is available
 */
export function isClipboardSupported(): boolean {
  return !!(navigator.clipboard || document.execCommand);
}