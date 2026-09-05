import assert from 'node:assert/strict'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveShader } from '@vgpu/wgsl/runtime'
import { init } from 'vgpu/node'
import { effect, frame, target } from 'vgpu'
import {
  createHomeFluid,
  destroyHomeFluid,
  HOME_FLUID_DYE_SIZE,
  prepareHomeFluid,
  renderHomeFluid,
  stepHomeFluid
} from '../src/components/home-fluid.ts'
import backgroundShader from '../src/components/home-background.wgsl'
import { PointerTrail } from '../src/components/home-fluid-input.ts'

const componentDirectory = fileURLToPath(
  new URL('../src/components/', import.meta.url)
)
const shaderFiles = [
  'home-background.wgsl',
  'home-fluid-advect-velocity.wgsl',
  'home-fluid-advect-dye.wgsl',
  'home-fluid-curl.wgsl',
  'home-fluid-vorticity.wgsl',
  'home-fluid-divergence.wgsl',
  'home-fluid-pressure.wgsl',
  'home-fluid-project.wgsl'
]
for (const name of shaderFiles) {
  for (const minify of [false, true]) {
    const shader = await resolveShader({
      entry: resolve(componentDirectory, name),
      validate: 'require',
      minify
    })
    assert.ok(shader.validation.ok, `${name}: device validation required`)
    assert.equal(shader.diagnostics.length, 0, `${name}: shader diagnostics`)
  }
}
console.log(
  'All 8 shaders validate on the GPU in development and production form.'
)

const gpu = await init({ powerPreference: 'low-power' })
const errors = []
gpu.onError((error) => errors.push(error))
gpu.gpu.addEventListener('uncapturederror', (event) => {
  event.preventDefault()
  errors.push(event.error)
})
gpu.gpu.pushErrorScope('validation')
const fluids = []
const makeFluid = () => {
  const fluid = createHomeFluid(gpu)
  fluids.push(fluid)
  return fluid
}
const read = async (field) => new Float32Array(await field.read())
const meanAlpha = (field) => {
  let total = 0
  for (let i = 3; i < field.length; i += 4) total += field[i]
  return total / (field.length / 4)
}
const meanDifference = (a, b) => {
  assert.equal(a.length, b.length)
  let total = 0
  for (let i = 0; i < a.length; i++) total += Math.abs(a[i] - b[i])
  return total / a.length
}
const finite = (field) =>
  assert.ok(field.every(Number.isFinite), 'fluid contains non-finite values')

