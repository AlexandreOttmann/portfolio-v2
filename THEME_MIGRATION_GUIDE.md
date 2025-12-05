# Theme Migration Guide

This guide explains how to migrate your components from hardcoded colors to theme-aware styles that work with both light and dark modes.

## Problem

Components using hardcoded colors like `bg-white/25`, `bg-white/10`, etc., don't adapt when switching between light and dark themes.

## Solution Overview

We've implemented a comprehensive theme system with:

1. **CSS Custom Properties** - Variables that change based on the active theme
2. **Utility Classes** - Reusable classes for common patterns
3. **Tailwind Integration** - Works seamlessly with Nuxt UI and Tailwind CSS v4

## Available Theme Variables

### Core Colors

```css
/* Use these in your components */
var(--ui-bg)              /* Main background */
var(--bg-secondary)       /* Secondary background */
var(--bg-card)            /* Card background */
var(--bg-card-hover)      /* Card hover state */

var(--font-primary)       /* Primary text color */
var(--font-muted)         /* Muted text color */
var(--font-inverted)      /* Inverted text (for buttons, etc.) */

var(--border-primary)     /* Primary border color */
var(--border-primary-hover) /* Border hover state */
var(--border-muted)       /* Muted border */
```

### Glass Morphism Effects

```css
var(--glass-light)        /* Light glass background */
var(--glass-medium)       /* Medium glass background */
var(--glass-strong)       /* Strong glass background */

var(--glass-border-light)   /* Light glass border */
var(--glass-border-medium)  /* Medium glass border */
var(--glass-border-strong)  /* Strong glass border */
```

### Overlay Effects

```css
var(--overlay-light)      /* Light overlay */
var(--overlay-medium)     /* Medium overlay */
var(--overlay-strong)     /* Strong overlay */
```

### Special Effects

```css
var(--spotlight)          /* Spotlight/glow effect */
```

## Utility Classes

Instead of using inline CSS variables, you can use these pre-built classes:

```vue
<!-- Glass effects -->
<div class="glass-light">Light glass effect</div>
<div class="glass-medium">Medium glass effect</div>
<div class="glass-strong">Strong glass effect</div>

<!-- Overlay effects -->
<div class="overlay-light">Light overlay</div>
<div class="overlay-medium">Medium overlay</div>
<div class="overlay-strong">Strong overlay</div>
```

## Migration Examples

### Example 1: Spotlight Effect

**Before:**
```vue
<div class="bg-white/25 blur-[120px]" />
```

**After:**
```vue
<div class="bg-[var(--spotlight)] blur-[120px]" />
```

### Example 2: Glass Card

**Before:**
```vue
<div class="border border-white/10 bg-white/5 hover:bg-white/10">
  Card content
</div>
```

**After (Option 1 - Using utility class):**
```vue
<div class="glass-light hover:glass-medium">
  Card content
</div>
```

**After (Option 2 - Using CSS variables):**
```vue
<div class="border border-[var(--glass-border-light)] bg-[var(--glass-light)] hover:bg-[var(--glass-medium)]">
  Card content
</div>
```

### Example 3: Button with Overlay

**Before:**
```vue
<button class="bg-white/10 hover:bg-white/20">
  Click me
</button>
```

**After:**
```vue
<button class="overlay-light hover:overlay-medium">
  Click me
</button>
```

### Example 4: Complex Component

**Before:**
```vue
<div class="border border-white/10 bg-white/5 p-4">
  <div class="bg-white/10 p-2">
    <span class="text-white/60">Muted text</span>
  </div>
</div>
```

**After:**
```vue
<div class="glass-light p-4">
  <div class="overlay-light p-2">
    <span class="text-[var(--font-muted)]">Muted text</span>
  </div>
</div>
```

## Migration Strategy

### Step 1: Identify Hardcoded Colors

Search for patterns like:
- `bg-white/XX`
- `border-white/XX`
- `text-white/XX`
- `bg-black/XX`

### Step 2: Choose Replacement

For each occurrence, decide:

1. **Is it a glass effect?** → Use `.glass-light`, `.glass-medium`, or `.glass-strong`
2. **Is it an overlay?** → Use `.overlay-light`, `.overlay-medium`, or `.overlay-strong`
3. **Is it a special effect?** → Use `var(--spotlight)` or other specific variables
4. **Is it text?** → Use `var(--font-primary)`, `var(--font-muted)`, etc.

### Step 3: Replace and Test

Replace the hardcoded value and test in both light and dark modes.

## Components to Update

Based on the codebase scan, these components need updating:

- ✅ `app/components/content/Home.vue` - **Already updated**
- `app/components/SpotlightButton.vue`
- `app/components/home/Faq.vue`
- `app/components/about/ProfilePicture.vue`
- `app/components/home/AiChat.vue`
- `app/components/project/Card.vue`

## Testing

After migration, test each component:

1. **Dark Mode** - Verify it looks correct (should look the same as before)
2. **Light Mode** - Verify colors are appropriate and readable
3. **Theme Toggle** - Verify smooth transitions between themes

## Tips

1. **Use utility classes when possible** - They're cleaner and more maintainable
2. **Keep opacity values consistent** - Use light/medium/strong for consistency
3. **Test both themes** - Always verify changes in both light and dark modes
4. **Use semantic names** - Choose variables based on purpose, not appearance

## Color Values Reference

### Light Theme
- Glass effects: `rgba(0, 0, 0, 0.03)` to `rgba(0, 0, 0, 0.08)`
- Overlays: `rgba(0, 0, 0, 0.05)` to `rgba(0, 0, 0, 0.15)`
- Spotlight: `rgba(0, 0, 0, 0.08)`

### Dark Theme
- Glass effects: `rgba(255, 255, 255, 0.05)` to `rgba(255, 255, 255, 0.1)`
- Overlays: `rgba(255, 255, 255, 0.1)` to `rgba(255, 255, 255, 0.25)`
- Spotlight: `rgba(255, 255, 255, 0.25)`

## Need Help?

If you encounter a pattern that doesn't fit the existing variables:

1. Check if you can combine existing variables
2. Consider if a new semantic variable is needed
3. Add it to both light and dark theme definitions in `main.css`
