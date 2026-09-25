import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: true,
  },
})
  .override('nuxt/vue/rules', {
    rules: {
      'vue/multi-word-component-names': 'off',
    },
  })
  // Vendored verbatim from @cruxgarden/plasma-ui; kept untouched so upstream updates stay a plain copy.
  .append({ ignores: ['modules/plasma-ui/core/**'] })
