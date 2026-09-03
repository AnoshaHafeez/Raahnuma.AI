import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}"
  ],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1400px" }
    },
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"]
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        brand: {
          50: "#eefaf4",
          100: "#d5f2e2",
          200: "#ade5c9",
          300: "#7ad1ab",
          400: "#4bb88c",
          500: "#2c9d72",
          600: "#1f7d5c",
          700: "#1c6449",
          800: "#194f3b",
          900: "#0f2e22",
          950: "#0a1f17"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "fade-in-up": { from: { opacity: "0", transform: "translateY(12px)" }, to: { opacity: "1", transform: "translateY(0)" } },
        "slide-in-right": { from: { opacity: "0", transform: "translateX(24px)" }, to: { opacity: "1", transform: "translateX(0)" } },
        shimmer: { "0%": { backgroundPosition: "-1000px 0" }, "100%": { backgroundPosition: "1000px 0" } }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "fade-in-up": "fade-in-up 0.6s ease-out",
        "slide-in-right": "slide-in-right 0.4s ease-out",
        shimmer: "shimmer 2s infinite linear"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};

export default config;