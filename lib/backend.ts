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

export async function fetchSubnetSummaries(): Promise<Record<number, BackendSubnetSummary>> {
  const res = await fetch(`${BACKEND_URL}/subnets`, { cache: 'no-store' })
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


