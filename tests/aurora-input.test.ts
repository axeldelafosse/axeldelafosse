import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  AuroraClock,
  FLUID_ASPECT,
  MAX_STROKES_PER_STEP,
  PointerTrail,
  screenPointToFluid
} from '../src/components/home-fluid-input'

describe('aurora pointer input', () => {
  it('does not multiply straight-stroke intensity with mouse polling rate', () => {
    const trail = new PointerTrail()
    for (let i = 0; i <= 100; i++) trail.move([i / 100, 0.5], i)
    const strokes = trail.take()
    assert.equal(strokes.length, 1)
    assert.deepEqual(strokes[0].from, [0, 0.5])
    assert.deepEqual(strokes[0].to, [1, 0.5])
  })

  it('preserves a corner drawn between two rendered frames', () => {
    const trail = new PointerTrail()
    trail.move([0.2, 0.2], 0)
    trail.move([0.3, 0.4], 5)
    trail.move([0.4, 0.2], 10)
    const strokes = trail.take()
    assert.equal(strokes.length, 2)
    assert.deepEqual(strokes[0].to, [0.3, 0.4])
    assert.deepEqual(strokes[1].from, [0.3, 0.4])
    assert.deepEqual(trail.take(), [])
  })

  it('softens sudden force changes without moving the drawn path', () => {
    const trail = new PointerTrail()
    trail.move([0.3, 0.3], 0)
    trail.move([0.31, 0.3], 10)
    trail.take()
    trail.move([0.31, 0.32], 11)
    const [stroke] = trail.take()
    assert.deepEqual(stroke.from, [0.31, 0.3])
    assert.deepEqual(stroke.to, [0.31, 0.32])
    assert.ok(stroke.velocity[0] > 0.9)
    assert.ok(stroke.velocity[1] > 0 && stroke.velocity[1] < 0.1)
  })

  it('does not carry old momentum into a new stroke after a pause', () => {
    const trail = new PointerTrail()
    trail.move([0.3, 0.3], 0)
    trail.move([0.4, 0.3], 10)
    trail.take()
    trail.move([0.7, 0.7], 500)
    trail.move([0.6, 0.7], 510)
    const [stroke] = trail.take()
    assert.equal(stroke.velocity[0], -2.5)
    assert.equal(stroke.velocity[1], 0)
  })

  it('does not join strokes across blur, route changes, or pointer cancellation', () => {
    const trail = new PointerTrail()
    trail.move([0.1, 0.1], 0)
    trail.move([0.2, 0.2], 10)
    trail.reset()
    trail.move([0.9, 0.9], 30)
    assert.deepEqual(trail.take(), [])
    trail.move([0.8, 0.9], 40)
    assert.deepEqual(trail.take()[0].from, [0.9, 0.9])
  })

  it('does not deposit strokes while stationary or bridge a long pause', () => {
    const trail = new PointerTrail()
    trail.move([0.5, 0.5], 0)
    for (let i = 1; i < 10; i++) trail.move([0.5, 0.5], i * 10)
    trail.move([0.8, 0.8], 500)
    assert.equal(trail.active, false)
  })

  it('bounds pending work and diagonal speed on high-polling-rate mice', () => {
    const trail = new PointerTrail()
    for (let i = 0; i < 1000; i++) {
      trail.move([i % 2, i % 2], i)
    }
    let drained = 0
    while (trail.active) {
      const strokes = trail.take()
      assert.ok(strokes.length <= MAX_STROKES_PER_STEP)
      for (const stroke of strokes)
        assert.ok(Math.hypot(...stroke.velocity) <= 2.500001)
      drained += strokes.length
    }
    assert.ok(drained <= 32)
  })

  it('clicks create a single impulse with no painted path', () => {
    const trail = new PointerTrail()
    trail.press([0.5, 0.5], 5)
    const [stroke] = trail.take()
    assert.deepEqual(stroke.from, stroke.to)
    assert.equal(trail.active, false)
  })

  it('maps portrait and wide screens into the same centered fluid field', () => {
    for (const aspect of [0.5, 1, FLUID_ASPECT, 3]) {
      assert.deepEqual(screenPointToFluid([0.5, 0.5], aspect), [0.5, 0.5])
      const left = screenPointToFluid([0, 0.5], aspect)
      const right = screenPointToFluid([1, 0.5], aspect)
      assert.ok(Math.abs(left[0] + right[0] - 1) < 1e-8)
      assert.ok(left[0] >= 0 && right[0] <= 1)
    }
  })
})

describe('aurora animation time', () => {
  it('remains continuous past the previous 39-second reset', () => {
    const clock = new AuroraClock()
    for (let frame = 0; frame <= 2400; frame++)
      clock.advance((frame * 1000) / 60)
    assert.ok(Math.abs(clock.phase - 6.4) < 1e-6)
    assert.ok(clock.phase > Math.PI * 2)
  })

  it('resumes without jumping forward for time spent in another tab', () => {
    const clock = new AuroraClock()
    clock.advance(0)
    clock.advance(20)
    const phase = clock.phase
    clock.reset()
    assert.equal(clock.advance(60000), 0)
    assert.equal(clock.phase, phase)
  })

  it('does not advance backwards or catch up unbounded stalled frames', () => {
    const clock = new AuroraClock()
    clock.advance(100)
    assert.equal(clock.advance(90), 0)
    assert.equal(clock.advance(60000), 0.05)
  })
})
