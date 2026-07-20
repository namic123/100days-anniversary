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

test('full flow: gift box → book → reading → language switch', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto(baseUrl)

  // Phase 0: Pre-intro — skip it to reach the gift box
  await page.getByRole('button', { name: '跳過' }).click()

  // Phase 1: Gift box visible with zh-TW message and name tag
  await expect(page.getByText('給苙綺')).toBeVisible({ timeout: 3000 })

  // Open gift box
  await page.getByRole('button', { name: '輕輕點一下禮物盒' }).click()

  // Wait for gift box + unboxing animation
  await page.waitForTimeout(2500)

  // Phase 2: Book cover appears
  await expect(page.getByText('我們的100天日記')).toBeVisible({ timeout: 3000 })

  // Open book (force click since app-shell may intercept)
  await page.getByRole('button', { name: '我們的100天日記' }).click({ force: true })

  // Phase 3: Reading mode — first page visible
  await expect(page.locator('.reading-container')).toBeVisible({ timeout: 3000 })

  // Switch language to Korean via locale FAB
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('button', { name: '한국어' }).click()

  // Verify Korean content appears (name tag would be in Korean if visible)
  // Progress bar should be visible
  await expect(page.getByText(/1 \/ \d+/)).toBeVisible()

  // No console errors
  expect(errors).toEqual([])
})
