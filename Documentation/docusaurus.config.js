// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from 'prism-react-renderer'

const instance = process.env.DOCS_INSTANCE || 'atlas'
if (!['atlas', 'raws'].includes(instance)) throw new Error(`Unknown docs instance: ${instance}`)
const isRaws = instance === 'raws'
const appTitle = isRaws ? 'Planetary Raws' : 'Atlas'

/** @type {import('@docusaurus/types').Config} */
const config = {
    title: `${appTitle} API Documentation | PDS-IMG`,
    customFields: { instance },
    tagline: 'Technical Documentation',
    favicon: 'img/favicon.png',

    // Set the production url of your site here
    url: 'https://your-docusaurus-site.example.com',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    // Read from environment variable to support different deployment paths
    baseUrl: process.env.PUBLIC_URL ? `${process.env.PUBLIC_URL}/documentation/` : '/documentation/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'PDS', // Usually your GitHub org/user name.
    projectName: 'docusaurus', // Usually your repo name.

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    presets: [
        [
            'classic',
            /** @type {import('@docusaurus/preset-classic').Options} */
            ({
                docs: {
                    path: instance,
                    sidebarPath: './sidebars.js',
                },
                theme: {
                    customCss: './src/css/custom.css',
                },
            }),
        ],
    ],

    themeConfig:
        /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
        ({
            // Replace with your project's social card
            image: 'img/docusaurus-social-card.jpg',
            navbar: {
                title: appTitle,
                logo: {
                    alt: 'PDSIMG Logo',
                    src: 'img/nasa-logo.svg',
                },
                items: [
                    {
                        type: 'docSidebar',
                        sidebarId: 'apiSidebar',
                        position: 'left',
                        label: 'API',
                    },
                ],
            },
            footer: {
                links: [
                    {
                        title: 'Docs',
                        items: [
                            {
                                label: 'API',
                                to: '/docs/category/api',
                            },
                        ],
                    },
                    {
                        title: 'PDS',
                        items: [
                            {
                                label: 'Main Site',
                                href: 'https://pds-imaging.jpl.nasa.gov',
                            },
                            {
                                label: `${appTitle} Search`,
                                href: isRaws ? 'pathname:///search' : 'https://pds-imaging.jpl.nasa.gov/atlas/search',
                            },
                            ...(!isRaws ? [{
                                label: 'Atlas Archive Explorer',
                                href: 'https://pds-imaging.jpl.nasa.gov/atlas/archive-explorer',
                            }] : []),
                        ],
                    },
                ],
            },
            prism: {
                additionalLanguages: ['json'],
                theme: prismThemes.github,
                darkTheme: prismThemes.dracula,
            },
        }),
}

export default config
