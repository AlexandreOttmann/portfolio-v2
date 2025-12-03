import { promises as fs } from 'node:fs'
import { join, relative } from 'node:path'
import { defineNitroPlugin } from 'nitropack/runtime'

/**
 * Nitro plugin to copy content files to server storage during build
 * This makes content accessible via useStorage() API in serverless environments
 */
export default defineNitroPlugin(async (nitroApp) => {
    // Only run during build, not at runtime
    if (process.env.NODE_ENV === 'production' && !process.dev) {
        console.log('[Content Copy] Skipping content copy in production runtime')
        return
    }

    console.log('[Content Copy] Plugin loaded')
})
