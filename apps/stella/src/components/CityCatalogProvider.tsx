'use client'

import { createContext, type ReactNode, useContext, useMemo } from 'react'

import { type CityCatalog, type CityCatalogData, createCityCatalog } from '@/lib/cities'

const CityCatalogContext = createContext<CityCatalog | null>(null)

export default function CityCatalogProvider({ children, data }: { children: ReactNode; data: CityCatalogData }) {
  const catalog = useMemo(() => createCityCatalog(data), [data])

  return <CityCatalogContext value={catalog}>{children}</CityCatalogContext>
}

export function useCityCatalog(): CityCatalog {
  const catalog = useContext(CityCatalogContext)

  if (!catalog) {
    throw new Error('useCityCatalog must be used within CityCatalogProvider')
  }

  return catalog
}
