// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    devtools: { enabled: true },
    modules: [
        '@nuxtjs/tailwindcss',
        '@vueuse/nuxt'
    ],
    app: {
        head: {
            title: 'ILYTAT Goals',
            meta: [
                { charset: 'utf-8' },
                { name: 'viewport', content: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no' },
                { name: 'theme-color', content: '#1a1a2e' },
                { name: 'apple-mobile-web-app-capable', content: 'yes' },
                { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
            ],
            link: [
                { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
                { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' }
            ]
        }
    },
    css: ['~/assets/css/main.css'],
    tailwindcss: {
        cssPath: '~/assets/css/main.css',
        configPath: 'tailwind.config.ts',
        exposeConfig: false,
        viewer: true,
    }
});
//# sourceMappingURL=nuxt.config.js.map