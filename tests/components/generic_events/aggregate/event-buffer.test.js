import { EventBuffer } from '../../../../src/features/generic_events/aggregate/event-buffer'

let eventBuffer

beforeEach(() => {
  eventBuffer = new EventBuffer()
})

test('has default values', () => {
  expect(eventBuffer).toMatchObject({
    bytes: 0,
    buffer: []
  })
})

describe('add', () => {
  test('should add data to the buffer while maintaining size', () => {
    expect(eventBuffer).toMatchObject({
      bytes: 0,
      buffer: []
    })

    const mockEvent = { test: 1 }

    eventBuffer.add(mockEvent)
    expect(eventBuffer).toMatchObject({
      bytes: JSON.stringify(mockEvent).length,
      buffer: [mockEvent]
    })
  })

  test('should not add if one event is too large', () => {
    eventBuffer.add({ test: 'x'.repeat(1000000) })
    expect(eventBuffer.buffer).toEqual([])
  })

  test('should not add if existing buffer would become too large', () => {
    eventBuffer.add({ test: 'x'.repeat(999988) })
    expect(eventBuffer.bytes).toEqual(999999)
    expect(eventBuffer.buffer.length).toEqual(1)
    eventBuffer.add({ test2: 'testing' })
    expect(eventBuffer.bytes).toEqual(999999)
    expect(eventBuffer.buffer.length).toEqual(1)
  })

  test('should be chainable', () => {
    const mockEvent1 = { test: 1 }
    const mockEvent2 = { test: 2 }
    eventBuffer.add(mockEvent1).add(mockEvent2)
    expect(eventBuffer).toMatchObject({
      bytes: JSON.stringify(mockEvent1).length + JSON.stringify(mockEvent2).length,
      buffer: [mockEvent1, mockEvent2]
    })
  })
})

describe('merge', () => {
  test('should merge two EventBuffers - append', () => {
    const mockEvent1 = { test: 1 }
    const mockEvent2 = { test: 2 }
    eventBuffer.add(mockEvent1)

    const secondBuffer = new EventBuffer()
    secondBuffer.add(mockEvent2)
    eventBuffer.merge(secondBuffer)
    expect(eventBuffer).toMatchObject({
      bytes: JSON.stringify({ test: 1 }).length + JSON.stringify({ test: 2 }).length,
      buffer: [mockEvent1, mockEvent2]
    })
  })

  test('should merge two EventBuffers - prepend', () => {
    const mockEvent1 = { test: 1 }
    const mockEvent2 = { test: 2 }
    eventBuffer.add(mockEvent1)

    const secondBuffer = new EventBuffer()
    secondBuffer.add(mockEvent2)
    eventBuffer.merge(secondBuffer, true)
    expect(eventBuffer).toMatchObject({
      bytes: JSON.stringify({ test: 1 }).length + JSON.stringify({ test: 2 }).length,
      buffer: [mockEvent2, mockEvent1]
    })
  })

  test('should not merge if not an EventBuffer', () => {
    eventBuffer.add({ test: 1 })
    // not EventBuffer
    eventBuffer.merge({ regular: 'object' })
    expect(eventBuffer.buffer).toEqual([{ test: 1 }])
    // not EventBuffer
    eventBuffer.merge('string')
    expect(eventBuffer.buffer).toEqual([{ test: 1 }])
    // not EventBuffer
    eventBuffer.merge(123)
    expect(eventBuffer.buffer).toEqual([{ test: 1 }])
    // not EventBuffer
    eventBuffer.merge(true)
    expect(eventBuffer.buffer).toEqual([{ test: 1 }])
    // not EventBuffer
    eventBuffer.merge(Symbol('test'))
    expect(eventBuffer.buffer).toEqual([{ test: 1 }])
  })

  test('should not merge if too big', () => {
    const mockEvent1 = { test: 'x'.repeat(999988) }
    const mockEvent2 = { test2: 'testing' }
    eventBuffer.add(mockEvent1)

    const secondBuffer = new EventBuffer()
    secondBuffer.add(mockEvent2)

    eventBuffer.merge(secondBuffer)
    expect(eventBuffer.buffer.length).toEqual(1)
    expect(eventBuffer.bytes).toEqual(999999)
  })

  test('should be chainable', () => {
    const mockEvent1 = { test1: 1 }
    const mockEvent2 = { test2: 2 }
    const mockEvent3 = { test3: 3 }

    const secondBuffer = new EventBuffer()
    const thirdBuffer = new EventBuffer()

    eventBuffer.add(mockEvent1)
    secondBuffer.add(mockEvent2)
    thirdBuffer.add(mockEvent3)

    eventBuffer.merge(secondBuffer).merge(thirdBuffer)
    expect(eventBuffer).toMatchObject({
      bytes: JSON.stringify(mockEvent1).length + JSON.stringify(mockEvent2).length + JSON.stringify(mockEvent3).length,
      buffer: [mockEvent1, mockEvent2, mockEvent3]
    })
  })
})

describe('hasData', () => {
  test('should return false if no events', () => {
    eventBuffer.bytes = 100
    expect(eventBuffer.hasData).toEqual(false)
  })
  test('should return false if no bytes', () => {
    eventBuffer.buffer.push({ test: 1 })
    expect(eventBuffer.hasData).toEqual(false)
  })
  test('should return true if has a valid event and size', () => {
    eventBuffer.add({ test: 1 })
    expect(eventBuffer.hasData).toEqual(true)
  })
})

describe('canMerge', () => {
  test('should return false if would be too big', () => {
    eventBuffer.bytes = 999999
    expect(eventBuffer.canMerge(1)).toEqual(false)
  })
  test('should return false if no size provided', () => {
    eventBuffer.buffer.push({ test: 1 })
    expect(eventBuffer.canMerge()).toEqual(false)
  })
  test('should return false if size is not a number', () => {
    eventBuffer.buffer.push({ test: 1 })
    expect(eventBuffer.canMerge('test')).toEqual(false)
    expect(eventBuffer.canMerge(false)).toEqual(false)
    expect(eventBuffer.canMerge(['test'])).toEqual(false)
    expect(eventBuffer.canMerge({ test: 1 })).toEqual(false)
  })
  test('should return true if has a valid event and size', () => {
    eventBuffer.add({ test: 1 })
    expect(eventBuffer.canMerge(20)).toEqual(true)
  })
})
