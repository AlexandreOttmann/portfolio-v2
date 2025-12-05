<template>
    <div class="min-h-screen p-8 space-y-8">
        <div class="max-w-4xl mx-auto space-y-8">
            <!-- Header -->
            <div class="text-center space-y-4">
                <h1 class="text-4xl font-bold text-[var(--font-primary)]">
                    Theme System Test
                </h1>
                <p class="text-[var(--font-muted)]">
                    Toggle between light and dark modes to see the theme-aware components
                </p>
                <ThemeToggle />
            </div>

            <!-- Spotlight Effect -->
            <div class="relative h-64 rounded-2xl overflow-hidden border border-[var(--border-primary)]">
                <div class="absolute inset-0 bg-[var(--ui-bg)]" />
                <div
                    class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-64 rounded-full bg-[var(--spotlight)] blur-[120px]" />
                <div class="relative z-10 flex items-center justify-center h-full">
                    <div class="text-center">
                        <h2 class="text-2xl font-bold text-[var(--font-primary)]">
                            Spotlight Effect
                        </h2>
                        <p class="text-[var(--font-muted)]">
                            Should be dark in light mode, bright in dark mode
                        </p>
                    </div>
                </div>
            </div>

            <!-- Glass Effects -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-[var(--font-primary)]">
                    Glass Morphism Effects
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="glass-light p-6 rounded-xl border">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Light Glass
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            Subtle background with light border
                        </p>
                    </div>
                    <div class="glass-medium p-6 rounded-xl border">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Medium Glass
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            Medium opacity background
                        </p>
                    </div>
                    <div class="glass-strong p-6 rounded-xl border">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Strong Glass
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            More prominent background
                        </p>
                    </div>
                </div>
            </div>

            <!-- Overlay Effects -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-[var(--font-primary)]">
                    Overlay Effects
                </h2>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div class="overlay-light p-6 rounded-xl">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Light Overlay
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            Subtle overlay effect
                        </p>
                    </div>
                    <div class="overlay-medium p-6 rounded-xl">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Medium Overlay
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            Medium overlay effect
                        </p>
                    </div>
                    <div class="overlay-strong p-6 rounded-xl">
                        <h3 class="font-semibold text-[var(--font-primary)] mb-2">
                            Strong Overlay
                        </h3>
                        <p class="text-[var(--font-muted)] text-sm">
                            Prominent overlay effect
                        </p>
                    </div>
                </div>
            </div>

            <!-- Color Variables -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-[var(--font-primary)]">
                    Color Variables
                </h2>
                <div class="glass-light p-6 rounded-xl border space-y-3">
                    <div class="flex items-center justify-between">
                        <span class="text-[var(--font-primary)]">Primary Text</span>
                        <code class="text-xs bg-[var(--overlay-light)] px-2 py-1 rounded">
              var(--font-primary)
            </code>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[var(--font-muted)]">Muted Text</span>
                        <code class="text-xs bg-[var(--overlay-light)] px-2 py-1 rounded">
              var(--font-muted)
            </code>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[var(--font-primary)]">Main Background</span>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded border border-[var(--border-primary)] bg-[var(--ui-bg)]" />
                            <code class="text-xs bg-[var(--overlay-light)] px-2 py-1 rounded">
                var(--ui-bg)
              </code>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <span class="text-[var(--font-primary)]">Card Background</span>
                        <div class="flex items-center gap-2">
                            <div class="w-8 h-8 rounded border border-[var(--border-primary)] bg-[var(--bg-card)]" />
                            <code class="text-xs bg-[var(--overlay-light)] px-2 py-1 rounded">
                var(--bg-card)
              </code>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Interactive Example -->
            <div class="space-y-4">
                <h2 class="text-2xl font-bold text-[var(--font-primary)]">
                    Interactive Card
                </h2>
                <div
                    class="glass-light hover:glass-medium transition-all duration-300 p-6 rounded-xl border cursor-pointer group">
                    <h3 class="font-semibold text-[var(--font-primary)] mb-2 group-hover:text-[var(--font-primary)]">
                        Hover Over Me
                    </h3>
                    <p class="text-[var(--font-muted)] text-sm">
                        This card changes from light to medium glass on hover
                    </p>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// This is a test page to verify theme system is working correctly

</script>
