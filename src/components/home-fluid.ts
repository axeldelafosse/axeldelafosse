import {
  compute,
  pingPongStorage,
  storage,
  type Effect,
  type Frame,
  type Gpu,
  type PingPongStorage,
  type StorageBuffer,
  type Target
} from 'vgpu'

import advectDyeShader from './home-fluid-advect-dye.wgsl'
import advectVelocityShader from './home-fluid-advect-velocity.wgsl'
import curlShader from './home-fluid-curl.wgsl'
import divergenceShader from './home-fluid-divergence.wgsl'
import pressureShader from './home-fluid-pressure.wgsl'
import projectShader from './home-fluid-project.wgsl'
import vorticityShader from './home-fluid-vorticity.wgsl'
import {
  MAX_STROKES_PER_STEP,
  type HomeFluidGravityWell,
  type HomeFluidStroke
} from './home-fluid-input'
export type {
  HomeFluidColor,
  HomeFluidGravityWell,
  HomeFluidPoint,
  HomeFluidStroke
} from './home-fluid-input'

export const HOME_FLUID_GRID_SIZE = [128, 72] as const
export const HOME_FLUID_DYE_SIZE = [512, 288] as const

const GRID_CELLS = HOME_FLUID_GRID_SIZE[0] * HOME_FLUID_GRID_SIZE[1]
const DYE_CELLS = HOME_FLUID_DYE_SIZE[0] * HOME_FLUID_DYE_SIZE[1]
// Track every shader so editing a compute pass also replaces its live pipeline.
export const HOME_FLUID_SHADER_REVISION = [
  advectDyeShader,
  advectVelocityShader,
  curlShader,
  divergenceShader,
  pressureShader,
  projectShader,
  vorticityShader
]
  .map((shader) => shader.wgsl)
  .join('\n')

export interface HomeFluidInput {
  strokes?: readonly HomeFluidStroke[]
  logoWell?: HomeFluidGravityWell
  postWell?: HomeFluidGravityWell
}

export interface HomeFluidFields {
  dye: StorageBuffer
  velocity: StorageBuffer
}

export interface HomeFluidDisplayConfig {
  time: number
  aspect: number
  logoWell: HomeFluidGravityWell
  postWell: HomeFluidGravityWell
}

interface HomeFluidPasses {
  advectVelocity: ReturnType<typeof compute>
  curl: ReturnType<typeof compute>
  vorticity: ReturnType<typeof compute>
  divergence: ReturnType<typeof compute>
  pressure: ReturnType<typeof compute>
  project: ReturnType<typeof compute>
  advectDye: ReturnType<typeof compute>
}

export interface HomeFluid {
  readonly gpu: Gpu
  readonly velocity: PingPongStorage
  readonly dye: PingPongStorage
  readonly pressure: PingPongStorage
  readonly divergence: StorageBuffer
  readonly curl: StorageBuffer
  readonly passes: HomeFluidPasses
  time: number
  lastInputTime: number
  outputSize: [number, number]
  destroyed: boolean
}

export function createHomeFluid(gpu: Gpu): HomeFluid {
  const allocated: StorageBuffer[] = []

  try {
    const velocity = pingPongStorage(gpu, GRID_CELLS * 8)
    allocated.push(velocity.read, velocity.write)
    const dye = pingPongStorage(gpu, DYE_CELLS * 16)
    allocated.push(dye.read, dye.write)
    const pressure = pingPongStorage(gpu, GRID_CELLS * 4)
    allocated.push(pressure.read, pressure.write)
    const divergence = storage(gpu, GRID_CELLS * 4, 'read-write')
    allocated.push(divergence)
    const curl = storage(gpu, GRID_CELLS * 4, 'read-write')
    allocated.push(curl)

    return {
      gpu,
      velocity,
      dye,
      pressure,
      divergence,
      curl,
      passes: createPasses(gpu),
      time: 0,
      lastInputTime: -1000,
      outputSize: [1, 1],
      destroyed: false
    }
  } catch (error) {
    for (const buffer of allocated) destroyBuffer(buffer)
    throw error
  }
}

