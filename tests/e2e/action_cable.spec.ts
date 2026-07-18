import { test, expect } from '@playwright/test'

test('connects to Action Cable through the Vite /cable proxy', async ({ page }) => {
  const corsErrors: string[] = []

  // Collect CORS/origin/rejection console messages from the browser
  page.on('console', (msg) => {
    const text = msg.text()
    if (/Access-Control|CORS|origin|forbidden|403|actioncable|websocket.*close/i.test(text)) {
      corsErrors.push(text)
    }
  })

  // Navigate so the page origin matches Vite (needed for correct WebSocket origin headers)
  await page.goto('/health')

  // Establish a real WebSocket from the browser context through Vite to Rails.
  // Uses Action Cable subprotocols. Resolves only after receiving JSON
  // {"type":"welcome"} from the server.
  const welcome = await page.evaluate(() => {
    return new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Timed out waiting for Action Cable welcome'))
      }, 10_000)

      const socket = new WebSocket('/cable', [
        'actioncable-v1-json',
        'actioncable-unsupported'
      ])

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data as string)
          if (data.type === 'welcome') {
            socket.close()
            clearTimeout(timeout)
            resolve(JSON.stringify(data))
          }
        } catch {
          // Non-JSON message — ignore until we get the welcome
        }
      }

      socket.onerror = () => {
        clearTimeout(timeout)
        reject(new Error('WebSocket error event'))
      }

      socket.onclose = (event) => {
        clearTimeout(timeout)
        if (event.code !== 1000 && event.code !== 1001) {
          reject(
            new Error(`WebSocket closed with code ${event.code}${event.reason ? ': ' + event.reason : ''}`)
          )
        }
      }
    })
  })

  expect(welcome).toContain('"type":"welcome"')
  expect(corsErrors).toEqual([])
})
