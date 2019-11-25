import { resolve } from 'path'
import fetch from 'node-fetch'
import { joinUrl, setup, teardown } from '../_testHelpers/index'

declare var TEST_BASE_URL: string

jest.setTimeout(30000)

const { stringify } = JSON

describe('lambda invoke tests', () => {
  // init
  beforeAll(() =>
    setup({
      servicePath: resolve(__dirname),
    }),
  )

  // cleanup
  afterAll(() => teardown())

  //
  ;[
    {
      description: '...',
      expected: {
        StatusCode: 200,
        Payload: stringify({ foo: 'bar' }),
      },
      path: '/test-handler',
      status: 200,
    },
  ].forEach(({ description, expected, path, status }) => {
    test(description, async () => {
      const url = joinUrl(TEST_BASE_URL, path)

      const response = await fetch(url)
      expect(response.status).toEqual(status)

      const json = await response.json()
      expect(json).toEqual(expected)
    })
  })
})
