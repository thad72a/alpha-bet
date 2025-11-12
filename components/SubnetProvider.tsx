'use client'

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { fetchSubnetSummaries, type BackendSubnetSummary } from '@/lib/backend'

type SubnetContextValue = {
  summaries: Record<number, BackendSubnetSummary>
  lastUpdated: number | null
  refresh: () => Promise<void>
}

const SubnetContext = createContext<SubnetContextValue | undefined>(undefined)

export function SubnetProvider({ children, refreshMs = 30000 }: { children: React.ReactNode; refreshMs?: number }) {
  const [summaries, setSummaries] = useState<Record<number, BackendSubnetSummary>>({})
  const [lastUpdated, setLastUpdated] = useState<number | null>(null)

  const refresh = async () => {
    try {
      const data = await fetchSubnetSummaries()
      setSummaries(data)
      setLastUpdated(Date.now())
    } catch (e) {
      // swallow errors; consumers can show stale data
    }
  }

  useEffect(() => {
    let mounted = true
    ;(async () => {
      await refresh()
    })()
    const id = setInterval(() => {
      if (mounted) void refresh()
    }, refreshMs)
    return () => {
      mounted = false
      clearInterval(id)
    }
  }, [refreshMs])

  const value = useMemo(() => ({ summaries, lastUpdated, refresh }), [summaries, lastUpdated])
  return <SubnetContext.Provider value={value}>{children}</SubnetContext.Provider>
}

export function useSubnetSummaries() {
  const ctx = useContext(SubnetContext)
  if (!ctx) throw new Error('useSubnetSummaries must be used within SubnetProvider')
  return ctx
}

export function useSubnet(netuid: number) {
  const { summaries } = useSubnetSummaries()
  return summaries[netuid]
}


