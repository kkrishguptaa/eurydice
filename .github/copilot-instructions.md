# Eurydice - Copilot Instructions

## Project Overview
Phaser 3 RPG game about Orpheus and Eurydice, bundled with Vite and deployed to Cloudflare Pages. Built with TypeScript and uses Bun as the JavaScript runtime.

## Architecture

### Core Structure
- **Entry Point**: [index.html](../index.html) → [src/index.ts](../src/index.ts) → [src/main.ts](../src/main.ts)
- **Game Engine**: Phaser 3 with Arcade physics (gravity: `{x: 0, y: 800}`)
- **Canvas Dimensions**: Fixed at 1920×1080 (`WIDTH`, `HEIGHT` from [src/util/constants.ts](../src/util/constants.ts))
- **Scene Flow**: Boot → Preloader → Home → Menu → (game scenes)

### Scene System
Scenes inherit from `Phaser.Scene` and follow this lifecycle:
1. **Boot** ([src/scenes/Boot.ts](../src/scenes/Boot.ts)): Minimal bootstrap, immediately starts Preloader
2. **Preloader** ([src/scenes/Preloader.ts](../src/scenes/Preloader.ts)): Loads all assets with custom progress UI (UnifrakturCook font, white bars on dark background)
3. **Home** ([src/scenes/Home.ts](../src/scenes/Home.ts)): Title screen with `BackgroundManager` and wordmark
4. **Menu** ([src/scenes/Menu.ts](../src/scenes/Menu.ts)): Navigation with keyboard (W/S/Arrow) and mouse support

### Component Pattern
Reusable game objects live in [src/components/](../src/components/):
- **BackgroundManager** ([src/components/Background.ts](../src/components/Background.ts)): Creates parallax cloud system with randomized tweens (25-55s duration, repeating infinitely)
- Components accept `Scene` in constructor and manage their own lifecycle
- Always set explicit `depth` values for proper layering (background: 0, UI: 3-7)

## Development Workflows

### Commands
- **Dev Server**: `bun run dev` (uses [vite/config.dev.mjs](../vite/config.dev.mjs), runs on port 8080)
- **Production Build**: `bun run build` (uses [vite/config.prod.mjs](../vite/config.prod.mjs), outputs to `dist/`)
- **No Test Suite**: Project lacks automated tests

### Build System
- **Bundler**: Vite with separate dev/prod configs in `vite/` directory
- **Production Optimizations**: Terser minification (2 passes), Phaser manually chunked
- **Deployment**: Cloudflare Pages via Wrangler (name: "icarus", configured in [wrangler.jsonc](../wrangler.jsonc))

### Code Quality
- **Linter/Formatter**: Biome (tab indentation, single quotes, auto-organize imports)
- **TypeScript**: Strict mode enabled with bundler module resolution
- Run Biome via `bunx @biomejs/biome check --write .`

## Project-Specific Conventions

### Styling & Assets
- **Font**: UnifrakturCook (loaded from Google Fonts) - use for all text: `fontFamily: 'UnifrakturCook'`
- **Color Scheme**: Dark background `#1b1b1c`, white text `#ffffff`
- **Asset Loading**: All assets loaded in Preloader scene, stored in `public/assets/`
- **Pixel Art**: `pixelArt: true` in game config - maintain crisp pixel rendering

### Code Patterns
- **Constants**: Define magic numbers in [src/util/constants.ts](../src/util/constants.ts)
- **Scene Properties**: Store interactive game objects as class properties (typed with Phaser types)
- **Input Handling**: Use `this.input.once()` for one-time triggers, `this.input.keyboard?.on()` for persistent listeners
- **Scene Navigation**: Menu items defined as `{key: string, scene: string}[]` array

### Phaser-Specific
- **Scale Mode**: `Scale.ScaleModes.FIT` - game scales to fit screen while maintaining aspect ratio
- **Fullscreen Target**: `eurydice-window` div in [index.html](../index.html)
- **Text Positioning**: Use `.setOrigin(0.5)` for center-aligned text, calculate positions relative to `WIDTH/HEIGHT`
- **Interactive Objects**: Set `.setInteractive({useHandCursor: true})` for clickable elements
- **Depth Management**: Establish clear z-index (background: 0, wordmark: 3-5, UI: 6-7)

## External Dependencies
- **Phaser 3**: Game engine (v3.90.0+)
- **Bun**: Runtime and package manager - use `bunx` for running tools
- **Cloudflare Pages**: Hosting platform (not Workers)
- **Google Fonts**: UnifrakturCook loaded via CDN in [index.html](../index.html)
- **Reseter.css**: CSS reset loaded from CDN

## Common Gotchas
- **Wrangler Name Mismatch**: [wrangler.jsonc](../wrangler.jsonc) uses "icarus" not "eurydice"
- **Package.json Usage**: Scripts reference Bun but main entry runs via Vite ([index.html](../index.html) imports [src/index.ts](../src/index.ts) directly)
- **TypeScript Includes**: [tsconfig.json](../tsconfig.json) includes non-existent `src/data/levels.ts` - likely future feature
- **No Direct Scene Access**: Scenes start via `this.scene.start('SceneName')`, not direct instantiation
- **Keyboard Null Check**: Always use optional chaining: `this.input.keyboard?.on()` (keyboard may be undefined)
