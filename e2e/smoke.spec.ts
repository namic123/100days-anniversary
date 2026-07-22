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

test('full flow: gift scene → reading → language switch', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto(baseUrl)

  // Phase 0: Pre-intro — skip it to reach the gift scene.
  await page.getByRole('button', { name: '跳過' }).click()

  // Phase 1: the gift scene mounts. It renders the WebGL scene when WebGL is
  // available, or a CSS fallback otherwise (e.g. headless CI without a GPU).
  // The smoke test verifies the flow reaches the diary without console errors,
  // NOT that WebGL renders (WebGL is verified separately), so advance through
  // whichever path is present — the WebGL skip button or the fallback control.
  await expect(page.locator('.gsx-root')).toBeVisible({ timeout: 15_000 })

  const fallback = page.locator('.gsx-fallback')
  const skip = page.locator('.gsx-skip.show')
  await expect(fallback.or(skip)).toBeVisible({ timeout: 20_000 })
  if (await fallback.isVisible()) {
    await page.locator('.gsx-fb-stage').click()
  } else {
    await skip.click()
  }

  // Phase 2: Reading mode — the reading container is present.
  await expect(page.locator('.reading-container')).toBeVisible({ timeout: 20_000 })

  // Switch language to Korean via the locale FAB.
  await page.getByRole('button', { name: 'Language' }).click()
  await page.getByRole('button', { name: '한국어' }).click()

  // The diary folio "1 / N" should be visible (reader starts on page 1).
  await expect(page.getByText(/1 \/ \d+/)).toBeVisible({ timeout: 5_000 })

  // No console errors.
  expect(errors).toEqual([])
})
