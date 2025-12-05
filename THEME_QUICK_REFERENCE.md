# Theme System Quick Reference

## 🎨 CSS Variables

### Backgrounds
```css
var(--ui-bg)           /* Main background */
var(--bg-secondary)    /* Secondary background */
var(--bg-card)         /* Card background */
var(--bg-card-hover)   /* Card hover state */
```

### Text Colors
```css
var(--font-primary)    /* Primary text */
var(--font-muted)      /* Muted/secondary text */
var(--font-inverted)   /* Inverted text (buttons) */
var(--font-placeholder)/* Placeholder text */
```

### Borders
```css
var(--border-primary)       /* Primary border */
var(--border-primary-hover) /* Border hover state */
var(--border-muted)         /* Muted border */
```

### Glass Effects
```css
var(--glass-light)          /* Light glass bg */
var(--glass-medium)         /* Medium glass bg */
var(--glass-strong)         /* Strong glass bg */
var(--glass-border-light)   /* Light glass border */
var(--glass-border-medium)  /* Medium glass border */
var(--glass-border-strong)  /* Strong glass border */
```

### Overlays
```css
var(--overlay-light)   /* Light overlay */
var(--overlay-medium)  /* Medium overlay */
var(--overlay-strong)  /* Strong overlay */
```

### Special
```css
var(--spotlight)       /* Spotlight/glow effect */
```

## 🛠️ Utility Classes

### Glass Morphism
```vue
<div class="glass-light">Light glass effect</div>
<div class="glass-medium">Medium glass effect</div>
<div class="glass-strong">Strong glass effect</div>
```

### Overlays
```vue
<div class="overlay-light">Light overlay</div>
<div class="overlay-medium">Medium overlay</div>
<div class="overlay-strong">Strong overlay</div>
```

## 📝 Common Patterns

### Glass Card
```vue
<!-- Before -->
<div class="border border-white/10 bg-white/5">

<!-- After -->
<div class="glass-light">
```

### Glass Card with Hover
```vue
<!-- Before -->
<div class="border border-white/10 bg-white/5 hover:bg-white/10">

<!-- After -->
<div class="glass-light hover:glass-medium">
```

### Spotlight Effect
```vue
<!-- Before -->
<div class="bg-white/25 blur-[120px]">

<!-- After -->
<div class="bg-[var(--spotlight)] blur-[120px]">
```

### Text Colors
```vue
<!-- Before -->
<p class="text-white/60">Muted text</p>

<!-- After -->
<p class="text-[var(--font-muted)]">Muted text</p>
```

### Overlay Button
```vue
<!-- Before -->
<button class="bg-white/10 hover:bg-white/20">

<!-- After -->
<button class="overlay-light hover:overlay-medium">
```

## 🔄 Migration Checklist

- [ ] Find: `bg-white/XX` → Replace with glass/overlay classes or `var(--glass-XX)`
- [ ] Find: `border-white/XX` → Replace with glass classes or `var(--glass-border-XX)`
- [ ] Find: `text-white/XX` → Replace with `var(--font-XX)`
- [ ] Find: `bg-black/XX` → Replace with overlay classes or `var(--overlay-XX)`
- [ ] Test in both light and dark modes
- [ ] Verify hover states work correctly

## 🧪 Test Your Changes

Visit `/theme-test` in your browser to see all theme utilities in action.

## 💡 Tips

1. **Use utility classes** when possible (cleaner code)
2. **Use CSS variables** for custom values
3. **Always test both themes** after changes
4. **Keep opacity levels consistent** (light/medium/strong)

## 📚 Full Documentation

See `THEME_MIGRATION_GUIDE.md` for complete documentation and examples.
