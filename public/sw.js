if(!self.define){const s=s=>{"require"!==s&&(s+=".js");let e=Promise.resolve();return n[s]||(e=new Promise((async e=>{if("document"in self){const n=document.createElement("script");n.src=s,document.head.appendChild(n),n.onload=e}else importScripts(s),e()}))),e.then((()=>{if(!n[s])throw new Error(`Module ${s} didn’t register its module`);return n[s]}))},e=(e,n)=>{Promise.all(e.map(s)).then((s=>n(1===s.length?s[0]:s)))},n={require:Promise.resolve(e)};self.define=(e,r,t)=>{n[e]||(n[e]=Promise.resolve().then((()=>{let n={};const a={uri:location.origin+e.slice(1)};return Promise.all(r.map((e=>{switch(e){case"exports":return n;case"module":return a;default:return s(e)}}))).then((s=>{const e=t(...s);return n.default||(n.default=e),n}))})))}}define("./sw.js",["./workbox-1ca495a9"],(function(s){"use strict";importScripts(),self.skipWaiting(),s.clientsClaim(),s.precacheAndRoute([{url:"/_next/static/chunks/1f948d80401f9bc86379886c167f3460f480a3d6.772caec82b5c0e0ce517.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/36.442de5b4a5bb87120ee8.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/37.4db339d1bd40254ff49d.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/71247caf95475e3ea7f9a0f8a30beb258b23d005.fa9863e617708b768bd6.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/9e67772ea4f5f901680875d752274f1ab2960e08.b0d9b227c450318244ea.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/c15923e877d046642c5c4bb7a545da8c7902f093.54aefbced6bea3b5636f.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/framework.10d01910600f7384636d.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/main-13fee0077360089fadd9.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/_app-ffd8f0b50d11467c6341.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/_error-c8c05807f82d66d522a1.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog-2255b2399a5d78d1001f.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/%5Bname%5D-36982624e38360e8b358.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts-dc04afd4cbec6e385c46.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/books-26f60a3dd603e39ea127.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/cloud-mac-8264ff6812a928f17f73.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/growth-engineering-101-02e5fd9c4524e9d4ce9b.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/hiring-process-sucks-a62556372b4c3ffe2647.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/i-made-something-nobody-wants-1a01635a107a3d4f8c6b.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/drafts/open-source-analytics-dea9f358f041cb3fce2a.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/not-being-rich-made-me-more-curious-2c3937c1d594085ce531.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/products-die-relationships-last-c0218a11895bb8ef63b4.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/server-side-experimentation-testing-google-optimize-3d77e4d977dd95612a0f.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/sidecar-mac-e1f3bb6789eddc4456d6.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook-2f49c8c55bf23b58232f.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/build-a-product-a5f07f800ad9077a379b.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/get-your-first-user-8bf7bae9c808e590e991.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/go-fast-f3fff089e8ce33912ddc.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/office-hours-e70f4429c3f0a4d18f7d.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/problem-61f364e639e03d6510a4.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/solution-809fc5d09fefb5983ec0.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/talk-to-your-users-5da9dd230b0ee3d5e3a8.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/startup-notebook/track-your-metrics-d08122e0d76dcd227ef3.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/the-importance-of-being-earnest-61677f27a511f77816b6.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/blog/web-first-app-c9214cb68c0cde17dfd5.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/index-34429250b15ab7528fb0.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/pages/sitemap.xml-308ae9ff129e8075eb81.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/polyfills-4a2131197fb2e659efd8.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/chunks/webpack-d4a31b776c831d3b12d9.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/css/8deba1a6871bee9d70fd.css",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/css/927d95cec66e72e46594.css",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/kx_Pbonsr-9Gy_-IZVIq1/_buildManifest.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/_next/static/kx_Pbonsr-9Gy_-IZVIq1/_ssgManifest.js",revision:"kx_Pbonsr-9Gy_-IZVIq1"},{url:"/favicon.ico",revision:"36a09fb4ea4a8028321faa60ef66f41f"},{url:"/images/axel.png",revision:"3dbf27d796afc60c5d55e318b84d689b"},{url:"/images/go-objective.png",revision:"33c617491c6448845afaa2cdd02f1c03"},{url:"/images/go-targeting.png",revision:"8a4a84c5f431236e82747d5b5fe3dd4b"},{url:"/images/sidecar-mac-arrangement.png",revision:"c9a74a8e181858d122fdf82488f4d730"},{url:"/images/sidecar-mac-displays.png",revision:"e91b0d6ced3bb44bf01423482993540d"},{url:"/manifest.json",revision:"2d19618f637feaaa9565f7b2bcfcdb7b"},{url:"/robots.txt",revision:"6e701e04b2da020e15c6ca423cc70498"}],{ignoreURLParametersMatching:[]}),s.cleanupOutdatedCaches(),s.registerRoute("/",new s.NetworkFirst({cacheName:"start-url",plugins:[new s.ExpirationPlugin({maxEntries:1,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,new s.CacheFirst({cacheName:"google-fonts",plugins:[new s.ExpirationPlugin({maxEntries:4,maxAgeSeconds:31536e3,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,new s.StaleWhileRevalidate({cacheName:"static-font-assets",plugins:[new s.ExpirationPlugin({maxEntries:4,maxAgeSeconds:604800,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,new s.StaleWhileRevalidate({cacheName:"static-image-assets",plugins:[new s.ExpirationPlugin({maxEntries:64,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\.(?:js)$/i,new s.StaleWhileRevalidate({cacheName:"static-js-assets",plugins:[new s.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\.(?:css|less)$/i,new s.StaleWhileRevalidate({cacheName:"static-style-assets",plugins:[new s.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\.(?:json|xml|csv)$/i,new s.NetworkFirst({cacheName:"static-data-assets",plugins:[new s.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/\/api\/.*$/i,new s.NetworkFirst({cacheName:"apis",networkTimeoutSeconds:10,plugins:[new s.ExpirationPlugin({maxEntries:16,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET"),s.registerRoute(/.*/i,new s.NetworkFirst({cacheName:"others",networkTimeoutSeconds:10,plugins:[new s.ExpirationPlugin({maxEntries:32,maxAgeSeconds:86400,purgeOnQuotaError:!0})]}),"GET")}));