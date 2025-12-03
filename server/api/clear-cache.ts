import { clearStorageContentCache } from '../utils/storage-content-loader'

export default defineEventHandler(async () => {
    clearStorageContentCache()
    return {
        success: true,
        message: 'Storage content cache cleared successfully',
    }
})
