/**
 * @vitest-environment node
 */
import express from 'express'
import { test, expect } from '../../../../playwright.extend'

test('does not interfere with a shared worker', async ({
  loadExample,
  spyOnConsole,
  waitFor,
  page,
}) => {
  const consoleSpy = spyOnConsole()
  await loadExample(new URL('./shared-worker.mocks.ts', import.meta.url), {
    beforeNavigation(compilation) {
      compilation.use((router) => {
        router.use(express.static(new URL('./', import.meta.url).pathname))
      })
    },
  })

  await page.evaluate(() => {
    const worker = new SharedWorker('./worker.js')

    worker.addEventListener('error', () =>
      console.error('There is an error with worker'),
    )

    worker.port.onmessage = (event) => {
      console.log(event.data)
    }

    worker.port.postMessage('john')
  })

  await waitFor(() => {
    expect(consoleSpy.get('error')).toBeUndefined()
    expect(consoleSpy.get('log')).toContain('hello, john')
  })
})
