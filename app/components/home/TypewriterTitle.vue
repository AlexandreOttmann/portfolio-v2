<template>
    <span>
        <span class="sr-only">
            <slot />
        </span>
        <span aria-hidden="true">{{ displayedText }}</span><span class="animate-pulse">|</span>
    </span>
</template>

<script setup lang="ts">
const slots = useSlots()
const displayedText = ref('')

onMounted(() => {
    // Extract text from slot
    const content = slots.default?.()?.[0]?.children?.toString()
    console.log('content', typeof content, content)
    const fullText = typeof content === 'string' ? content : ''

    if (!fullText) return

    // Split by sentences (dot followed by space or end of string)
    const sentences = fullText.match(/[^.]+[.]?/g) || [fullText]

    let currentSentenceIndex = 0
    let currentCharIndex = 0

    const type = () => {
        console.log('currentSentenceIndex', currentSentenceIndex, sentences.length)
        if (currentSentenceIndex >= sentences.length) return
        const currentSentence = sentences[currentSentenceIndex]
        if (!currentSentence) return

        if (currentCharIndex < currentSentence.length) {
            displayedText.value += currentSentence[currentCharIndex]
            currentCharIndex++
            setTimeout(type, 50 + Math.random() * 30) // Random typing speed
        } else {
            // Sentence finished
            currentSentenceIndex++
            currentCharIndex = 0
            if (currentSentenceIndex < sentences.length) {
                setTimeout(type, 500) // Pause between sentences
            }
        }
        console.log('displayedText', displayedText.value)
    }
    type()
    // Start typing after a small initial delay
    setTimeout(() => type(), 500)
})
</script>