export async function prepareHomeFluid(
  fluid: HomeFluid,
  output: Target,
  display: Effect,
  config: HomeFluidDisplayConfig
): Promise<void> {
  assertLive(fluid)
  resizeHomeFluid(fluid, output)
  bindHomeFluidDisplay(fluid, display, config)
  await display.compile({ colors: [output.format] })
}

export function resizeHomeFluid(fluid: HomeFluid, output: Target): void {
  assertLive(fluid)
  fluid.outputSize = [output.size[0], output.size[1]]
}

export function stepHomeFluid(
  fluid: HomeFluid,
  input: HomeFluidInput = {},
  deltaTime = 1 / 60
): void {
  assertLive(fluid)
  const dt = clampFinite(deltaTime, 1 / 120, 1 / 30, 1 / 60)
  if (input.strokes?.length) fluid.lastInputTime = fluid.time

  const dynamic = inputUniforms(fluid, input, dt)
  const passes = fluid.passes

  passes.advectVelocity
    .set({
      input: dynamic,
      src: fluid.velocity.read,
      dst: fluid.velocity.write
    })
    .dispatch(16, 9)
  fluid.velocity.swap()

  passes.curl
    .set({ velocity: fluid.velocity.read, curl: fluid.curl })
    .dispatch(16, 9)
  passes.vorticity
    .set({
      params: { dt },
      src: fluid.velocity.read,
      curl: fluid.curl,
      dst: fluid.velocity.write
    })
    .dispatch(16, 9)
  fluid.velocity.swap()

  passes.divergence
    .set({ velocity: fluid.velocity.read, divergence: fluid.divergence })
    .dispatch(16, 9)

  for (let iteration = 0; iteration < 3; iteration++) {
    passes.pressure
      .set({
        params: { decay: iteration === 0 ? Math.pow(0.8, dt * 60) : 1 },
        src: fluid.pressure.read,
        divergence: fluid.divergence,
        dst: fluid.pressure.write
      })
      .dispatch(16, 9)
    fluid.pressure.swap()
  }

  passes.project
    .set({
      src: fluid.velocity.read,
      pressure: fluid.pressure.read,
      dst: fluid.velocity.write
    })
    .dispatch(16, 9)
  fluid.velocity.swap()

  passes.advectDye
    .set({
      input: dynamic,
      src: fluid.dye.read,
      velocity: fluid.velocity.read,
      dst: fluid.dye.write
    })
    .dispatch(64, 36)
  fluid.dye.swap()
  fluid.time += dt
}

export function renderHomeFluid(
  fluid: HomeFluid,
  currentFrame: Frame,
  output: Target,
  display: Effect,
  config: HomeFluidDisplayConfig
): void {
  assertLive(fluid)

  if (
    output.size[0] !== fluid.outputSize[0] ||
    output.size[1] !== fluid.outputSize[1]
  ) {
    resizeHomeFluid(fluid, output)
  }

  bindHomeFluidDisplay(fluid, display, config)
  currentFrame.pass(output, display)
}

export function getHomeFluidFields(fluid: HomeFluid): HomeFluidFields {
  assertLive(fluid)
  return {
    dye: fluid.dye.read,
    velocity: fluid.velocity.read
  }
}

export function bindHomeFluidDisplay(
  fluid: HomeFluid,
  display: Effect,
  config: HomeFluidDisplayConfig
): void {
  const fields = getHomeFluidFields(fluid)
  display.set({
    config: {
      output_size: fluid.outputSize,
      time: config.time,
      aspect: config.aspect,
      logo_well: config.logoWell,
      post_well: config.postWell
    },
    dye: fields.dye,
    velocity: fields.velocity
  })
}

