'use client'

import { useEffect, useRef } from 'react'
import { settingsApi } from '@/lib/api'

type LogoHeader = { logoUrl: string; logoDarkUrl: string }

export function useContractCompanyLogo<T extends { header: LogoHeader }>(
    blocks: T,
    onBlocksChange: (blocks: T) => void,
) {
    const blocksRef = useRef(blocks)
    const onBlocksChangeRef = useRef(onBlocksChange)

    useEffect(() => { blocksRef.current = blocks }, [blocks])
    useEffect(() => { onBlocksChangeRef.current = onBlocksChange }, [onBlocksChange])

    useEffect(() => {
        let cancelled = false
        settingsApi.getCompany().then((company) => {
            if (cancelled) return
            const logoUrl = company.logoLight || company.logo || ''
            const logoDarkUrl = company.logoDark || ''
            const current = blocksRef.current
            if (current.header.logoUrl === logoUrl && current.header.logoDarkUrl === logoDarkUrl) return
            onBlocksChangeRef.current({
                ...current,
                header: { ...current.header, logoUrl, logoDarkUrl },
            })
        }).catch(() => {})
        return () => { cancelled = true }
    }, [])
}
