import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./client/index.html", "./client/src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      colors: {
        background: "hsl(var(--background) / <alpha-value>)",
        foreground: "hsl(var(--foreground) / <alpha-value>)",
        border: "hsl(var(--border) / <alpha-value>)",
        input: "hsl(var(--input) / <alpha-value>)",
        card: {
          DEFAULT: "hsl(var(--card) / <alpha-value>)",
          foreground: "hsl(var(--card-foreground) / <alpha-value>)",
          border: "hsl(var(--card-border) / <alpha-value>)",
        },
        popover: {
          DEFAULT: "hsl(var(--popover) / <alpha-value>)",
          foreground: "hsl(var(--popover-foreground) / <alpha-value>)",
          border: "hsl(var(--popover-border) / <alpha-value>)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary) / <alpha-value>)",
          foreground: "hsl(var(--primary-foreground) / <alpha-value>)",
          border: "var(--primary-border)",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary) / <alpha-value>)",
          foreground: "hsl(var(--secondary-foreground) / <alpha-value>)",
          border: "var(--secondary-border)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted) / <alpha-value>)",
          foreground: "hsl(var(--muted-foreground) / <alpha-value>)",
          border: "var(--muted-border)",
        },
        accent: {
          DEFAULT: "hsl(var(--accent) / <alpha-value>)",
          foreground: "hsl(var(--accent-foreground) / <alpha-value>)",
          border: "var(--accent-border)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
          border: "var(--destructive-border)",
        },
        ring: "hsl(var(--ring) / <alpha-value>)",
        chart: {
          "1": "hsl(var(--chart-1) / <alpha-value>)",
          "2": "hsl(var(--chart-2) / <alpha-value>)",
          "3": "hsl(var(--chart-3) / <alpha-value>)",
          "4": "hsl(var(--chart-4) / <alpha-value>)",
          "5": "hsl(var(--chart-5) / <alpha-value>)",
        },
        sidebar: {
          ring: "hsl(var(--sidebar-ring) / <alpha-value>)",
          DEFAULT: "hsl(var(--sidebar) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-foreground) / <alpha-value>)",
          border: "hsl(var(--sidebar-border) / <alpha-value>)",
        },
        "sidebar-primary": {
          DEFAULT: "hsl(var(--sidebar-primary) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-primary-foreground) / <alpha-value>)",
          border: "var(--sidebar-primary-border)",
        },
        "sidebar-accent": {
          DEFAULT: "hsl(var(--sidebar-accent) / <alpha-value>)",
          foreground: "hsl(var(--sidebar-accent-foreground) / <alpha-value>)",
          border: "var(--sidebar-accent-border)"
        },
        bush: "#0f3b2e",
        "bush-dark": "#0c2f24",
        "neutral-darkest": "#070503",
        "neutral-lightest": "#f2f2f2",
        cream: "#fcfbf9",
        "muted-green": "#cfd7d5",
      },
      fontFamily: {
        sans: ["Arimo", "sans-serif"],
        heading: ["Figtree", "sans-serif"],
      },
      fontSize: {
        "heading-1": ["84px", { lineHeight: "1.1", letterSpacing: "0.84px", fontWeight: "700" }],
        "heading-1-mobile": ["48px", { lineHeight: "1.1", letterSpacing: "0.48px", fontWeight: "700" }],
        "heading-2": ["60px", { lineHeight: "1.2", letterSpacing: "0.6px", fontWeight: "700" }],
        "heading-2-mobile": ["44px", { lineHeight: "1.2", letterSpacing: "0.44px", fontWeight: "700" }],
        "heading-3": ["48px", { lineHeight: "1.2", letterSpacing: "0.48px", fontWeight: "700" }],
        "heading-3-mobile": ["32px", { lineHeight: "1.2", letterSpacing: "0.32px", fontWeight: "700" }],
        "heading-4": ["40px", { lineHeight: "1.2", letterSpacing: "0.4px", fontWeight: "700" }],
        "heading-5": ["32px", { lineHeight: "1.2", letterSpacing: "0.32px", fontWeight: "700" }],
        "heading-5-mobile": ["20px", { lineHeight: "1.2", letterSpacing: "0.2px", fontWeight: "700" }],
        "body-medium": ["20px", { lineHeight: "1.6" }],
        "body-regular": ["18px", { lineHeight: "1.6" }],
        "body-regular-mobile": ["14px", { lineHeight: "1.6" }],
        "body-small": ["16px", { lineHeight: "1.6" }],
        "body-tiny": ["12px", { lineHeight: "1.6" }],
        "tagline": ["16px", { lineHeight: "1.5", fontWeight: "700" }],
      },
      spacing: {
        "section-large": "112px",
        "section-large-mobile": "64px",
        "section-medium": "80px",
        "page-padding": "64px",
        "page-padding-mobile": "20px",
        "container": "1280px",
      },
      maxWidth: {
        "container": "1280px",
        "content-large": "768px",
        "content-medium": "560px",
        "content-small": "480px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
} satisfies Config;