export function destroyHomeFluid(fluid: HomeFluid): void {
  if (fluid.destroyed) return
  fluid.destroyed = true

  const buffers = [
    fluid.velocity.read,
    fluid.velocity.write,
    fluid.dye.read,
    fluid.dye.write,
    fluid.pressure.read,
    fluid.pressure.write,
    fluid.divergence,
    fluid.curl
  ]

  for (const buffer of buffers) destroyBuffer(buffer)
}

function createPasses(gpu: Gpu): HomeFluidPasses {
  const withGrid = (shader: typeof advectVelocityShader) =>
    compute(gpu, shader, {
      set: {
        grid: {
          size: HOME_FLUID_GRID_SIZE,
          dye_size: HOME_FLUID_DYE_SIZE
        }
      }
    })

  return {
    advectVelocity: withGrid(advectVelocityShader),
    curl: withGrid(curlShader),
    vorticity: withGrid(vorticityShader),
    divergence: withGrid(divergenceShader),
    pressure: withGrid(pressureShader),
    project: withGrid(projectShader),
    advectDye: withGrid(advectDyeShader)
  }
}

function inputUniforms(fluid: HomeFluid, input: HomeFluidInput, dt: number) {
  const time = fluid.time
  const sinceInput = time - fluid.lastInputTime
  const idle = 0.15 + 0.85 * Math.max(0, Math.min(1, sinceInput - 1.5))
  const ramp = Math.min(1, (time + dt) / 0.4)
  const strokes = (input.strokes ?? []).slice(0, MAX_STROKES_PER_STEP)
  return {
    time,
    dt,
    stroke_count: strokes.length,
    idle_a: [
      0.5 + 0.28 * Math.sin(0.73 * time),
      0.5 + 0.22 * Math.sin(1.09 * time + 0.4),
      ramp * idle,
      0.006
    ],
    idle_b: [
      0.5 + 0.26 * Math.sin(0.61 * time + Math.PI),
      0.5 + 0.24 * Math.sin(0.97 * time + 2.1),
      ramp * idle,
      0.0055
    ],
    logo_well: gravityWellValue(input.logoWell),
    post_well: gravityWellValue(input.postWell),
    strokes: Array.from({ length: MAX_STROKES_PER_STEP }, (_, i) => {
      const stroke = strokes[i]
      return {
        from_to: [
          ...finiteVector(stroke?.from, 0, 1, 0.5),
          ...finiteVector(stroke?.to, 0, 1, 0.5)
        ],
        velocity_strength: [
          ...finiteVector(stroke?.velocity, -2.5, 2.5, 0),
          clampFinite(stroke?.strength ?? 0, 0, 2.5, 0),
          0
        ],
        color: [0, 1, 2, 3].map((channel) =>
          clampFinite(stroke?.color[channel] ?? 0, 0, 4, 0)
        )
      }
    })
  }
}

function finiteVector(
  value: readonly number[] | undefined,
  minimum: number,
  maximum: number,
  fallback: number
) {
  return [
    clampFinite(value?.[0] ?? fallback, minimum, maximum, fallback),
    clampFinite(value?.[1] ?? fallback, minimum, maximum, fallback)
  ]
}

function gravityWellValue(
  value?: HomeFluidGravityWell
): [number, number, number, number] {
  return [
    clampFinite(value?.[0] ?? 0.5, 0, 1, 0.5),
    clampFinite(value?.[1] ?? 0.5, 0, 1, 0.5),
    clampFinite(value?.[2] ?? 0.1, 0.02, 0.5, 0.1),
    clampFinite(value?.[3] ?? 0, 0, 1, 0)
  ]
}

function clampFinite(
  value: number,
  minimum: number,
  maximum: number,
  fallback: number
): number {
  return Number.isFinite(value)
    ? Math.max(minimum, Math.min(maximum, value))
    : fallback
}

function assertLive(fluid: HomeFluid): void {
  if (fluid.destroyed) {
    throw new Error('The home fluid simulation has already been destroyed.')
  }
}

function destroyBuffer(buffer: StorageBuffer): void {
  const destroy = (buffer as StorageBuffer & { destroy?: () => void }).destroy
  destroy?.call(buffer)
}
