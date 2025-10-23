/**
 * Simple toast notification system for user feedback
 */

export interface ToastOptions {
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in milliseconds
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export interface Toast {
  id: string;
  message: string;
  type: ToastOptions['type'];
  duration: number;
  timestamp: number;
}

// Global toast container management
let toastContainer: HTMLElement | null = null;
let toastCounter = 0;

/**
 * Create or get the toast container
 */
function getToastContainer(position: ToastOptions['position'] = 'top-right'): HTMLElement {
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.className = getContainerClasses(position);
    document.body.appendChild(toastContainer);
  }
  return toastContainer;
}

/**
 * Get CSS classes for toast container based on position
 */
function getContainerClasses(position: ToastOptions['position']): string {
  const baseClasses = 'fixed z-50 flex flex-col gap-2 p-4 pointer-events-none';
  
  switch (position) {
    case 'top-left':
      return `${baseClasses} top-0 left-0`;
    case 'bottom-right':
      return `${baseClasses} bottom-0 right-0`;
    case 'bottom-left':
      return `${baseClasses} bottom-0 left-0`;
    case 'top-right':
    default:
      return `${baseClasses} top-0 right-0`;
  }
}

/**
 * Get CSS classes for toast based on type
 */
function getToastClasses(type: ToastOptions['type']): string {
  const baseClasses = 'pointer-events-auto max-w-md w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg border transform transition-all duration-300 ease-in-out';
  
  switch (type) {
    case 'success':
      return `${baseClasses} border-green-200 dark:border-green-800`;
    case 'error':
      return `${baseClasses} border-red-200 dark:border-red-800`;
    case 'warning':
      return `${baseClasses} border-yellow-200 dark:border-yellow-800`;
    case 'info':
    default:
      return `${baseClasses} border-blue-200 dark:border-blue-800`;
  }
}

/**
 * Get icon for toast type
 */
function getToastIcon(type: ToastOptions['type']): string {
  switch (type) {
    case 'success':
      return `<svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
      </svg>`;
    case 'error':
      return `<svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>`;
    case 'warning':
      return `<svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
      </svg>`;
    case 'info':
    default:
      return `<svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
      </svg>`;
  }
}

/**
 * Create toast element
 */
function createToastElement(toast: Toast): HTMLElement {
  const toastElement = document.createElement('div');
  toastElement.id = `toast-${toast.id}`;
  toastElement.className = getToastClasses(toast.type);
  
  toastElement.innerHTML = `
    <div class="flex items-start p-4">
      <div class="flex-shrink-0">
        ${getToastIcon(toast.type)}
      </div>
      <div class="ml-3 flex-1 min-w-0">
        <p class="text-sm font-medium text-gray-900 dark:text-gray-100">
          ${toast.message}
        </p>
      </div>
      <div class="ml-4 flex-shrink-0 flex">
        <button class="inline-flex text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500" onclick="this.parentElement.parentElement.parentElement.remove()">
          <span class="sr-only">Close</span>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
    </div>
  `;
  
  // Add animation classes
  toastElement.style.transform = 'translateX(100%)';
  toastElement.style.opacity = '0';
  
  return toastElement;
}

/**
 * Show toast notification
 */
export function showToast(message: string, options: ToastOptions = { type: 'info' }): string {
  const toast: Toast = {
    id: (++toastCounter).toString(),
    message,
    type: options.type,
    duration: options.duration || 4000,
    timestamp: Date.now()
  };
  
  const container = getToastContainer(options.position);
  const toastElement = createToastElement(toast);
  
  container.appendChild(toastElement);
  
  // Trigger animation
  requestAnimationFrame(() => {
    toastElement.style.transform = 'translateX(0)';
    toastElement.style.opacity = '1';
  });
  
  // Auto-remove after duration
  setTimeout(() => {
    removeToast(toast.id);
  }, toast.duration);
  
  return toast.id;
}

/**
 * Remove toast by ID
 */
export function removeToast(id: string): void {
  const toastElement = document.getElementById(`toast-${id}`);
  if (toastElement) {
    toastElement.style.transform = 'translateX(100%)';
    toastElement.style.opacity = '0';
    
    setTimeout(() => {
      if (toastElement.parentNode) {
        toastElement.parentNode.removeChild(toastElement);
      }
    }, 300);
  }
}

/**
 * Clear all toasts
 */
export function clearAllToasts(): void {
  if (toastContainer) {
    toastContainer.innerHTML = '';
  }
}

/**
 * Convenience methods for different toast types
 */
export const toast = {
  success: (message: string, options?: Omit<ToastOptions, 'type'>) => 
    showToast(message, { ...options, type: 'success' }),
  
  error: (message: string, options?: Omit<ToastOptions, 'type'>) => 
    showToast(message, { ...options, type: 'error' }),
  
  warning: (message: string, options?: Omit<ToastOptions, 'type'>) => 
    showToast(message, { ...options, type: 'warning' }),
  
  info: (message: string, options?: Omit<ToastOptions, 'type'>) => 
    showToast(message, { ...options, type: 'info' })
};