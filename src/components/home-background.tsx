'use client'

import { useRouter } from 'next/router'
import { useEffect, useRef } from 'react'
import { effect, frame, init, surface } from 'vgpu'

import backgroundShader from './home-background.wgsl'
import {
  createHomeFluid,
  destroyHomeFluid,
  prepareHomeFluid,
  renderHomeFluid,
  resizeHomeFluid,
  stepHomeFluid,
  HOME_FLUID_SHADER_REVISION,
  type HomeFluid,
  type HomeFluidGravityWell,
  type HomeFluidPoint
} from './home-fluid'
import {
  AuroraClock,
  clamp,
  FLUID_ASPECT,
  PointerTrail,
  screenPointToFluid
} from './home-fluid-input'

const FIXED_STEP = 1 / 60
const IDLE_STEP = 1 / 30
const MAX_SIMULATION_STEPS = 2
const REDUCED_MOTION_PHASE = 0.72
const GRAVITY_SELECTOR = '[data-aurora-gravity]'
const rendererOwners = new WeakMap<HTMLCanvasElement, symbol>()

type GravityKind = 'logo' | 'post'
type ScreenPoint = readonly [number, number]

interface GravityWellState {
  activation: number
  center: HomeFluidPoint
  domStrength: string
  element: HTMLElement | null
  focusTarget: HTMLElement | null
  proximityGoal: number
  radius: number
}

function smoothstep01(value: number) {
  const t = clamp(value, 0, 1)
  return t * t * (3 - 2 * t)
}

function distanceToRect(x: number, y: number, rect: DOMRect) {
  const dx = Math.max(rect.left - x, 0, x - rect.right)
  const dy = Math.max(rect.top - y, 0, y - rect.bottom)
  return Math.hypot(dx, dy)
}

function gravityKind(target: HTMLElement): GravityKind | null {
  const kind = target.dataset.auroraGravity
  return kind === 'logo' || kind === 'post' ? kind : null
}

function closestGravityTarget(target: EventTarget | null): HTMLElement | null {
  if (!(target instanceof Element)) return null
  return target.closest<HTMLElement>(GRAVITY_SELECTOR)
}

function gravityUniform(well: GravityWellState): HomeFluidGravityWell {
  return [well.center[0], well.center[1], well.radius, well.activation]
}

function gravitySimulationUniform(
  well: GravityWellState,
  aspect: number
): HomeFluidGravityWell {
  const center = screenPointToFluid(well.center, aspect)
  const radiusScale = aspect > FLUID_ASPECT ? FLUID_ASPECT / aspect : 1
  return [center[0], center[1], well.radius * radiusScale, well.activation]
}

function screenPointerPoint(event: PointerEvent): HomeFluidPoint {
  return [
    clamp(event.clientX / Math.max(window.innerWidth, 1), 0, 1),
    clamp(event.clientY / Math.max(window.innerHeight, 1), 0, 1)
  ]
}

function pointerPoint(event: PointerEvent, aspect: number): HomeFluidPoint {
  return screenPointToFluid(screenPointerPoint(event), aspect)
}

