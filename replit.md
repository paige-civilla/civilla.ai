# Civilla.ai Website

## Overview
Pixel-perfect frontend implementation of the Civilla.ai website from Figma design using React and Tailwind CSS. This is a design-locked, frontend-only build with zero creative interpretation - Figma is the single source of truth, except where user explicitly requests design deviations.

## User Preferences
- **LOW AUTONOMY**: Ask before making design, copy, IA, or feature changes
- **Brand styling**: "civilla" must always appear in lowercase, italicized (.cv-brand class)
- **Figma is source of truth** except where user explicitly overrides

## Locked Pages (NO EDITS ALLOWED)
- **Home page** (`client/src/pages/Home.tsx`) - LOCKED
- **How Civilla Works page** (`client/src/pages/HowCivillaWorks.tsx`) - LOCKED

## Locked Components (NO EDITS ALLOWED)
- **Footer** (`client/src/components/Footer.tsx`) - LOCKED
- **Navbar (green)** (`client/src/components/Navbar.tsx`) - LOCKED
- **NavbarCream** (`client/src/components/NavbarCream.tsx`) - LOCKED

## Recent Changes
- 2024-12-24: Adjusted logo size to match quick exit button visually in both navbars
- 2024-12-24: Added Admin Login and Careers pages (footer only)
- 2024-12-24: Restructured footer to 4 columns matching navbar menu organization
- 2024-12-24: Removed How We Started page and routes
- 2024-12-24: Created Meet The Founders and Our Mission pages with proper routing
- 2024-12-24: Added polaroid-style frames with tilt animation to founder images
- 2024-12-22: Locked Home and How Civilla Works pages per user request
- 2024-12-22: Updated StepsSection with Step One/Two/Three layout
- 2024-12-22: Updated Plans page with new pricing copy, taglines, add-ons, and FAQ updates

## Project Architecture
- React + Vite frontend
- Express backend
- Tailwind CSS styling
- Shadcn UI components
- wouter for routing

## Key Components
- `BrandMark`: Renders lowercase italicized "civilla" brand name
- `NavbarCream`: Cream-colored navigation bar
- `Footer`: Site footer
- `FaqSection`: Shared FAQ accordion component

## Pricing Structure
- Trial: Free (3-day)
- Core: $19.99/mo or $199/yr
- Pro: $29.99/mo or $299/yr (Most Popular)
- Premium: $49.99/mo or $499/yr
- Yearly badge: "2 Mo. Free"
