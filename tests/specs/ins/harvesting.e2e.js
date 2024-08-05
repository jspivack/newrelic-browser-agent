const now = require('../../lib/now.js')

describe('ins harvesting', () => {
  it('should submit PageActions', async () => {
    const testUrl = await browser.testHandle.assetURL('instrumented.html')
    await browser.url(testUrl)
      .then(() => browser.waitForAgentLoad())

    const [{ request: { body: { ins: pageActionsHarvest }, query } }] = await Promise.all([
      browser.testHandle.expectIns(),
      browser.execute(function () {
        newrelic.addPageAction('DummyEvent', { free: 'tacos' })
      })
    ])

    expect(pageActionsHarvest.length).toEqual(1)
    let event = pageActionsHarvest[0]
    expect(event.actionName).toEqual('DummyEvent')
    expect(event.free).toEqual('tacos')
    let receiptTime = now()
    let relativeHarvestTime = query.rst
    let estimatedPageLoad = receiptTime - relativeHarvestTime
    let eventTimeSinceLoad = event.timeSinceLoad * 1000
    let estimatedEventTime = eventTimeSinceLoad + estimatedPageLoad
    expect(relativeHarvestTime > eventTimeSinceLoad).toEqual(true) //, 'harvest time (' + relativeHarvestTime + ') should always be bigger than event time (' + eventTimeSinceLoad + ')')
    expect(estimatedEventTime < receiptTime).toEqual(true) //, 'estimated event time (' + estimatedEventTime + ') < receipt time (' + receiptTime + ')')
  })

  it('should honor payload precedence', async () => {
    const testUrl = await browser.testHandle.assetURL('instrumented.html')
    await browser.url(testUrl)
      .then(() => browser.waitForAgentLoad())

    const [{ request: { body: { ins: pageActionsHarvest } } }] = await Promise.all([
      browser.testHandle.expectIns(),
      browser.execute(function () {
        newrelic.setCustomAttribute('browserHeight', 705)
        newrelic.setCustomAttribute('eventType', 'globalPageAction')
        newrelic.setCustomAttribute('globalCustomAttribute', 12345)
        newrelic.addPageAction('MyEvent', { referrerUrl: 'http://test.com', localCustomAttribute: { bar: 'baz' }, eventType: 'localPageAction' })
      })
    ])

    expect(pageActionsHarvest.length).toEqual(1)

    let event = pageActionsHarvest[0]
    expect(event.actionName).toEqual('MyEvent')
    expect(event.eventType).toEqual('PageAction') //, 'pageAction should not be overwritable (globalPageAction, localPageAction)
    expect(event.browserHeight).not.toEqual(705) //, 'browser height should not be overwritable'
    expect(event.globalCustomAttribute).toEqual(12345) //, 'global custom attributes passed through')
    expect(event.localCustomAttribute).toEqual('{"bar":"baz"}') //, 'local custom attributes passed through')
  })

  it('NEWRELIC-9370: should not throw an exception when calling addPageAction with window.location before navigating', async () => {
    const testUrl = await browser.testHandle.assetURL('api/addPageAction-unload.html')
    await browser.url(testUrl)
      .then(() => browser.waitForAgentLoad())

    const [pageActionsHarvest] = await Promise.all([
      browser.testHandle.expectIns(),
      browser.testHandle.expectErrors(10000, true),
      browser.execute(function () {
        window.triggerPageActionNavigation()
      })
    ])

    expect((await pageActionsHarvest).request.body.ins).toEqual(expect.arrayContaining([
      expect.objectContaining({
        actionName: 'pageaction',
        href: testUrl
      })
    ]))
  })
})
