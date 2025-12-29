/** @type {import('tailwindcss').Config} */
const config = {
  theme: {
    extend: {
      typography: {
        compact: {
          css: {
            h1: { fontSize: "1.6em", lineHeight: "1.2", marginBottom: "0.6em" },
            h2: {
              fontSize: "1.35em",
              lineHeight: "1.25",
              marginBottom: "0.55em",
            },
            h3: { fontSize: "1.2em", lineHeight: "1.3", marginBottom: "0.5em" },
            h4: {
              fontSize: "1.1em",
              lineHeight: "1.35",
              marginBottom: "0.45em",
            },
            blockquote: { fontSize: "1.05em" },
            "figcaption, code, kbd": { fontSize: "0.95em" },
          },
        },
        fluidScale: {
          css: {
            "display-lg": {
              fontSize: "clamp(1.000rem, calc(0.762rem + 1.337vw), 1.654rem)",
              fontWeight: "800",
              lineHeight: "1.52",
              letterSpacing: "0.025em",
            },
            "display-md": {
              fontSize: "clamp(1.000rem, calc(0.799rem + 1.131vw), 1.553rem)",
              fontWeight: "800",
              lineHeight: "1.52",
              letterSpacing: "0.025em",
            },
            h1: {
              fontSize: "clamp(1.000rem, calc(0.833rem + 0.937vw), 1.458rem)",
              fontWeight: "700",
              lineHeight: "1.52",
              letterSpacing: "0.025em",
            },
            h2: {
              fontSize: "clamp(1.000rem, calc(0.896rem + 0.585vw), 1.286rem)",
              fontWeight: "600",
              lineHeight: "1.52",
              letterSpacing: "0.025em",
            },
            h3: {
              fontSize: "clamp(1.000rem, calc(0.925rem + 0.425vw), 1.208rem)",
              fontWeight: "600",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            h4: {
              fontSize: "clamp(1.000rem, calc(0.951rem + 0.274vw), 1.134rem)",
              fontWeight: "500",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            h5: {
              fontSize: "clamp(1.000rem, calc(0.964rem + 0.202vw), 1.099rem)",
              fontWeight: "500",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            h6: {
              fontSize: "clamp(1.000rem, calc(0.976rem + 0.133vw), 1.065rem)",
              fontWeight: "500",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            "body-xl": {
              fontSize: "clamp(1.000rem, calc(0.988rem + 0.065vw), 1.032rem)",
              fontWeight: "400",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            body: {
              fontSize: "clamp(1.000rem, calc(1.000rem + 0.000vw), 1.000rem)",
              fontWeight: "400",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            "body-sm": {
              fontSize: "clamp(1.000rem, calc(1.011rem + -0.063vw), 0.969rem)",
              fontWeight: "400",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            "caption-lg": {
              fontSize: "clamp(1.000rem, calc(1.022rem + -0.125vw), 0.939rem)",
              fontWeight: "400",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            caption: {
              fontSize: "clamp(1.000rem, calc(1.033rem + -0.184vw), 0.910rem)",
              fontWeight: "400",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            "caption-sm": {
              fontSize: "clamp(1.000rem, calc(1.043rem + -0.242vw), 0.882rem)",
              fontWeight: "300",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
            overline: {
              fontSize: "clamp(1.000rem, calc(1.053rem + -0.298vw), 0.855rem)",
              fontWeight: "500",
              lineHeight: "1.52",
              letterSpacing: "0.03em",
            },
          },
        },
      },
    },
  },
};

module.exports = config;
