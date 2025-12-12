<script setup lang="ts">
import { marked } from 'marked'

// Configure marked for safe rendering
marked.setOptions({
    breaks: true,
    gfm: true,
})

const password = ref('')
const isAuthenticated = ref(false)
const interactions = ref<any[]>([])
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
    loading.value = true
    error.value = ''

    try {
        const data = await $fetch('/api/chat-logs', {
            query: { password: password.value }
        })
        interactions.value = data
        console.log(data)
        isAuthenticated.value = true
    } catch (e: any) {
        error.value = e.statusMessage || 'Invalid password or server error'
    } finally {
        loading.value = false
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'medium'
    })
}

const formatCost = (cost: number) => {
    if (cost === null || cost === undefined) return 'N/A'
    return `$${Number(cost).toFixed(6)}`
}

const renderMarkdown = (text: string): string => {
    if (!text) return ''
    return marked.parse(text) as string
}
</script>

<template>
    <div class="min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div class="max-w-4xl mx-auto">
            <h1 class="text-3xl font-serif font-light mb-8 text-center sm:text-left">
                Chat Interactions Log
            </h1>

            <!-- Login Form -->
            <div v-if="!isAuthenticated" class="flex flex-col items-center justify-center min-h-[40vh]">
                <UCard class="w-full max-w-sm">
                    <template #header>
                        <h3 class="text-xl font-medium">Access Restricted</h3>
                    </template>

                    <form @submit.prevent="handleLogin" class="space-y-4">
                        <UInput v-model="password" type="password" placeholder="Enter access password"
                            icon="i-heroicons-lock-closed" />


                        <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

                        <UButton class="mt-4" type="submit" color="primary" block :loading="loading">
                            Access Logs
                        </UButton>
                    </form>
                </UCard>
            </div>

            <!-- Logs List -->
            <div v-else class="space-y-6">
                <div v-if="interactions.length === 0" class="text-center text-gray-500 py-10">
                    No interactions recorded yet.
                </div>

                <TransitionGroup name="list" tag="div" class="space-y-4">
                    <UCard v-for="interaction in interactions" :key="interaction.id"
                        class="overflow-hidden transition-all duration-300 hover:ring-1 hover:ring-primary-500/50">
                        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <!-- Meta Info -->
                            <div
                                class="col-span-1 space-y-2 text-xs text-gray-500 dark:text-gray-400 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-800 pb-2 md:pb-0 md:pr-4">
                                <div class="flex justify-between md:block">
                                    <span class="font-semibold block">Date:</span>
                                    <span>{{ formatDate(interaction.created_at) }}</span>
                                </div>
                                <div class="flex justify-between md:block">
                                    <span class="font-semibold block">Cost:</span>
                                    <span class="text-green-600 dark:text-green-400">{{
                                        formatCost(interaction.estimated_cost)
                                    }}</span>
                                </div>
                                <div class="flex justify-between md:block">
                                    <span class="font-semibold block">Tokens:</span>
                                    <span>{{ interaction.total_tokens || 0 }} ({{ interaction.prompt_tokens }} / {{
                                        interaction.completion_token }})</span>
                                </div>
                                <div class="flex justify-between md:block">
                                    <span class="font-semibold block">ID:</span>
                                    <span class="font-mono">{{ interaction.id }}</span>
                                </div>
                            </div>

                            <!-- content -->
                            <div class="col-span-1 md:col-span-3 space-y-4">
                                <div class="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                    <div class="text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wider">User
                                        Prompt</div>
                                    <div class="whitespace-pre-wrap text-sm">{{ interaction.prompt }}</div>
                                </div>

                                <div
                                    class="bg-primary-50/50 dark:bg-primary-900/10 p-3 rounded-lg border border-primary-100 dark:border-primary-900/30">
                                    <div
                                        class="text-xs font-semibold text-primary-600 dark:text-primary-400 mb-1 uppercase tracking-wider">
                                        AI Response</div>
                                    <div class="text-sm text-gray-800 dark:text-gray-200 markdown-content"
                                        v-html="renderMarkdown(interaction.answer)" />
                                </div>
                            </div>
                        </div>
                    </UCard>
                </TransitionGroup>
            </div>
        </div>
    </div>
</template>

<style scoped>
.list-enter-active,
.list-leave-active {
    transition: all 0.5s ease;
}

.list-enter-from,
.list-leave-to {
    opacity: 0;
    transform: translateY(20px);
}

/* Markdown content styling */
.markdown-content :deep(p) {
    margin: 0.5em 0;
}

.markdown-content :deep(p:first-child) {
    margin-top: 0;
}

.markdown-content :deep(p:last-child) {
    margin-bottom: 0;
}

.markdown-content :deep(strong) {
    font-weight: 600;
    color: inherit;
}

.markdown-content :deep(ol),
.markdown-content :deep(ul) {
    margin: 0.5em 0;
    padding-left: 1.5em;
    list-style-type: disc;
}

.markdown-content :deep(ol) {
    list-style-type: decimal;
}

.markdown-content :deep(li) {
    margin: 0.25em 0;
}

.markdown-content :deep(a) {
    color: inherit;
    text-decoration: underline;
    text-decoration-color: rgba(0, 0, 0, 0.4);
    transition: all 0.2s ease;
}

.dark .markdown-content :deep(a) {
    text-decoration-color: rgba(255, 255, 255, 0.4);
}

.markdown-content :deep(a:hover) {
    text-decoration-color: currentColor;
}

.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
    font-weight: 600;
    margin: 0.75em 0 0.5em;
    color: inherit;
}

.markdown-content :deep(code) {
    background-color: rgba(0, 0, 0, 0.05);
    padding: 0.1em 0.3em;
    border-radius: 0.2em;
    font-family: monospace;
    font-size: 0.9em;
}

.dark .markdown-content :deep(code) {
    background-color: rgba(255, 255, 255, 0.1);
}

.markdown-content :deep(pre) {
    background-color: #1e1e1e;
    padding: 1em;
    border-radius: 0.5em;
    overflow-x: auto;
    margin: 0.5em 0;
}

.markdown-content :deep(pre code) {
    background-color: transparent;
    padding: 0;
    color: #d4d4d4;
    font-size: 0.9em;
}
</style>
