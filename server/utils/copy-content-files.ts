import { promises as fs } from 'node:fs'
import { join, relative, dirname } from 'node:path'

/**
 * Recursively walks a directory and returns all file paths
 */
async function walkDirectory(dir: string, fileList: string[] = []): Promise<string[]> {
    const files = await fs.readdir(dir, { withFileTypes: true })

    for (const file of files) {
        const filePath = join(dir, file.name)
        if (file.isDirectory()) {
            await walkDirectory(filePath, fileList)
        } else {
            fileList.push(filePath)
        }
    }

    return fileList
}

/**
 * Copies content files from source directories to the Nitro storage directory
 * @param sourceDir - Base content directory (e.g., './content')
 * @param targetDir - Target directory in .data/cache (e.g., './.data/cache/content')
 * @param subdirs - List of subdirectories to copy (e.g., ['en', 'fr', 'ai-context.md'])
 */
export async function copyContentFiles(
    sourceDir: string,
    targetDir: string,
    subdirs: string[] = []
): Promise<void> {
    try {
        console.log(`[Content Copy] Starting copy from ${sourceDir} to ${targetDir}`)

        // Ensure target directory exists
        await fs.mkdir(targetDir, { recursive: true })

        // If no subdirs specified, copy everything
        if (subdirs.length === 0) {
            const allFiles = await walkDirectory(sourceDir)

            for (const sourceFile of allFiles) {
                const relativePath = relative(sourceDir, sourceFile)
                const targetFile = join(targetDir, relativePath)

                // Ensure target subdirectory exists
                await fs.mkdir(dirname(targetFile), { recursive: true })

                // Copy file
                await fs.copyFile(sourceFile, targetFile)
                console.log(`[Content Copy] Copied: ${relativePath}`)
            }
        } else {
            // Copy only specified subdirectories/files
            for (const subdir of subdirs) {
                const sourcePath = join(sourceDir, subdir)
                const targetPath = join(targetDir, subdir)

                try {
                    const stat = await fs.stat(sourcePath)

                    if (stat.isDirectory()) {
                        // Copy entire directory
                        const files = await walkDirectory(sourcePath)

                        for (const sourceFile of files) {
                            const relativePath = relative(sourcePath, sourceFile)
                            const targetFile = join(targetPath, relativePath)

                            // Ensure target subdirectory exists
                            await fs.mkdir(dirname(targetFile), { recursive: true })

                            // Copy file
                            await fs.copyFile(sourceFile, targetFile)
                            console.log(`[Content Copy] Copied: ${subdir}/${relativePath}`)
                        }
                    } else {
                        // Copy single file
                        await fs.mkdir(dirname(targetPath), { recursive: true })
                        await fs.copyFile(sourcePath, targetPath)
                        console.log(`[Content Copy] Copied: ${subdir}`)
                    }
                } catch (error: any) {
                    console.warn(`[Content Copy] Failed to copy ${subdir}:`, error.message)
                }
            }
        }

        console.log('[Content Copy] Content copy completed successfully')
    } catch (error) {
        console.error('[Content Copy] Error copying content files:', error)
        throw error
    }
}
