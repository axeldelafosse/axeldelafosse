import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import vm from 'node:vm'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ThemeToggle from '../src/components/theme-toggle'
import { THEME_STORAGE_KEY, themeInitScript } from '../src/lib/theme'

const source = new Bun.Transpiler({ loader: 'ts' })
  .transformSync(
    readFileSync(new URL('../src/lib/theme.ts', import.meta.url), 'utf8')
  )
  .replace(/^export /gm, '')

function createBrowser(saved = null, blocked = false) {
  const classes = new Set(['dark', 'unrelated-class'])
  const values = new Map(saved === null ? [] : [[THEME_STORAGE_KEY, saved]])
  const localStorage = {
    getItem(key) {
      if (blocked) throw new Error('Storage blocked')
      return values.get(key) ?? null
    },
    setItem(key, value) {
      if (blocked) throw new Error('Storage blocked')
      values.set(key, value)
    }
  }
  const window = new EventTarget()
  const context = vm.createContext({
    window,
    localStorage,
    Event,
    matchMedia: () => {
      throw new Error('Must never follow system theme')
    },
    document: {
      documentElement: {
        classList: {
          contains: (name) => classes.has(name),
          toggle(name, enabled) {
            if (enabled) classes.add(name)
            else classes.delete(name)
          }
        }
      }
    }
  })
  vm.runInContext(source, context)
  return {
    classes,
    values,
    init: () => vm.runInContext(themeInitScript, context),
    theme: () => vm.runInContext('getTheme()', context),
    set: (theme) => vm.runInContext(`setTheme('${theme}')`, context),
    subscribe: (callback) => context.subscribeToTheme(callback),
    storageEvent(key = THEME_STORAGE_KEY, storageArea = localStorage) {
      window.dispatchEvent(
        Object.assign(new Event('storage'), { key, storageArea })
      )
    }
  }
}

describe('explicit blog theme', () => {
  for (const saved of [null, 'dark', 'system', 'invalid']) {
    it(`defaults to dark with saved value ${saved}`, () => {
      const browser = createBrowser(saved)
      browser.init()
      assert.equal(browser.theme(), 'dark')
    })
  }

  it('restores only an explicit light choice before rendering', () => {
    const browser = createBrowser('light')
    browser.init()
    browser.init()
    assert.equal(browser.theme(), 'light')
    assert.ok(browser.classes.has('unrelated-class'))
  })

  it('starts dark and remains toggleable when storage is blocked', () => {
    const browser = createBrowser('light', true)
    browser.init()
    assert.equal(browser.theme(), 'dark')
    browser.set('light')
    assert.equal(browser.theme(), 'light')
  })

  it('persists both choices and notifies mounted toggles', () => {
    const browser = createBrowser()
    let changes = 0
    browser.subscribe(() => changes++)
    for (const theme of ['light', 'dark']) {
      browser.set(theme)
      assert.equal(browser.theme(), theme)
      assert.equal(browser.values.get(THEME_STORAGE_KEY), theme)
    }
    assert.equal(changes, 2)
  })

  it('syncs choices from another tab, including clearing the preference', () => {
    const browser = createBrowser()
    let changes = 0
    browser.subscribe(() => changes++)
    browser.values.set(THEME_STORAGE_KEY, 'light')
    browser.storageEvent()
    assert.equal(browser.theme(), 'light')
    browser.values.clear()
    browser.storageEvent(null)
    assert.equal(browser.theme(), 'dark')
    assert.equal(changes, 2)
  })

  it('ignores unrelated storage events and cleans up subscriptions', () => {
    const browser = createBrowser()
    let changes = 0
    const unsubscribe = browser.subscribe(() => changes++)
    browser.values.set(THEME_STORAGE_KEY, 'light')
    browser.storageEvent('other-key')
    browser.storageEvent(THEME_STORAGE_KEY, {})
    assert.equal(browser.theme(), 'dark')
    unsubscribe()
    browser.storageEvent()
    browser.set('light')
    assert.equal(changes, 0)
  })

  it('renders an accessible dark-default button without browser globals', () => {
    const html = renderToStaticMarkup(createElement(ThemeToggle))
    assert.match(html, /type="button"/)
    assert.match(html, /aria-label="Switch to light mode"/)
    assert.match(html, /aria-hidden="true"/)
  })
})
