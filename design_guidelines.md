# Civilla Frontend Design Guidelines

## Design Approach: Figma-Locked Implementation

**Source of Truth**: Figma design file (node-id: 10202:82854 for Desktop, 10202:82853 for Mobile)

**Operating Mode**: Zero creative interpretation. Match Figma pixel-perfect.

---

## Design Tokens (Extracted from Figma)

### Colors
- **Primary**: Bush `#0f3b2e` / `#0c2f24`
- **Text**: Neutral Darkest `#070503`
- **Backgrounds**: `#fcfbf9` (cream), `#f2f2f2` (light gray), `#cfd7d5` (muted green-gray)
- **White**: `#ffffff`
- **Borders**: Neutral Darkest `#070503` (2px stroke width)

### Typography
**Heading Font**: Figtree, Bold (700 weight)
- H1: 84px, line-height 1.1, letter-spacing 1px
- H2: 60px, line-height 1.2, letter-spacing 1px
- H3: 48px, line-height 1.2, letter-spacing 1px
- H4: 40px, line-height 1.2, letter-spacing 1px
- H5: 32px, line-height 1.2, letter-spacing 1px

**Body Font**: Arimo
- Regular: 400 weight, line-height 1.6
- Bold: 700 weight, line-height 1.6
- Sizes: Tiny (12px), Small (16px), Regular (18px), Medium (20px)

### Spacing
- Container max-width: 1280px
- Section padding: 80px (medium), 112px (large)
- Page padding: 64px
- Border radius: 16px (medium/large)

---

## Component Structure (From Figma)

### Navbar
- Logo on left
- Navigation links on right
- Exact copy and link structure from Figma
- Background and spacing per design

### Hero Section
- Large H1 heading with exact Figma copy
- Description text below
- CTA button(s) in layout shown
- Background treatment per Figma

### Feature/Content Sections
- Image placements exactly as shown
- Headings, descriptions verbatim from Figma
- Grid/column layouts matching design
- Spacing between sections per Figma tokens

### Testimonial Section
- Avatar images in exact positions
- Quote text verbatim
- Layout structure from Figma

### Footer
- Multi-column layout matching Figma
- Links, copy, and structure exactly as designed

---

## Implementation Rules

1. **Copy**: Use exact text from Figma - no rewording
2. **Layout**: Match spacing, alignment, and structure pixel-perfect
3. **Images**: Use Figma-provided image URLs from extraction
4. **Components**: Build presentational-only (no functionality)
5. **Responsive**: Desktop (10202:82854) and Mobile (10202:82853) frames
6. **Stop Rule**: If unclear, ask before implementing

**No additions**: No dark mode, extra pages, pricing logic, auth, or features beyond Home page visual design.