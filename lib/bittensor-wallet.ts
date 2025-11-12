/**
 * Bittensor Wallet Utilities
 * Supports both Polkadot (SS58) and EVM (H160) addresses
 * 
 * Bittensor supports dual addressing:
 * - SS58: Substrate/Polkadot format (e.g., 5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY)
 * - H160: Ethereum/EVM format (e.g., 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb)
 */

/**
 * Check if an address is a valid SS58 address
 * SS58 addresses start with a prefix (Bittensor uses prefix 42 for testnet, 0 for mainnet)
 */
export function isValidSS58Address(address: string): boolean {
  // SS58 addresses are base58 encoded and typically 47-48 characters
  const ss58Regex = /^[1-9A-HJ-NP-Za-km-z]{47,48}$/;
  return ss58Regex.test(address);
}

/**
 * Check if an address is a valid H160 (Ethereum) address
 */
export function isValidH160Address(address: string): boolean {
  // H160 addresses are 42 characters (0x + 40 hex chars)
  const h160Regex = /^0x[a-fA-F0-9]{40}$/;
  return h160Regex.test(address);
}

/**
 * Detect the address type
 */
export type AddressType = 'ss58' | 'h160' | 'invalid';

export function detectAddressType(address: string): AddressType {
  if (isValidH160Address(address)) {
    return 'h160';
  }
  if (isValidSS58Address(address)) {
    return 'ss58';
  }
  return 'invalid';
}

/**
 * Format an address for display (truncate middle)
 */
export function formatAddress(address: string, chars: number = 6): string {
  if (!address) return '';
  
  const type = detectAddressType(address);
  if (type === 'invalid') return address;
  
  if (type === 'h160') {
    // Format: 0x1234...5678
    return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
  } else {
    // Format SS58: 5Grwv...utQY
    return `${address.slice(0, chars)}...${address.slice(-chars)}`;
  }
}

/**
 * Validate and normalize address
 * Converts SS58 to lowercase-normalized format
 * Converts H160 to checksum format if possible
 */
export function normalizeAddress(address: string): string | null {
  const type = detectAddressType(address);
  
  if (type === 'invalid') {
    return null;
  }
  
  if (type === 'h160') {
    // Return lowercase normalized EVM address
    return address.toLowerCase();
  }
  
  // Return SS58 as-is (case-sensitive)
  return address;
}

/**
 * Get address display info
 */
export interface AddressInfo {
  address: string;
  type: AddressType;
  formatted: string;
  network: 'polkadot' | 'evm' | 'unknown';
}

export function getAddressInfo(address: string): AddressInfo {
  const type = detectAddressType(address);
  
  return {
    address,
    type,
    formatted: formatAddress(address),
    network: type === 'h160' ? 'evm' : type === 'ss58' ? 'polkadot' : 'unknown',
  };
}

/**
 * Convert between SS58 and H160 addresses
 * Note: This is a placeholder. Actual conversion requires:
 * - @polkadot/util-crypto for SS58 encoding/decoding
 * - Proper key derivation between substrate and ethereum accounts
 * 
 * For now, we'll just note that these are different address spaces
 * and can't be directly converted without the private key.
 */
export function convertAddress(address: string, targetType: 'ss58' | 'h160'): string | null {
  const sourceType = detectAddressType(address);
  
  if (sourceType === 'invalid') {
    return null;
  }
  
  if (sourceType === targetType) {
    return address;
  }
  
  // Note: Actual conversion between SS58 and H160 requires private key
  // or accessing the account's corresponding address on the other format.
  // This is not possible from address alone.
  console.warn(
    'Direct conversion between SS58 and H160 addresses is not possible without private key.',
    'Use the appropriate wallet (Polkadot.js for SS58, MetaMask for H160) for each format.'
  );
  
  return null;
}

/**
 * Get explorer URL for address
 */
export function getExplorerUrl(address: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  const type = detectAddressType(address);
  
  if (type === 'h160') {
    // EVM explorer
    return `https://evm.taostats.io/address/${address}`;
  } else if (type === 'ss58') {
    // Polkadot/Substrate explorer
    const explorerBase = network === 'testnet' 
      ? 'https://polkadot.js.org/apps/?rpc=wss://test.finney.opentensor.ai:443#/explorer'
      : 'https://polkadot.js.org/apps/?rpc=wss://entrypoint-finney.opentensor.ai:443#/explorer';
    return `${explorerBase}/query/${address}`;
  }
  
  return '';
}

/**
 * Check if user can interact with contract
 * EVM contracts require H160 addresses
 */
export function canInteractWithContract(userAddress: string): boolean {
  return detectAddressType(userAddress) === 'h160';
}

/**
 * Get helpful message for users with wrong address type
 */
export function getAddressTypeHelp(address: string): string {
  const type = detectAddressType(address);
  
  if (type === 'ss58') {
    return 'You have a Polkadot (SS58) address. To interact with smart contracts on Bittensor EVM, please use a wallet that supports EVM addresses (like MetaMask) or convert your account to an H160 address.';
  }
  
  if (type === 'h160') {
    return 'You have an EVM (H160) address and can interact with smart contracts.';
  }
  
  return 'Invalid address format. Please check your address.';
}

