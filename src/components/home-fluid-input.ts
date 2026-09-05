export type HomeFluidPoint = readonly [number, number]
export type HomeFluidColor = readonly [number, number, number, number]
export type HomeFluidGravityWell = readonly [number, number, number, number]

export interface HomeFluidStroke {
  from: HomeFluidPoint
  to: HomeFluidPoint
  velocity: HomeFluidPoint
  color: HomeFluidColor
  strength: number
}

export const FLUID_ASPECT = 16 / 9
export const MAX_STROKES_PER_STEP = 8
const MAX_PENDING_STROKES = 32
const MAX_POINTER_VELOCITY = 2.5

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.max(minimum, Math.min(maximum, value))
}

export function screenPointToFluid(
  point: HomeFluidPoint,
  aspect: number
): HomeFluidPoint {
  return aspect < FLUID_ASPECT
    ? [0.5 + (point[0] - 0.5) * (aspect / FLUID_ASPECT), point[1]]
    : [point[0], 0.5 + (point[1] - 0.5) * (FLUID_ASPECT / aspect)]
}

function pointerColor(velocity: HomeFluidPoint): HomeFluidColor {
  const speed = Math.hypot(...velocity)
  const horizontal = speed > 0.001 ? velocity[0] / speed : 0
  const vertical = speed > 0.001 ? velocity[1] / speed : 0
  const cyan = clamp(0.52 + horizontal * 0.38 - vertical * 0.1, 0, 1)
  return [0.98 - 0.96 * cyan, 0.07 + 0.65 * cyan, 0.62 + 0.38 * cyan, 1]
}

/** Keep actual path segments between frames, including turns within one frame. */
export class PointerTrail {
  private previous: { point: HomeFluidPoint; time: number } | null = null
  private filteredVelocity: HomeFluidPoint | null = null
  private pending: HomeFluidStroke[] = []

  get active() {
    return this.pending.length > 0
  }

  reset() {
    this.previous = null
    this.filteredVelocity = null
    this.pending = []
  }

  move(point: HomeFluidPoint, time: number) {
    const previous = this.previous
    this.previous = { point, time }
    // A pause/re-entry starts a new stroke, never a line across the viewport.
    if (!previous || time <= previous.time || time - previous.time > 150) {
      this.filteredVelocity = null
      return
    }

    const dx = point[0] - previous.point[0]
    const dy = point[1] - previous.point[1]
    if (Math.hypot(dx * FLUID_ASPECT, dy) < 0.0001) return

    const dt = clamp((time - previous.time) / 1000, 0.001, 0.05)
    const speed = Math.hypot(dx, dy) / dt
    const scale = Math.min(1, MAX_POINTER_VELOCITY / speed) / dt
    const measured: HomeFluidPoint = [dx * scale, dy * scale]
    // Filter the force, not the path: soften jitter without a lagging cursor.
    const blend = 1 - Math.exp(-dt / 0.032)
    const velocity: HomeFluidPoint = this.filteredVelocity
      ? [
          this.filteredVelocity[0] +
            (measured[0] - this.filteredVelocity[0]) * blend,
          this.filteredVelocity[1] +
            (measured[1] - this.filteredVelocity[1]) * blend
        ]
      : measured
    this.filteredVelocity = velocity
    this.push({
      from: previous.point,
      to: point,
      velocity,
      color: pointerColor(velocity),
      strength: 1.3
    })
  }

  press(point: HomeFluidPoint, time: number) {
    this.previous = { point, time }
    this.filteredVelocity = null
    this.push({
      from: point,
      to: point,
      velocity: [0.16, 0],
      color: [0.54, 0.12, 1, 1],
      strength: 2
    })
  }

  take(): HomeFluidStroke[] {
    return this.pending.splice(0, MAX_STROKES_PER_STEP)
  }

  private push(stroke: HomeFluidStroke) {
    const last = this.pending[this.pending.length - 1]
    if (
      last &&
      last.strength === stroke.strength &&
      last.to[0] === stroke.from[0] &&
      last.to[1] === stroke.from[1]
    ) {
      const a = [
        (last.to[0] - last.from[0]) * FLUID_ASPECT,
        last.to[1] - last.from[1]
      ]
      const b = [
        (stroke.to[0] - stroke.from[0]) * FLUID_ASPECT,
        stroke.to[1] - stroke.from[1]
      ]
      const lengths = Math.hypot(...a) * Math.hypot(...b)
      // Merge nearly straight samples so polling rate does not multiply a stroke's intensity.
      if (lengths > 0 && (a[0] * b[0] + a[1] * b[1]) / lengths > 0.995) {
        this.pending[this.pending.length - 1] = { ...stroke, from: last.from }
        return
      }
    }
    this.pending.push(stroke)
    // Bound latency and GPU work on high-polling-rate mice.
    if (this.pending.length > MAX_PENDING_STROKES) this.pending.shift()
  }
}

/** Continuous animation time; resetting frame timing does not reset the aurora. */
export class AuroraClock {
  phase = 0
  private previous: number | null = null

  reset() {
    this.previous = null
  }

  advance(now: number) {
    const elapsed =
      this.previous === null ? 0 : clamp((now - this.previous) / 1000, 0, 0.05)
    this.previous = now
    this.phase += elapsed * 0.16
    return elapsed
  }
}
