import { resolve } from 'path'
import fetch from 'node-fetch'
import { joinUrl, setup, teardown } from '../../_testHelpers/index.js'

jest.setTimeout(120000)

describe('Provided with Docker tests', () => {
  if (!process.env.DOCKER_DETECTED) {
    test.only("Could not find 'Docker' executable, skipping 'Docker' tests.", () => {})
  } else {
    // init
    beforeAll(() =>
      setup({
        servicePath: resolve(__dirname),
      }),
    )

    // cleanup
    afterAll(() => teardown())
  }

  //
  ;[
    {
      description: 'should work with provided in docker container',
      expected: {
        message: 'Hello Provided!',
      },
      path: '/hello',
    },
  ].forEach(({ description, expected, path }) => {
    test(description, async () => {
      const url = joinUrl(TEST_BASE_URL, path)
      const response = await fetch(url)
      const json = await response.json()

      expect(json).toEqual(expected)
    })
  })
})
