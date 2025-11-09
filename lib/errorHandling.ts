import toast from 'react-hot-toast'

export interface TransactionError {
  message: string
  code?: string | number
  reason?: string
}

/**
 * Parse and format error messages from various sources
 */
export function parseErrorMessage(error: any): string {
  // User rejected transaction
  if (error?.code === 'ACTION_REJECTED' || error?.code === 4001) {
    return 'Transaction rejected by user'
  }

  // Network errors
  if (error?.code === 'NETWORK_ERROR') {
    return 'Network error. Please check your connection and try again.'
  }

  // Insufficient funds
  if (error?.reason?.includes('insufficient funds') || error?.message?.includes('insufficient funds')) {
    return 'Insufficient funds for transaction'
  }

  // Gas estimation failed
  if (error?.reason?.includes('gas') || error?.message?.includes('gas')) {
    return 'Transaction may fail. Please check your inputs.'
  }

  // Contract custom errors
  if (error?.reason) {
    const customErrors: Record<string, string> = {
      'InvalidTimestamp': 'The deadline must be in the future',
      'InvalidPrice': 'Price must be greater than 0',
      'InvalidNetuid': 'Please select a valid subnet',
      'CardNotFound': 'This card does not exist',
      'CardAlreadyResolved': 'This card has already been resolved',
      'CardNotResolved': 'This card has not been resolved yet',
      'BettingPeriodEnded': 'The betting period has ended',
      'InsufficientBalance': 'Insufficient TAO balance',
      'InsufficientAllowance': 'Please approve TAO spending first',
      'NoSharesToPurchase': 'Must purchase at least one share',
      'NoSharesToRedeem': 'You have no shares to redeem',
      'ResolutionTimeNotReached': 'Resolution time has not been reached',
      'TransferFailed': 'Token transfer failed'
    }

    for (const [errorName, message] of Object.entries(customErrors)) {
      if (error.reason.includes(errorName)) {
        return message
      }
    }
    
    return error.reason
  }

  // Generic error message
  if (error?.message) {
    // Clean up common error message patterns
    const message = error.message
      .replace(/^Error: /i, '')
      .replace(/execution reverted:?/i, '')
      .trim()
    
    if (message.length > 0 && message.length < 200) {
      return message
    }
  }

  return 'An unexpected error occurred. Please try again.'
}

/**
 * Show error toast with formatted message
 */
export function showErrorToast(error: any, defaultMessage?: string) {
  const message = parseErrorMessage(error)
  toast.error(message || defaultMessage || 'An error occurred')
  console.error('Error:', error)
}

/**
 * Show success toast
 */
export function showSuccessToast(message: string) {
  toast.success(message)
}

/**
 * Show loading toast
 */
export function showLoadingToast(message: string) {
  return toast.loading(message)
}

/**
 * Dismiss a specific toast
 */
export function dismissToast(toastId: string) {
  toast.dismiss(toastId)
}

/**
 * Handle transaction lifecycle with toasts
 */
export async function handleTransaction<T>(
  transactionPromise: Promise<T>,
  messages: {
    loading: string
    success: string
    error?: string
  }
): Promise<T | null> {
  const loadingToast = showLoadingToast(messages.loading)
  
  try {
    const result = await transactionPromise
    dismissToast(loadingToast)
    showSuccessToast(messages.success)
    return result
  } catch (error) {
    dismissToast(loadingToast)
    showErrorToast(error, messages.error)
    return null
  }
}

