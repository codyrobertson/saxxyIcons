# Icon Font Generator

An automated tool for generating icon fonts from SVG files. This tool takes a zip file containing SVG icons and generates font files (TTF, WOFF, WOFF2, EOT, SVG) along with CSS and JSON mapping files.

## Features

- Generates icon fonts from SVG files
- Supports multiple styles (Bold, Linear, Outline, Broken, TwoTone and Bulk)
- Creates font files with appropriate font weights
- Outputs TTF, WOFF, WOFF2, EOT, and SVG font formats
- Generates CSS with classes and Unicode mappings
- Creates JSON mapping files
- Includes ligature support for typing icon names directly
- Follows FontAwesome-style conventions for class names
- Generates comprehensive documentation with glyph tables
- Includes interactive demo HTML

## Prerequisites

- Node.js (v12 or later)
- npm

## Installation

1. Clone this repository or download the files
2. Install dependencies:

```bash
npm install
```

3. Set up the directory structure:

```bash
npm run setup
```

## Usage

### 1. Prepare your SVG files

Place your `svg.zip` file in the `input/` directory. The script expects SVG files to be in an "all" folder within the zip, with filenames that include the style:

- filename-bold.svg
- filename-linear.svg
- filename-outline.svg
- filename-broken.svg
- filename-twotone.svg
- filename-bulk.svg

For example:
```
svg.zip/
└── all/
    ├── archive-add-bold.svg
    ├── archive-add-linear.svg
    ├── archive-add-outline.svg
    ├── archive-add-broken.svg
    ├── archive-add-twotone.svg
    ├── archive-add-bulk.svg
    └── ...
```

### 2. Build the icon fonts

```bash
npm run build
```

This will:
1. Extract the SVG files from the zip
2. Organize them into style-specific folders
3. Generate the font files
4. Create CSS and JSON mapping files
5. Generate documentation and demo HTML

### 3. Watch mode (automatically rebuild on changes)

```bash
npm run watch
```

This will watch for changes to the `svg.zip` file in the `input/` directory and automatically rebuild the icon fonts when changes are detected.

### 4. Clean up

```bash
npm run clean
```

This will clean up temporary files and directories. You'll be asked if you want to clean the output directory as well.

## Output

All generated files are placed in the `Fonts/` directory:

```
Fonts/
├── saxi-icons-pro.css
├── saxi-icons-pro.json
├── saxi-icons-pro-bold.eot
├── saxi-icons-pro-bold.svg
├── saxi-icons-pro-bold.ttf
├── saxi-icons-pro-bold.woff
├── saxi-icons-pro-bold.woff2
├── saxi-icons-pro-linear.eot
├── saxi-icons-pro-linear.svg
├── ...
├── saxi-icons-pro-twotone.css
├── saxi-icons-pro-twotone.json
├── ...
├── saxi-icons-all.css
├── demo.html
└── Icon-Font-README.md
```

## Font Family Structure

This tool generates two font families:

1. **saxi-icons-pro** - Main family with multiple weights:
   - Bold (700) - Use with class `saxi-solid`
   - Linear (400) - Use with class `saxi-regular`
   - Outline (300) - Use with class `saxi-light`
   - Broken (400) - Use with class `saxi-broken`

2. **saxi-icons-pro-twotone** - TwoTone family with two weights:
   - TwoTone (400) - Use with class `saxi-twotone`
   - Bulk (700) - Use with class `saxi-bulk`

## CSS Usage

The generated CSS files provide classes with the FontAwesome-style conventions. To use the icons in your HTML:

### Using CSS Classes:

```html
<!-- Using style variants -->
<i class="saxi-solid saxi-archive-add"></i>    <!-- Bold style -->
<i class="saxi-regular saxi-archive-add"></i>  <!-- Linear/Regular style -->
<i class="saxi-light saxi-archive-add"></i>    <!-- Outline/Light style -->
<i class="saxi-broken saxi-archive-add"></i>   <!-- Broken style -->
<i class="saxi-twotone saxi-archive-add"></i>  <!-- TwoTone style -->
<i class="saxi-bulk saxi-archive-add"></i>     <!-- Bulk style -->
```

### Using Ligatures:

```html
<!-- Using ligatures (just type the icon name) -->
<i class="saxi-solid">archive-add</i>     <!-- Bold style -->
<i class="saxi-regular">archive-add</i>   <!-- Linear/Regular style -->
<i class="saxi-light">archive-add</i>     <!-- Outline/Light style -->
<i class="saxi-broken">archive-add</i>    <!-- Broken style -->
<i class="saxi-twotone">archive-add</i>   <!-- TwoTone style -->
<i class="saxi-bulk">archive-add</i>      <!-- Bulk style -->
```

## Design Tool Integration

To use these icons in design tools like Figma or Canva:

1. Install the font files (.ttf) on your system
2. Select text in your design tool and set the font to:
   - 'saxi-icons-pro' (with appropriate weight for Bold, Linear, Outline, or Broken)
   - 'saxi-icons-pro-twotone' (with appropriate weight for TwoTone or Bulk)
3. Type the icon name (e.g., 'archive-add') directly to use the ligature
4. Alternatively, you can paste the Unicode character directly

## Documentation and Demo

After building the fonts, check the following files:

- `Fonts/Icon-Font-README.md` - Comprehensive documentation including all icons and usage examples
- `Fonts/demo.html` - Interactive demo showing all icons with search functionality

## Customization

To customize the font generation process, edit the configuration in `build-icon-font.js`:

- Change font family names
- Adjust style weights
- Modify class prefixes
- Change Unicode base codepoint

## License

MIT