import { defineConfig, type HtmlTagDescriptor, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'

import siteConfiguration from './.figma/make/site.json' with { type: 'json' }

// Slimmed from the Figma Make export: keeps React, Tailwind v4, the `@` alias
// and the `<!-- figma:* -->` slot substitution in index.html. The Figma-preview-only
// plugins (error overlay replay, refresh-boundary fallback, story kit) were dropped.
export default defineConfig(({ mode }) => ({
  base: process.env.FIGMA_PUBLIC_URL ? `${process.env.FIGMA_PUBLIC_URL}/` : '/',
  build: { sourcemap: mode === 'development' ? 'inline' : false },
  plugins: [react(), tailwindcss(), siteSlots(siteConfiguration)],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
  server: { host: '0.0.0.0', port: parseInt(process.env.PORT || '5173') },
}))

type SiteConfig = {
  title?: string
  description?: string
  language?: string
  accessibility?: { addBypassLinks?: boolean }
}

function siteSlots(config: SiteConfig): Plugin {
  const esc = (v: string) => v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const title = config.title ?? 'Nestly'
  const lang = (config.language ?? 'en').replace(/[^a-zA-Z0-9_-]/g, '') || 'en'
  return {
    name: 'nestly-site-slots',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        let out = html
          .replace('<!-- figma:lang -->', lang)
          .replace('<!-- figma:title -->', esc(title))
          .replace('<!-- figma:head-start -->', '')
          .replace('<!-- figma:head-end -->', '')
          .replace('<!-- figma:body-start -->', '')
          .replace('<!-- figma:body-end -->', '')
        const tags: HtmlTagDescriptor[] = []
        if (config.description) tags.push({ tag: 'meta', attrs: { name: 'description', content: config.description }, injectTo: 'head' })
        if (config.accessibility?.addBypassLinks) {
          tags.push(
            { tag: 'style', children: `.bypass-link{position:fixed;top:8px;left:8px;z-index:2147483647;transform:translateY(-150%);border-radius:6px;background:#111827;color:#fff;padding:8px 12px;font:600 14px/1.2 system-ui,sans-serif;text-decoration:none}.bypass-link:focus{transform:translateY(0)}`, injectTo: 'head' },
            { tag: 'a', attrs: { class: 'bypass-link', href: '#root' }, children: 'Skip to content', injectTo: 'body-prepend' },
          )
        }
        return { html: out, tags }
      },
    },
  }
}