function AuroraCanvas() {
  const router = useRouter()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const shaderRevision = backgroundShader.wgsl + HOME_FLUID_SHADER_REVISION

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !navigator.gpu) return

    const rendererOwner = Symbol('site-background-renderer')
    rendererOwners.set(canvas, rendererOwner)
    const motionPreference = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    )
    let reducedMotion = motionPreference.matches
    let disposed = false
    let gpu: Awaited<ReturnType<typeof init>> | undefined
    let fluid: HomeFluid | undefined
    let animationFrame = 0
    let removeGpuErrorListener: (() => void) | undefined
    let unsubscribeResize: (() => void) | undefined
    let removeListeners: (() => void) | undefined
    const clock = new AuroraClock()
    const pointerTrail = new PointerTrail()
    let accumulator = 0
    let needsRender = true
    let hasRendered = false
    let pointerScreen: ScreenPoint | null = null
    let proximityDirty = true
    let proximityKind: GravityKind | null = null
    const gravityWells: Record<GravityKind, GravityWellState> = {
      logo: {
        activation: 0,
        center: [0.5, 0.5],
        domStrength: '',
        element: null,
        focusTarget: null,
        proximityGoal: 0,
        radius: 0.2
      },
      post: {
        activation: 0,
        center: [0.5, 0.62],
        domStrength: '',
        element: null,
        focusTarget: null,
        proximityGoal: 0,
        radius: 0.12
      }
    }

    const measureGravityTarget = (kind: GravityKind, rect: DOMRect) => {
      if (rect.width <= 0 || rect.height <= 0) return

      const viewportWidth = Math.max(window.innerWidth, 1)
      const viewportHeight = Math.max(window.innerHeight, 1)
      const scale = Math.sqrt(rect.width * rect.height) / viewportHeight
      const well = gravityWells[kind]
      well.center = [
        clamp((rect.left + rect.width * 0.5) / viewportWidth, 0, 1),
        clamp((rect.top + rect.height * 0.5) / viewportHeight, 0, 1)
      ]
      well.radius =
        kind === 'logo'
          ? clamp(0.7 * scale, 0.14, 0.22)
          : clamp(0.65 * scale + 0.02, 0.1, 0.18)
      needsRender = true
    }

    const clearGravityDomState = (well: GravityWellState) => {
      if (well.element) {
        delete well.element.dataset.auroraActive
        delete well.element.dataset.auroraStrength
        well.element.style.removeProperty('--aurora-strength')
      }
      well.domStrength = ''
    }

    const syncGravityDomState = (well: GravityWellState) => {
      const target = well.element
      if (!target) return

      const strength = well.activation.toFixed(3)
      if (well.domStrength !== strength) {
        well.domStrength = strength
        target.style.setProperty('--aurora-strength', strength)
        if (well.activation > 0.001) target.dataset.auroraActive = 'true'
        else delete target.dataset.auroraActive
      }
    }

    const setFocusTarget = (target: HTMLElement | null) => {
      for (const kind of ['logo', 'post'] as const) {
        gravityWells[kind].focusTarget = null
      }

      if (reducedMotion || !target) {
        needsRender = true
        return
      }

      const kind = gravityKind(target)
      if (!kind) return
      const well = gravityWells[kind]
      well.focusTarget = target
      proximityDirty = true
    }

    const clearGravityTargets = (immediate = false) => {
      pointerScreen = null
      proximityKind = null
      proximityDirty = true

      for (const kind of ['logo', 'post'] as const) {
        const well = gravityWells[kind]
        well.focusTarget = null
        well.proximityGoal = 0
        if (immediate) well.activation = 0
        if (immediate) clearGravityDomState(well)
      }
      needsRender = true
    }

    const clearPointerGravity = () => {
      pointerScreen = null
      proximityKind = null
      proximityDirty = true
      for (const kind of ['logo', 'post'] as const) {
        gravityWells[kind].proximityGoal = 0
      }
      needsRender = true
    }

    const gravityElement = (kind: GravityKind) =>
      document.querySelector<HTMLElement>(`[data-aurora-gravity="${kind}"]`)

    const gravityProximity = (
      kind: GravityKind,
      rect: DOMRect,
      x: number,
      y: number
    ) => {
      if (rect.width <= 0 || rect.height <= 0) return 0
      const reach =
        kind === 'logo'
          ? clamp(Math.min(rect.width, rect.height) * 0.32, 72, 128)
          : clamp(Math.max(rect.height * 1.8, 64), 64, 96)
      return 1 - smoothstep01(distanceToRect(x, y, rect) / reach)
    }

    const updateProximityGoals = () => {
      if (!proximityDirty) return
      proximityDirty = false

      const scores: Record<GravityKind, number> = { logo: 0, post: 0 }

      for (const kind of ['logo', 'post'] as const) {
        const well = gravityWells[kind]
        const target = gravityElement(kind)

        if (well.element && well.element !== target) {
          clearGravityDomState(well)
        }
        well.element = target

        if (!target) continue
        const rect = target.getBoundingClientRect()
        measureGravityTarget(kind, rect)
        if (!reducedMotion && pointerScreen) {
          scores[kind] = gravityProximity(
            kind,
            rect,
            pointerScreen[0],
            pointerScreen[1]
          )
        }
      }

      const bestKind = scores.logo >= scores.post ? 'logo' : 'post'
      const bestScore = scores[bestKind]
      const currentScore = proximityKind ? scores[proximityKind] : 0

      if (bestScore < 0.025) proximityKind = null
      else if (!proximityKind || bestScore > currentScore + 0.1) {
        proximityKind = bestKind
      }

      for (const kind of ['logo', 'post'] as const) {
        gravityWells[kind].proximityGoal =
          kind === proximityKind ? scores[kind] : 0
      }
    }

    const updateGravity = (elapsed: number) => {
      let changed = false

      for (const kind of ['logo', 'post'] as const) {
        const well = gravityWells[kind]
        if (well.focusTarget && !well.focusTarget.isConnected) {
          well.focusTarget = null
        }

        const focusGoal = well.focusTarget?.isConnected ? 1 : 0
        const goal = !reducedMotion
          ? Math.max(well.proximityGoal, focusGoal)
          : 0
        const entering = goal > well.activation
        const timeConstant =
          kind === 'logo' ? (entering ? 0.085 : 0.24) : entering ? 0.065 : 0.18
        const blend = 1 - Math.exp(-elapsed / timeConstant)
        const next = well.activation + (goal - well.activation) * blend
        const settled = goal === 0 && next < 0.0005 ? 0 : next

        if (Math.abs(settled - well.activation) > 0.0001) changed = true
        well.activation = settled
        syncGravityDomState(well)
      }

      return changed
    }

    const cleanUpRenderer = () => {
      if (disposed) return
      disposed = true
      window.cancelAnimationFrame(animationFrame)
      animationFrame = 0
      removeGpuErrorListener?.()
      unsubscribeResize?.()
      removeListeners?.()
      pointerTrail.reset()
      // An earlier Strict Mode setup must not clear a newer renderer's UI.
      if (rendererOwners.get(canvas) === rendererOwner) {
        delete canvas.dataset.ready
        rendererOwners.delete(canvas)
        for (const kind of ['logo', 'post'] as const) {
          clearGravityDomState(gravityWells[kind])
        }
      }
      if (fluid) destroyHomeFluid(fluid)
      fluid = undefined
      gpu?.dispose()
      gpu = undefined
    }

    const fail = (error: unknown) => {
      if (disposed) return
      console.error('Could not render the animated site background.', error)
      cleanUpRenderer()
    }

    void (async () => {
      const context = await init({ powerPreference: 'low-power' })
      if (disposed) {
        context.dispose()
        return
      }
      gpu = context

      const removeError = context.onError(fail)
      const handleGpuError = (event: Event) => {
        event.preventDefault()
        fail((event as GPUUncapturedErrorEvent).error)
      }
      context.gpu.addEventListener('uncapturederror', handleGpuError)
      removeGpuErrorListener = () => {
        removeError()
        context.gpu.removeEventListener('uncapturederror', handleGpuError)
      }
      void context.gpu.lost.then((info) => {
        if (info.reason !== 'destroyed') fail(new Error(info.message))
      })

      const canvasSurface = surface(context, canvas, {
        dpr: [1, 1.25],
        label: 'site background'
      })
      const background = effect(context, backgroundShader, {
        label: 'fluid aurora'
      })
      fluid = createHomeFluid(context)
      let aspect =
        Math.max(canvasSurface.size[0], 1) / Math.max(canvasSurface.size[1], 1)
      const displayConfig = () => ({
        time: reducedMotion ? REDUCED_MOTION_PHASE : clock.phase,
        aspect,
        logoWell: gravityUniform(gravityWells.logo),
        postWell: gravityUniform(gravityWells.post)
      })

      await prepareHomeFluid(fluid, canvasSurface, background, displayConfig())
      if (disposed) return

      const renderBackground = () => {
        if (!fluid || disposed) return
        const renderedFrame = frame(context, (currentFrame) => {
          renderHomeFluid(
            fluid!,
            currentFrame,
            canvasSurface,
            background,
            displayConfig()
          )
        })
        needsRender = false
        if (!hasRendered) {
          hasRendered = true
          void renderedFrame.done.then(() => {
            if (!disposed && rendererOwners.get(canvas) === rendererOwner) {
              canvas.dataset.ready = 'true'
            }
          })
        }
      }

      const requestFrame = () => {
        if (!disposed && !document.hidden && animationFrame === 0) {
          animationFrame = window.requestAnimationFrame(tick)
        }
      }

      const tick = (time: number): void => {
        animationFrame = 0
        if (disposed || document.hidden) return
        try {
          if (reducedMotion) {
            if (needsRender) renderBackground()
            return
          }

          const elapsed = clock.advance(time)
          updateProximityGoals()
          if (updateGravity(elapsed)) needsRender = true
          const interactive =
            pointerTrail.active ||
            // Let the deposited wake settle at full rate after input ends.
            fluid!.time - fluid!.lastInputTime < 3 ||
            gravityWells.logo.activation > 0.001 ||
            gravityWells.post.activation > 0.001
          const dt = interactive ? FIXED_STEP : IDLE_STEP
          accumulator = Math.min(
            accumulator + elapsed,
            dt * MAX_SIMULATION_STEPS
          )

          let steps = 0
          while (accumulator + 1e-7 >= dt && steps < MAX_SIMULATION_STEPS) {
            stepHomeFluid(
              fluid!,
              {
                strokes: pointerTrail.take(),
                logoWell: gravitySimulationUniform(gravityWells.logo, aspect),
                postWell: gravitySimulationUniform(gravityWells.post, aspect)
              },
              dt
            )
            accumulator = Math.max(0, accumulator - dt)
            steps += 1
          }

          if (steps > 0 || needsRender) renderBackground()
          requestFrame()
        } catch (error) {
          fail(error)
        }
      }

      const resetInteraction = () => {
        pointerTrail.reset()
        clearGravityTargets(true)
        clock.reset()
        accumulator = 0
      }

      const invalidateLayout = () => {
        proximityDirty = true
        needsRender = true
        requestFrame()
      }

      unsubscribeResize = canvasSurface.onResize(({ width, height }) => {
        if (!fluid) return
        resizeHomeFluid(fluid, canvasSurface)
        aspect = Math.max(width, 1) / Math.max(height, 1)
        pointerTrail.reset()
        invalidateLayout()
      })

      const handlePointerMove = (event: PointerEvent) => {
        if (reducedMotion || !event.isPrimary) return
        pointerScreen =
          event.pointerType === 'touch' ? null : [event.clientX, event.clientY]
        proximityDirty = true

        const samples = event.getCoalescedEvents?.()
        for (const sample of samples?.length ? samples : [event]) {
          pointerTrail.move(pointerPoint(sample, aspect), sample.timeStamp)
        }
      }

      const handlePointerDown = (event: PointerEvent) => {
        if (reducedMotion || !event.isPrimary || event.button !== 0) return
        if (event.pointerType !== 'touch') {
          pointerScreen = [event.clientX, event.clientY]
          proximityDirty = true
        }
        pointerTrail.press(pointerPoint(event, aspect), event.timeStamp)
      }

      const handlePointerLeave = () => {
        pointerTrail.reset()
        clearPointerGravity()
      }
      const handlePointerUp = (event: PointerEvent) => {
        if (event.pointerType !== 'mouse') handlePointerLeave()
      }

      const handleGravityFocusIn = (event: FocusEvent) => {
        const target = closestGravityTarget(event.target)
        setFocusTarget(target?.matches(':focus-visible') ? target : null)
      }
      const handleGravityFocusOut = () => setFocusTarget(null)

      const handleMotionPreferenceChange = (event: MediaQueryListEvent) => {
        reducedMotion = event.matches
        resetInteraction()
        invalidateLayout()
      }
      const handleVisibilityChange = () => {
        resetInteraction()
        if (document.hidden) {
          window.cancelAnimationFrame(animationFrame)
          animationFrame = 0
        } else {
          invalidateLayout()
        }
      }

      // Scroll can move the targets while the pointer remains stationary.
      window.addEventListener('scroll', invalidateLayout, {
        passive: true,
        capture: true
      })
      window.addEventListener('resize', invalidateLayout, { passive: true })
      window.addEventListener('pointermove', handlePointerMove, {
        passive: true
      })
      window.addEventListener('pointerdown', handlePointerDown, {
        passive: true
      })
      window.addEventListener('pointerup', handlePointerUp, { passive: true })
      window.addEventListener('pointercancel', handlePointerLeave, {
        passive: true
      })
      window.addEventListener('focusin', handleGravityFocusIn)
      window.addEventListener('focusout', handleGravityFocusOut)
      window.addEventListener('blur', resetInteraction)
      document.documentElement.addEventListener(
        'pointerleave',
        handlePointerLeave
      )
      document.addEventListener('visibilitychange', handleVisibilityChange)
      motionPreference.addEventListener('change', handleMotionPreferenceChange)
      router.events.on('routeChangeStart', resetInteraction)
      router.events.on('routeChangeComplete', invalidateLayout)
      router.events.on('routeChangeError', invalidateLayout)

      removeListeners = () => {
        window.removeEventListener('scroll', invalidateLayout, true)
        window.removeEventListener('resize', invalidateLayout)
        window.removeEventListener('pointermove', handlePointerMove)
        window.removeEventListener('pointerdown', handlePointerDown)
        window.removeEventListener('pointerup', handlePointerUp)
        window.removeEventListener('pointercancel', handlePointerLeave)
        window.removeEventListener('focusin', handleGravityFocusIn)
        window.removeEventListener('focusout', handleGravityFocusOut)
        window.removeEventListener('blur', resetInteraction)
        document.documentElement.removeEventListener(
          'pointerleave',
          handlePointerLeave
        )
        document.removeEventListener('visibilitychange', handleVisibilityChange)
        motionPreference.removeEventListener(
          'change',
          handleMotionPreferenceChange
        )
        router.events.off('routeChangeStart', resetInteraction)
        router.events.off('routeChangeComplete', invalidateLayout)
        router.events.off('routeChangeError', invalidateLayout)
      }

      reducedMotion = motionPreference.matches
      requestFrame()
    })().catch(fail)

    return cleanUpRenderer
  }, [router.events, shaderRevision])

  return <canvas ref={canvasRef} />
}

export default AuroraCanvas
