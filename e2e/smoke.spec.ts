import { expect, test } from '@playwright/test'
import { createServer, type Server } from 'node:http'
import { readFile } from 'node:fs/promises'
import { extname, join, resolve } from 'node:path'

let server: Server
let baseUrl: string

const mimeTypes: Record<string, string> = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mp3': 'audio/mpeg',
  '.txt': 'text/plain; charset=utf-8',
}

test.beforeAll(async () => {
  const distRoot = resolve('dist')

  server = createServer(async (request, response) => {
    const url = new URL(request.url ?? '/', 'http://127.0.0.1')
    const requestedPath = url.pathname === '/' ? '/index.html' : url.pathname
    const filePath = join(distRoot, requestedPath)

    try {
      const body = await readFile(filePath)
      response.writeHead(200, {
        'content-type': mimeTypes[extname(filePath)] ?? 'application/octet-stream',
      })
      response.end(body)
    } catch {
      response.writeHead(404)
      response.end('Not found')
    }
  })

  await new Promise<void>((resolveServer) => {
    server.listen(0, '127.0.0.1', resolveServer)
  })

  const address = server.address()
  if (!address || typeof address === 'string') {
    throw new Error('Unable to start static test server')
  }
  baseUrl = `http://127.0.0.1:${address.port}`
})

test.afterAll(async () => {
  await new Promise<void>((resolveClose, rejectClose) => {
    server.close((error) => {
      if (error) {
        rejectClose(error)
        return
      }
      resolveClose()
    })
  })
})

test('full flow: WebGL gift scene → book opens → reading → language switch', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto(baseUrl)

  // Phase 0: Pre-intro — skip it to reach the gift scene
  await page.getByRole('button', { name: '跳過' }).click()

  // Phase 1: WebGL gift scene mounts and boots (its gift message shows).
  const scene = page.locator('.gsx-root')
  await expect(scene).toBeVisible({ timeout: 15_000 })
  await expect(page.locator('.gsx-gift-message.show')).toBeVisible({ timeout: 15_000 })

  // Assert WebGL rendered (not the reduced-motion / no-WebGL CSS fallback).
  await expect(page.locator('.gsx-fallback')).toHaveCount(0)

  const canvas = page.locator('canvas.gsx-canvas')

  // Tap the scene to open the box; wait for the diary to rise and present.
  // (Timeouts are generous: the box→rise→present choreography is several seconds
  // and runs slower under software WebGL in headless CI.)
  await canvas.click()
  await expect(page.locator('.gsx-root[data-gs-phase="bookready"]')).toBeVisible({ timeout: 40_000 })

  // Tap again to open the book cover; the app then crosses into reading mode.
  await canvas.click()

  // Phase 2: Reading mode — the reading container is present.
  await expect(page.locator('.reading-container')).toBeVisible({ timeout: 40_000 })

  // Switch language to Korean via the locale FAB.
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('button', { name: '한국어' }).click()

  // Progress "1 / N" should be visible.
  await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 5_000 })

  // No console errors.
  expect(errors).toEqual([])
})
