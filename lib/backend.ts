export type BackendSubnetSummary = {
  netuid: number
  subnet_name: string | null
  price: number | null
  tao_in_emission: number | null
  owner_coldkey: string | null
  alpha_in: number | null
  alpha_out: number | null
  tao_in: number | null
  n?: number | null
  block?: number | null
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://161.97.128.68:8000'

// Use proxy in browser on production to avoid mixed content issues
function getBackendUrl(path: string): string {
  // If we're in the browser and the page is HTTPS, use the proxy
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    return `/api/backend-proxy?path=${encodeURIComponent(path)}`
  }
  // Otherwise use direct backend URL (server-side or local dev)
  return `${BACKEND_URL}${path}`
}

export async function fetchSubnetSummaries(): Promise<Record<number, BackendSubnetSummary>> {
  const url = getBackendUrl('/subnets')
  const res = await fetch(url, { cache: 'no-store' })
  if (!res.ok) {
    throw new Error(`Failed to fetch subnets: ${res.status}`)
  }
  const data = await res.json()
  return data as Record<number, BackendSubnetSummary>
}

export async function fetchSubnetSummariesList(): Promise<BackendSubnetSummary[]> {
  const map = await fetchSubnetSummaries()
  return Object.values(map)
}


