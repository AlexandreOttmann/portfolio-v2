<template>
  <div>
    <SettingsLanguageToggle class="fixed right-8 z-50 top-1" />
    <ThemeToggle class="fixed right-2 z-55 top-4" />
    <LayoutNavbar class="fixed bottom-21 z-50 flex sm:bottom-auto sm:top-0" />
    <slot />
    <LayoutFooter />
  </div>
</template>
