// @ts-expect-error - Nuxt types are not loaded
export default defineAppConfig({
  site: {
    url: 'https://mdc-syntax.vercel.app',
  },
  seo: {
    title: 'MDC Syntax',
    description: 'Markdown with Components',
    url: 'https://mdc-syntax.vercel.app',
    socials: {
      github: 'nuxt-content/mdc-syntax',
    },
  },
  docs: {
    github: 'nuxt-content/mdc-syntax',
  },

  title: 'MDC Syntax',
  description: 'Markdown with Components',
  url: 'https://mdc-syntax.vercel.app',

  ui: {
    colors: {
      primary: 'yellow',
      neutral: 'neutral',
    },
  },

  docus: {
    footer: {
      credits: {
        text: 'Made with 💚',
        href: 'https://github.com/nuxt-content/mdc-syntax',
      },
    },
  },
  aside: {
    level: 1,
    collapsed: false,
    exclude: [],
  },
  header: {
    title: 'MDC Syntax',

    logo: {
      alt: 'MDC Syntax Logo',
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
    },
  },
})
