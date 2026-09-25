/**
 * @fileoverview Nuxt module for plasma-ui: liquid-glass surfaces rendered in WebGL2
 * on one shared canvas behind the DOM. Vue port of @cruxgarden/plasma-ui.
 */

import { defineNuxtModule, createResolver, addComponent, addImports } from '@nuxt/kit'

export default defineNuxtModule({
  meta: {
    name: 'plasma-ui',
    configKey: 'plasmaUi',
  },
  setup(_options, nuxt) {
    const resolver = createResolver(import.meta.url)

    nuxt.options.css.push(resolver.resolve('./plasma.css'))

    addComponent({ name: 'PlasmaProvider', filePath: resolver.resolve('./components/PlasmaProvider.vue') })
    addComponent({ name: 'Plasma', filePath: resolver.resolve('./components/Plasma.vue') })

    addImports([
      { name: 'usePlasmaRuntime', from: resolver.resolve('./composables/usePlasma') },
      { name: 'usePlasmaDefaults', from: resolver.resolve('./composables/usePlasma') },
    ])
  },
})
