import { resetAgent, setupAgent } from '../setup-agent'
import { Instrument as SessionReplay } from '../../../src/features/session_replay/instrument'
import * as nreumModule from '../../../src/common/window/nreum'
import { setConfiguration } from '../../../src/common/config/init'
import { getRuntime } from '../../../src/common/config/runtime'
import { MODE } from '../../specs/util/helpers'

let agentSetup

beforeAll(() => {
  agentSetup = setupAgent({
    init: {
      session_replay: { preload: false, enabled: true }
    }
  })
})

let session

beforeEach(() => {
  session = getRuntime(agentSetup.agentIdentifier).session
})

afterEach(() => {
  if (!getRuntime(agentSetup.agentIdentifier).session) {
    getRuntime(agentSetup.agentIdentifier).session = session
  }
  if (jest.mocked(nreumModule.gosNREUMOriginals).mock) {
    jest.mocked(nreumModule.gosNREUMOriginals).mockRestore()
  }

  resetAgent(agentSetup.agentIdentifier)
  jest.clearAllMocks()
})

describe('Replay', () => { // this is moreso a test of the SR-specific logic within importAggregator() of instrument-base.js
  test('does import with all pre-req settings on - no preload', async () => {
    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeUndefined()
    expect(sessionReplayInstrument.featAggregate).toBeDefined()
  })

  test('does not import if MutationObserver is missing', async () => {
    jest.spyOn(nreumModule, 'gosNREUMOriginals').mockImplementation(() => ({ o: { MO: undefined } }))

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeUndefined()
    expect(sessionReplayInstrument.featAggregate).toBeUndefined()
  })

  test('does not import if cookies_enabled is false', async () => {
    setConfiguration(agentSetup.agentIdentifier, { privacy: { cookies_enabled: false } })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeUndefined()
    expect(sessionReplayInstrument.featAggregate).toBeUndefined()
  })

  test('does not import if session_trace is disabled', async () => {
    setConfiguration(agentSetup.agentIdentifier, { session_trace: { enabled: false } })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeUndefined()
    expect(sessionReplayInstrument.featAggregate).toBeUndefined()
  })

  test('does not import if session does not exist or failed to init', async () => {
    jest.replaceProperty(getRuntime(agentSetup.agentIdentifier), 'session', undefined)

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeUndefined()
    expect(sessionReplayInstrument.featAggregate).toBeUndefined()
  })
})

describe('Preload early records', () => {
  beforeEach(() => {
    // setConfiguration(agentSetup.agentIdentifier, { session_trace: { enabled: true } })
    localStorage.clear()
  })

  test('with flag enabled and if session dne yet', async () => {
    jest.replaceProperty(getRuntime(agentSetup.agentIdentifier), 'session', undefined)
    setConfiguration(agentSetup.agentIdentifier, { session_replay: { preload: true, enabled: true } })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(true)
  })

  test('when replay already on in existing session, even if preload flag disabled', async () => {
    setConfiguration(agentSetup.agentIdentifier, { session_replay: { preload: false, enabled: true } })
    session.write({ sessionReplayMode: MODE.FULL })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(true)
  })

  test('when replay already on in existing session, even if flag enabled but a pre-req is not', async () => {
    setConfiguration(agentSetup.agentIdentifier, { privacy: { cookies_enabled: false }, session_replay: { preload: false, enabled: true } })
    session.write({ sessionReplayMode: MODE.FULL })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(true)
  })

  test('if replay is off in existing session, but all required flags are enabled', async () => {
    setConfiguration(agentSetup.agentIdentifier, { session_replay: { preload: true, enabled: true } })
    session.write({ sessionReplayMode: MODE.OFF })

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(true)
  })
})

describe('Preload recording stops if', () => {
  beforeAll(() => {
    setConfiguration(agentSetup.agentIdentifier, { session_replay: { preload: true, enabled: true } })
  })

  test('session entity fails to initialize', async () => {
    jest.doMock('../../../src/features/utils/agent-session', () => ({
      __esModule: true,
      setupAgentSession: jest.fn(() => { throw new Error('RIP') })
    }))
    jest.replaceProperty(getRuntime(agentSetup.agentIdentifier), 'session', undefined)

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(false)
  })

  test('replay aggregate fails to initialize', async () => {
    jest.doMock('../../../src/features/session_replay/aggregate', () => ({
      __esModule: true,
      setupAgentSession: jest.fn(() => { throw new Error('RIP') })
    }))

    const sessionReplayInstrument = new SessionReplay(agentSetup.agentIdentifier, agentSetup.aggregator)
    await new Promise(process.nextTick)

    expect(sessionReplayInstrument.recorder).toBeDefined()
    expect(sessionReplayInstrument.recorder.recording).toEqual(false)
  })
})
