export default {
  title: "Patrimoine360 Core",
  description:
    "Documentation du socle communautaire de gestion des sites, biens et équipements.",
  base: "/",
  cleanUrls: true,
  head: [["link", { rel: "icon", href: "/favicon.ico" }]],

  markdown: {
    lineNumbers: true,
    languages: [
      "js",
      "ts",
      "json",
      "bash",
      "shell",
      "yaml",
      "sql",
      "html",
      "css",
      "tsx",
      "jsx",
    ],
  },

  themeConfig: {
    logo: "/shelf-logo.png",
    search: {
      provider: "local",
    },
    nav: [
      { text: "Accueil", link: "/" },
      { text: "Développement local", link: "/local-development" },
      {
        text: "Projet",
        items: [
          {
            text: "GitHub",
            link: "https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE",
          },
          {
            text: "Twitter",
            link: "https://twitter.com/Patrimoine360",
          },
          { text: "Contribuer", link: "/contributing" },
        ],
      },
    ],
    sidebar: [
      {
        text: "Démarrage",
        collapsed: false,
        items: [
          { text: "Configuration Supabase", link: "/supabase-setup" },
          { text: "Développement local", link: "/local-development" },
          { text: "Déploiement", link: "/deployment" },
          { text: "Docker", link: "/docker" },
        ],
      },
      {
        text: "Configuration",
        collapsed: true,
        items: [
          { text: "Configuration applicative", link: "/app-configuration" },
          {
            text: "Scripts de suivi et d'analyse",
            link: "/tracking-scripts",
          },
          { text: "Raccourcisseur d'URL", link: "/url-shortener" },
        ],
      },
      {
        text: "Base de données",
        collapsed: true,
        items: [
          { text: "Triggers", link: "/database-triggers" },
          { text: "Index protégés", link: "/protected-indexes" },
        ],
      },
      {
        text: "Développement",
        collapsed: true,
        items: [
          { text: "Accessibilité", link: "/accessibility" },
          { text: "Gestion des erreurs", link: "/handling-errors" },
          { text: "Sélection multiple", link: "/select-all-pattern" },
          { text: "Hooks utilitaires", link: "/hooks" },
          {
            text: "Développement du scanner",
            link: "/scanner-drawer-development",
          },
          {
            text: "Types de codes-barres",
            link: "/barcode-types-development-guide",
          },
          {
            text: "Conflits de réservation",
            link: "/booking-conflict-queries",
          },
          {
            text: "Agent de revue de sécurité",
            link: "/security-review-agent",
          },
        ],
      },
      {
        text: "Index des biens",
        collapsed: true,
        items: [
          { text: "Index avancé", link: "/advanced-index/" },
          {
            text: "Filtres",
            link: "/advanced-index/advanced-filtering-guide",
          },
          {
            text: "Tri",
            link: "/advanced-index/advanced-sorting-guide",
          },
          {
            text: "Tri naturel",
            link: "/advanced-index/natural-sorting-explanation",
          },
          {
            text: "Paramètres de l'index",
            link: "/advanced-index/asset-index-settings",
          },
        ],
      },
      {
        text: "Projet",
        collapsed: true,
        items: [
          { text: "Contribuer", link: "/contributing" },
          { text: "Code de conduite", link: "/code-of-conduct" },
          { text: "Licence", link: "/license" },
        ],
      },
    ],
    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE",
      },
      { icon: "twitter", link: "https://twitter.com/Patrimoine360" },
    ],
    editLink: {
      pattern:
        "https://github.com/SREWA-DIGITAL/PATRIMOINE360-CORE/edit/main/apps/docs/:path",
      text: "Modifier cette page sur GitHub",
    },
    footer: {
      message: "Distribué sous licence GNU AGPL-3.0.",
      copyright: "Patrimoine360 Core et ses contributeurs.",
    },
  },
};
