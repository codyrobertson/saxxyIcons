# SAXI Icon Font Documentation

Generated on: 2025-02-25
Total Icons: 0
Families: 

## Overview

This icon font includes the following font files:

- **saxi-icons-pro** - Main family with three weights:
  - Bold (700) - Use with class `saxi-solid`
  - Linear (400) - Use with class `saxi-regular`
  - Outline (300) - Use with class `saxi-light`
- **saxi-icons-pro-duotone** - Duotone style icons - Use with class `saxi-duotone`
- **saxi-icons-pro-broken** - Broken style icons - Use with class `saxi-broken`

## Features

- **Multiple styles** available for each icon through font weights and families
- **Ligature support** - Just type the icon name inside the element
- **Unicode support** - Each icon has a dedicated Unicode code point
- **FontAwesome-style classes** - Following the familiar pattern like `saxi-solid saxi-archive-add`

## Installation

### 1. Include CSS

```html
<link rel="stylesheet" href="Fonts/saxi-icons-all.css">
<!-- Or include only what you need: -->
<link rel="stylesheet" href="Fonts/saxi-icons-pro.css">
<link rel="stylesheet" href="Fonts/saxi-icons-pro-duotone.css">
<link rel="stylesheet" href="Fonts/saxi-icons-pro-broken.css">
```

### 2. Use icons in HTML

```html
<!-- Using CSS classes -->
<i class="saxi-solid saxi-archive-add"></i>

<!-- Using ligatures (just type the icon name) -->
<i class="saxi-solid">archive-add</i>
```

[object Promise]

## Icon Categories


## Usage Examples

### HTML with CSS Classes

```html
<!-- Using style variants -->
<i class="saxi-solid saxi-archive-add"></i>    <!-- Bold style -->
<i class="saxi-regular saxi-archive-add"></i>  <!-- Linear/Regular style -->
<i class="saxi-light saxi-archive-add"></i>    <!-- Outline/Light style -->
<i class="saxi-duotone saxi-archive-add"></i>  <!-- Duotone style -->
<i class="saxi-broken saxi-archive-add"></i>   <!-- Broken style -->
```

### HTML with Ligatures

```html
<!-- Using ligatures (just type the icon name) -->
<i class="saxi-solid">archive-add</i>     <!-- Bold style -->
<i class="saxi-regular">archive-add</i>   <!-- Linear/Regular style -->
<i class="saxi-light">archive-add</i>     <!-- Outline/Light style -->
<i class="saxi-duotone">archive-add</i>   <!-- Duotone style -->
<i class="saxi-broken">archive-add</i>    <!-- Broken style -->
```

### CSS

```css
/* Basic icon styling */
.custom-icon {
  font-family: 'saxi-icons-pro';
  font-size: 24px;
  color: #3498db;
}

/* Using the :before pseudo-element with Unicode */
.download-button:before {
  content: "\E900";
  font-family: 'saxi-icons-pro';
  margin-right: 8px;
}

/* Style variants */
.icon-bold {
  font-weight: 700;  /* Bold */
}

.icon-regular {
  font-weight: 400;  /* Regular/Linear */
}

.icon-light {
  font-weight: 300;  /* Light/Outline */
}
```

### Using in Design Tools (Figma, Canva, etc.)

1. Install the font files (.ttf) on your system.
2. In your design tool, select text and change the font to:
   - 'saxi-icons-pro' (with appropriate weight for Bold, Linear, or Outline)
   - 'saxi-icons-pro-duotone' for Duotone icons
   - 'saxi-icons-pro-broken' for Broken icons
3. Type the icon name (e.g., 'archive-add') to use the ligature.
4. Alternatively, you can paste the Unicode character directly.