try {
  // Constant alpha has an analytic decay independent of velocity/advection.
  const seed = new Float32Array(
    HOME_FLUID_DYE_SIZE[0] * HOME_FLUID_DYE_SIZE[1] * 4
  )
  for (let i = 3; i < seed.length; i += 4) seed[i] = 1
  const alphaByRate = []
  for (const fps of [30, 60]) {
    const fluid = makeFluid()
    fluid.dye.read.write(seed)
    for (let step = 0; step < fps; step++) stepHomeFluid(fluid, {}, 1 / fps)
    const field = await read(fluid.dye.read)
    finite(field)
    alphaByRate.push(meanAlpha(field))
    assert.ok(
      Math.abs(fluid.time - 1) < 1e-6,
      'simulation time must follow wall time'
    )
  }
  assert.ok(
    Math.abs(alphaByRate[0] - alphaByRate[1]) < 0.0001,
    'trail fading changes with refresh rate'
  )
  assert.ok(Math.abs(alphaByRate[0] - 0.982 ** 60) < 0.0001, 'incorrect decay')
  console.log('Trail decay is consistent at 30 and 60 steps/second.')

  const idle = makeFluid()
  const attracted = makeFluid()
  const logoWell = [0.5, 0.5, 0.2, 1]
  for (let step = 0; step < 60; step++) {
    stepHomeFluid(idle)
    stepHomeFluid(attracted, { logoWell })
  }
  const idleFlow = await read(idle.velocity.read)
  const attractedFlow = await read(attracted.velocity.read)
  finite(attractedFlow)
  assert.ok(
    meanDifference(idleFlow, attractedFlow) > 0.001,
    'gravity did not change the velocity field'
  )
  assert.equal(
    meanAlpha(await read(attracted.dye.read)),
    0,
    'hover must not paint a trail'
  )
  console.log(
    'Gravity changes the fluid velocity without creating trail alpha.'
  )

  const painted = makeFluid()
  const stroke = (from, to) => ({
    from,
    to,
    velocity: [0.3, 0.2],
    color: [0.1, 0.7, 1, 1],
    strength: 1.3
  })
  stepHomeFluid(painted, {
    strokes: [stroke([0.3, 0.4], [0.5, 0.6]), stroke([0.5, 0.6], [0.7, 0.4])]
  })
  const paint = await read(painted.dye.read)
  const alphaAt = (x, y) =>
    paint[
      (Math.floor(y * HOME_FLUID_DYE_SIZE[1]) * HOME_FLUID_DYE_SIZE[0] +
        Math.floor(x * HOME_FLUID_DYE_SIZE[0])) *
        4 +
        3
    ]
  assert.ok(alphaAt(0.5, 0.6) > 0.1, 'the corner of the cursor path was lost')
  assert.ok(alphaAt(0.5, 0.4) < 0.001, 'paint cut across the cursor path')
  const click = makeFluid()
  stepHomeFluid(click, { strokes: [stroke([0.5, 0.5], [0.5, 0.5])] })
  assert.equal(
    meanAlpha(await read(click.dye.read)),
    0,
    'stationary click painted a blob'
  )
  console.log(
    'Curved paths retain their corners; stationary clicks paint no trail.'
  )

  const continuous = makeFluid()
  const subdivided = makeFluid()
  stepHomeFluid(continuous, { strokes: [stroke([0.3, 0.5], [0.7, 0.5])] })
  stepHomeFluid(subdivided, {
    strokes: Array.from({ length: 8 }, (_, i) =>
      stroke([0.3 + i * 0.05, 0.5], [0.3 + (i + 1) * 0.05, 0.5])
    )
  })
  for (const field of ['velocity', 'dye']) {
    assert.ok(
      meanDifference(
        await read(continuous[field].read),
        await read(subdivided[field].read)
      ) < 1e-6,
      `${field}: coalesced samples amplify the same gesture`
    )
  }
  console.log('Subdividing a gesture does not amplify its force or brightness.')

  const display = effect(gpu, backgroundShader)
  const output = target(gpu, { size: [640, 360], format: 'rgba8unorm' })
  const empty = makeFluid()
  const config = {
    time: 0.72,
    aspect: 16 / 9,
    logoWell: [0.5, 0.5, 0.2, 0],
    postWell: [0.5, 0.75, 0.12, 0]
  }
  await prepareHomeFluid(empty, output, display, config)
  const render = async (fluid, overrides = {}) => {
    const draw = frame(gpu, (current) =>
      renderHomeFluid(fluid, current, output, display, {
        ...config,
        ...overrides
      })
    )
    await draw.done
    return output.read()
  }
  const baseline = await render(empty)
  const gravity = await render(empty, { logoWell })
  assert.ok(
    meanDifference(baseline, gravity) > 0.1,
    'navigation gravity made no visible change'
  )
  const beforeWrap = await render(empty, { time: Math.PI * 2 - 0.001 })
  const afterWrap = await render(empty, { time: Math.PI * 2 + 0.001 })
  assert.ok(
    meanDifference(beforeWrap, afterWrap) < 1,
    'animation jumps at the old wrap boundary'
  )
  console.log(
    'Rendered gravity is visible; the old animation wrap boundary is continuous.'
  )

  // A vertical painted probe crosses both auroras. Find their colors in the
  // rendered backdrop, independently of the shader's distance calculation.
  const colorProbe = makeFluid()
  const probeDye = new Float32Array(seed.length)
  for (let y = 0; y < HOME_FLUID_DYE_SIZE[1]; y++) {
    for (let x = 254; x <= 257; x++) {
      probeDye[(y * HOME_FLUID_DYE_SIZE[0] + x) * 4 + 3] = 1
    }
  }
  colorProbe.dye.read.write(probeDye)
  for (const time of [0.72, 3.2, 8.6]) {
    const backdrop = await render(empty, { time })
    const probe = await render(colorProbe, { time })
    for (const [name, primary, opposite] of [
      ['pink', 0, 1],
      ['cyan', 1, 0]
    ]) {
      let nearestPixel = 0
      let strongestColor = -Infinity
      for (let y = 20; y < 340; y++) {
        const pixel = (y * 640 + 320) * 4
        const score = backdrop[pixel + primary] - backdrop[pixel + opposite]
        if (score > strongestColor) {
          strongestColor = score
          nearestPixel = pixel
        }
      }
      assert.ok(strongestColor > 15, `${name} backdrop not found`)
      assert.ok(
        probe[nearestPixel + primary] - probe[nearestPixel + opposite] > 35,
        `trail does not match the nearby ${name} aurora at phase ${time}`
      )
    }
  }
  console.log(
    'The trail matches nearby pink/cyan cores across moving aurora phases.'
  )

  if (process.argv[2]) {
    const directory = resolve(process.argv[2])
    await mkdir(directory, { recursive: true })
    const { default: sharp } = await import('sharp')
    for (const [name, pixels] of [
      ['baseline', baseline],
      ['gravity', gravity],
      ['painted', await render(painted)]
    ]) {
      await sharp(pixels, { raw: { width: 640, height: 360, channels: 4 } })
        .png()
        .toFile(resolve(directory, `${name}.png`))
    }
    // Replay the same curved gesture for repeatable visual comparisons.
    const moving = makeFluid()
    const pointer = new PointerTrail()
    const motionFrames = new Set([24, 48, 72, 96, 120, 180])
    let previousFrame
    let largestFrameChange = 0
    for (let step = 0; step <= 180; step++) {
      if (step <= 96) {
        for (let sample = 0; sample < 4; sample++) {
          const progress = Math.min((step + sample / 4) / 96, 1)
          const angle = progress * Math.PI * 2
          pointer.move(
            [0.5 + Math.sin(angle) * 0.28, 0.5 + Math.sin(angle * 2) * 0.18],
            ((step + sample / 4) * 1000) / 60
          )
        }
      }
      stepHomeFluid(moving, { strokes: pointer.take() })
      const pixels = await render(moving, { time: 0.72 + (step / 60) * 0.16 })
      if (previousFrame) {
        largestFrameChange = Math.max(
          largestFrameChange,
          meanDifference(previousFrame, pixels)
        )
      }
      previousFrame = pixels
      if (motionFrames.has(step)) {
        await sharp(pixels, { raw: { width: 640, height: 360, channels: 4 } })
          .png()
          .toFile(resolve(directory, `motion-${step}.png`))
      }
    }
    finite(await read(moving.velocity.read))
    finite(await read(moving.dye.read))
    console.log(
      `Motion replay: largest mean frame change ${largestFrameChange.toFixed(3)} / 255`
    )
    output.resize([360, 640])
    const portrait = await render(painted, { aspect: 360 / 640 })
    await sharp(portrait, { raw: { width: 360, height: 640, channels: 4 } })
      .png()
      .toFile(resolve(directory, 'portrait.png'))
    console.log(`Rendered previews: ${directory}`)
  }

  await gpu.settled()
  const validation = await gpu.gpu.popErrorScope()
  assert.equal(validation, null, validation?.message)
  assert.deepEqual(errors, [], 'GPU runtime errors occurred')
  console.log('All GPU rendering and simulation checks passed.')
} finally {
  for (const fluid of fluids) destroyHomeFluid(fluid)
  gpu.dispose()
}
