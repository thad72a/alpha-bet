import { SubnetData } from '@/types/subnet'

// Mock data for now - in production, this would fetch from Bittensor API
export async function getSubnetData(): Promise<SubnetData[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  return [
    {
      netuid: 1,
      name: "Text Prompting",
      alphaPrice: 0.0234,
      validatorCount: 64,
      minerCount: 1024,
      totalStake: 125000,
      emissionRate: 0.15,
      lastUpdate: Date.now()
    },
    {
      netuid: 2,
      name: "Image Generation",
      alphaPrice: 0.0187,
      validatorCount: 32,
      minerCount: 512,
      totalStake: 89000,
      emissionRate: 0.12,
      lastUpdate: Date.now()
    },
    {
      netuid: 3,
      name: "Data Scraping",
      alphaPrice: 0.0156,
      validatorCount: 48,
      minerCount: 768,
      totalStake: 67000,
      emissionRate: 0.08,
      lastUpdate: Date.now()
    },
    {
      netuid: 4,
      name: "Machine Translation",
      alphaPrice: 0.0123,
      validatorCount: 24,
      minerCount: 384,
      totalStake: 45000,
      emissionRate: 0.06,
      lastUpdate: Date.now()
    },
    {
      netuid: 5,
      name: "Audio Processing",
      alphaPrice: 0.0098,
      validatorCount: 16,
      minerCount: 256,
      totalStake: 32000,
      emissionRate: 0.04,
      lastUpdate: Date.now()
    },
    {
      netuid: 6,
      name: "Video Analysis",
      alphaPrice: 0.0076,
      validatorCount: 12,
      minerCount: 192,
      totalStake: 28000,
      emissionRate: 0.03,
      lastUpdate: Date.now()
    }
  ]
}

export async function getSubnetAlphaPrice(netuid: number): Promise<number> {
  // In production, this would fetch real-time price data
  const subnets = await getSubnetData()
  const subnet = subnets.find(s => s.netuid === netuid)
  return subnet?.alphaPrice || 0
}

export function formatTAO(amount: number): string {
  return `${amount.toFixed(4)} TAO`
}

export function formatTimestamp(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleString()
}


