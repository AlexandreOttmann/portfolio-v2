import { clearContentCache } from '../utils/content-loader'

export default defineEventHandler(async () => {
    clearContentCache()
    return {
        success: true,
        message: 'Content cache cleared successfully',
    }
})
