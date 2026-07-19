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

test('opens the placeholder anniversary page', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text())
    }
  })

  await page.goto(baseUrl)
  await expect(page.getByRole('heading', { name: '寫給苙綺的100天紀錄' })).toBeVisible()
  await page.getByRole('button', { name: 'Open anniversary letter' }).click()
  await expect(page.getByRole('heading', { name: '我們的第一個100天' })).toBeVisible()
  await page.getByRole('button', { name: '한국어' }).click()
  await expect(page.getByRole('heading', { name: '苙綺에게 보내는 100일의 기록' })).toBeVisible()
  expect(errors).toEqual([])
})
