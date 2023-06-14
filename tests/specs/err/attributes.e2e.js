describe('error attributes with spa loader', () => {
  describe('custom attributes', () => {
    it('sets multiple custom attributes after page load with multiple JS errors occurring after page load', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-with-custom-attribute.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        await $('#trigger').then(async (trigger) => {
          await trigger.click()
          await trigger.click()
          await trigger.click()
        })
      ])

      expect(errorResult.request.body.err.length).toBe(3) // exactly 3 errors in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(0)
      expect(errorResult.request.body.err[1].custom.customParamKey).toBe(1)
      expect(errorResult.request.body.err[2].custom.customParamKey).toBe(2)
    })

    it('sets single custom attribute before page load with single JS error occurring before page load', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-with-error-before-page-load.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1)
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(0)
    })

    it('sets custom attribute before page load, after loader, before info', async () => {
      await browser.url(await browser.testHandle.assetURL('custom-attribute-race-condition.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(0)
    })

    it('sets custom attribute with pre-existing attributes before page load, after loader, before info', async () => {
      await browser.url(await browser.testHandle.assetURL('pre-existing-custom-attribute-race-condition.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(0)
      expect(errorResult.request.body.err[0].custom.hi).toBe('mom')
    })

    it('sets custom attribute with pre-existing attributes before page load, after loader, before info precedence check', async () => {
      await browser.url(await browser.testHandle.assetURL('pre-existing-custom-attribute-race-condition-precedence.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(0)
    })

    it('sets multiple custom attributes before page load with multiple JS errors occurring after page load', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-with-error-after-page-load.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        $('#trigger').then(async (trigger) => {
          await trigger.click()
          await trigger.click()
          await trigger.click()
          browser.refresh()
        })
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(2)
      expect(errorResult.request.body.err[0].metrics.count).toBe(3)
    })

    it('noticeError accepts custom attributes in an argument', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-noticeerror-with-custom-attributes.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.custom1).toBe('val1')
      expect(errorResult.request.body.err[0].custom.custom2).toBe('val2')
    })
  })

  describe('initial load interaction', () => {
    it('simple case - single error', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-set-attribute-before-load.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(1)
    })

    it('muliple errors - different attribute values', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-multiple-set-attribute-before-load.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(3) // exactly 3 errors in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(3)
      expect(errorResult.request.body.err[1].custom.customParamKey).toBe(3)
      expect(errorResult.request.body.err[2].custom.customParamKey).toBe(3)
    })
  })

  describe('click interaction', () => {
    it('simple case - single error', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-set-attribute-on-click.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        $('#trigger').then(async (trigger) => {
          await trigger.click()
          browser.refresh()
        })
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(1)
    })

    it('multiple errors - different attribute values', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-multiple-set-attribute-on-click.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        $('#trigger').then(async (trigger) => {
          await trigger.click()
          browser.refresh()
        })
      ])

      expect(errorResult.request.body.err.length).toBe(3) // exactly 3 errors in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(3)
      expect(errorResult.request.body.err[1].custom.customParamKey).toBe(3)
      expect(errorResult.request.body.err[2].custom.customParamKey).toBe(3)
    })

    it('attributes captured in discarded interaction are still collected', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-set-attribute-on-discarded.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        $('#trigger').then(async (trigger) => {
          await trigger.click()
          browser.refresh()
        })
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.customParamKey).toBe(1)
    })
  })

  describe('interaction attributes', () => {
    it('global and interaction attributes on same error', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-global-and-interaction-attributes-on-same-error.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.globalKey).toBe(1)
      expect(errorResult.request.body.err[0].custom.localKey).toBe(2)
    })
  })

  describe('precedence', () => {
    it('setAttribute takes precedence over setCustomAttribute', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-attribute-precedence.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.localKey).toBe(2) // first error should have value from setAttribute
    })

    it('noticeError takes precedence over setAttribute', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-noticeerror-precedence.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        browser.refresh()
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.custom1).toBe('val2') // error should have value from noticeError
    })

    it('noticeError takes precedence over setAttribute in discarded interactions', async () => {
      await browser.url(await browser.testHandle.assetURL('js-error-noticeerror-precedence-discarded.html'))
        .then(() => browser.waitForAgentLoad())

      const [errorResult] = await Promise.all([
        browser.testHandle.expectErrors(),
        $('#trigger').then(async (trigger) => {
          await trigger.click()
          browser.refresh() // forces harvest
        })
      ])

      expect(errorResult.request.body.err.length).toBe(1) // exactly 1 error in payload
      expect(errorResult.request.body.err[0].custom.custom1).toBe('val1') // error should have value from noticeError
    })
  })
})
