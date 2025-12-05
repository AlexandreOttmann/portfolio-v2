<script setup lang="ts">
const props = defineProps<{
    modelValue: boolean
}>()

const emit = defineEmits<{
    'update:modelValue': [value: boolean]
}>()

function setGridView() {
    emit('update:modelValue', false)
}

function setCanvasView() {
    emit('update:modelValue', true)
}
</script>

<template>
    <div class="view-toggle-container">
        <button @click="setGridView" :class="['view-toggle-btn', { 'active': !modelValue }]" aria-label="Grid View">
            <svg class="view-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="7" height="7" rx="1" />
                <rect x="14" y="3" width="7" height="7" rx="1" />
                <rect x="3" y="14" width="7" height="7" rx="1" />
                <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span class="view-toggle-label">Grid</span>
        </button>

        <button @click="setCanvasView" :class="['view-toggle-btn', { 'active': modelValue }]" aria-label="Canvas View">
            <svg class="view-toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="5" r="2" />
                <circle cx="5" cy="12" r="2" />
                <circle cx="19" cy="12" r="2" />
                <circle cx="9" cy="19" r="2" />
                <circle cx="15" cy="19" r="2" />
                <line x1="12" y1="7" x2="11" y2="10" />
                <line x1="10" y1="12" x2="7" y2="12" />
                <line x1="14" y1="12" x2="17" y2="12" />
                <line x1="11" y1="14" x2="10" y2="17" />
                <line x1="13" y1="14" x2="14" y2="17" />
            </svg>
            <span class="view-toggle-label">Canvas</span>
        </button>

        <div class="view-toggle-slider" :style="{ transform: modelValue ? 'translateX(100%)' : 'translateX(0)' }" />
    </div>
</template>

<style scoped>
.view-toggle-container {
    position: relative;
    display: inline-flex;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 4px;
    box-shadow:
        0 4px 6px -1px rgba(0, 0, 0, 0.1),
        0 2px 4px -1px rgba(0, 0, 0, 0.06),
        inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
}

.view-toggle-btn {
    position: relative;
    z-index: 2;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: transparent;
    border: none;
    border-radius: 8px;
    color: rgba(255, 255, 255, 0.6);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    user-select: none;
    -webkit-tap-highlight-color: transparent;
}

.view-toggle-btn:hover {
    color: rgba(255, 255, 255, 0.9);
}

.view-toggle-btn.active {
    color: rgba(255, 255, 255, 1);
}

.view-toggle-icon {
    width: 18px;
    height: 18px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.view-toggle-btn:hover .view-toggle-icon {
    transform: scale(1.1);
}

.view-toggle-btn.active .view-toggle-icon {
    transform: scale(1.05);
}

.view-toggle-label {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    letter-spacing: 0.02em;
}

.view-toggle-slider {
    position: absolute;
    top: 4px;
    left: 4px;
    bottom: 4px;
    width: calc(50% - 4px);
    background: linear-gradient(90deg,
            #ff0080,
            #ff8c00,
            #40e0d0,
            #4169e1,
            #9370db,
            #ff1493,
            #ff0080);
    background-size: 200% 100%;
    opacity: 0.5;
    animation: rainbow-slide 3s linear infinite;
    border-radius: 8px;
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    box-shadow:
        0 4px 6px -1px rgba(255, 0, 128, 0.3),
        0 2px 4px -1px rgba(255, 140, 0, 0.2);
    z-index: 1;
}

/* Rainbow gradient animation */
@keyframes rainbow-slide {
    0% {
        background-position: 0% 50%;
    }

    100% {
        background-position: 200% 50%;
    }
}

/* Responsive adjustments */
@media (max-width: 640px) {
    .view-toggle-label {
        display: none;
    }

    .view-toggle-btn {
        padding: 10px 16px;
    }
}

/* Dark mode enhancements */
@media (prefers-color-scheme: dark) {
    .view-toggle-container {
        background: rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.15);
    }
}

/* Animation for view transitions */
@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(-10px);
    }

    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.view-toggle-container {
    animation: fadeIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
</style>
