# Phase 14: Premium Gold Theme & Texture Integration

## Objective
Rebrand the K-Fit Admin application from the current neon-green theme to a high-end, premium Gold theme. This includes updating the global color palette and integrating a custom gold texture image (`gold-texture.jpg`) into specific UI components using React Native's `<ImageBackground>`.

## Context & Assets
- **Texture File**: The user has saved `gold-texture.jpg` inside the `assets/images/` directory. 
- **Reference**: The current system uses flat neon green for primary actions and active states. We want to replace these flat colors with the textured gold image to achieve a luxurious aesthetic.

## 1. Global Color Palette Update
Update the theme configuration (Tailwind config, NativeWind `global.css`, or standard React Native constants file) to replace the neon green with a premium gold palette.
- **Current**: Neon Green (e.g., `#ccff00` / `#a3e635`)
- **New Primary Gold (Solid)**: `#D4AF37` (Metallic Gold - use this where textures can't be used)
- **New Accent/Light Gold**: `#F3E5AB` (Vanilla/Light Gold - good for text)
- **New Dark Gold (for borders/shadows)**: `#996515`
- **Backgrounds**: Maintain the deep black (`#000000`) and dark gray cards (`#121212` to `#1C1C1E`) to make the gold pop.

## 2. Targeted Component Updates (Based on Admin Dashboard)
Review and update the UI components to reflect the new theme. **Where noted, use the texture image.**

- **Primary Buttons (e.g., the large "Add member" button)**: 
  - Replace the flat green background with the gold texture. 
  - Use `<ImageBackground source={require('../../assets/images/gold-texture.jpg')} resizeMode="cover">`. 
  - Apply `overflow: 'hidden'` and the appropriate `borderRadius` to the wrapper so the image respects the button shape.
  - Ensure the text and icon inside ("Add member") are bold and dark (e.g., `#121212`) for readability against the gold.
- **Bottom Navigation Active State (e.g., the "Roster" tab)**: 
  - The active pill background should also utilize the `gold-texture.jpg` using `<ImageBackground>`.
  - The inactive tabs should remain dark gray.
- **Badges & Tags (e.g., "POS V3.0" badge)**: 
  - Update to use a dark gold background with bright gold text, or a solid gold background (`#D4AF37`) with black text.
- **Top Left App Logo (The 'K')**:
  - Change the background square from flat green to the gold texture or solid gold.
- **Icons in Metric Cards**: 
  - The green checkmark (Active members) and green graph icon (New this month) must be updated to the solid primary gold (`#D4AF37`).

## 3. Implementation Steps for the Agent
1. Update the color variables in the project's theme/constants file.
2. Refactor the primary button components and the bottom navigation active tab to utilize `<ImageBackground>` with the gold texture.
3. Apply the solid gold color updates to the badges, icons, and text highlights across the Admin Dashboard (Roster Management view).
4. Run a visual check to ensure text layered over the gold texture remains highly readable (use dark text).

IMPORTANT: Stop and wait for my approval on this plan before writing the code.