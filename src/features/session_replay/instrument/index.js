/*
 * Copyright 2023 New Relic Corporation. All rights reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * @file Primes the Session Replay feature for lazy loading.
 *
 * NOTE: This code is under development and dormant. It will not download to instrumented pages or record any data.
 * It is not production ready, and is not intended to be imported or implemented in any build of the browser agent until
 * functionality is validated and a full user experience is curated.
 */
import { MODE } from '../../../common/session/constants'
import { InstrumentBase } from '../../utils/instrument-base'
import { FEATURE_NAME } from '../constants'

export class Instrument extends InstrumentBase {
  static featureName = FEATURE_NAME
  constructor (agentIdentifier, aggregator, auto = true) {
    super(agentIdentifier, aggregator, FEATURE_NAME, auto)
    try {
      const session = JSON.parse(localStorage.getItem('NRBA_SESSION'))
      if (session.sessionReplayMode !== MODE.OFF) {
        this.#startRecording(session.sessionReplayMode)
      } else {
        this.importAggregator({})
      }
    } catch (err) {
      this.importAggregator({})
    }
  }

  async #startRecording (mode) {
    const { Recorder } = (await import(/* webpackChunkName: "recorder" */'../shared/recorder'))
    this.recorder = new Recorder({ mode, agentIdentifier: this.agentIdentifier })
    this.recorder.startRecording()
    this.importAggregator({ recorder: this.recorder })
  }
}
