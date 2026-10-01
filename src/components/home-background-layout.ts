export type GravityKind = 'logo' | 'post'

export interface AuroraRect {
  left: number
  top: number
  right: number
  bottom: number
  width: number
  height: number
}

interface MeasurableElement {
  getBoundingClientRect(): AuroraRect
}

interface MeasuredElement<T> {
  element: T
  rect: AuroraRect
}

export interface AuroraLayout<T> {
  gravity: Record<GravityKind, MeasuredElement<T> | null>
  occluders: MeasuredElement<T>[]
}

/** Pointer movement reuses this snapshot; only layout changes reread the DOM. */
export class AuroraLayoutCache<T extends MeasurableElement> {
  private layout: AuroraLayout<T> | null = null

  constructor(
    private findGravityTarget: (kind: GravityKind) => T | null,
    private findOccluders: () => Iterable<T>
  ) {}

  invalidate() {
    this.layout = null
  }

  read(): AuroraLayout<T> {
    if (this.layout) return this.layout

    const measure = (element: T): MeasuredElement<T> => ({
      element,
      rect: element.getBoundingClientRect()
    })
    const gravityTarget = (kind: GravityKind) => {
      const element = this.findGravityTarget(kind)
      return element ? measure(element) : null
    }

    this.layout = {
      gravity: { logo: gravityTarget('logo'), post: gravityTarget('post') },
      occluders: Array.from(this.findOccluders(), measure)
    }
    return this.layout
  }
}

export function auroraViewportSize(
  root: { clientWidth: number; clientHeight: number },
  window: { innerWidth: number; innerHeight: number }
) {
  // Classic scrollbars occupy part of innerWidth/innerHeight, but cannot expose
  // the canvas. Use the content viewport, with a fallback for unavailable sizes.
  return {
    width: root.clientWidth || window.innerWidth,
    height: root.clientHeight || window.innerHeight
  }
}

/** A visible header, footer, or even a narrow edge must keep the aurora alive. */
export function coversAuroraViewport(
  rect: AuroraRect,
  width: number,
  height: number
) {
  return (
    width > 0 &&
    height > 0 &&
    rect.width > 0 &&
    rect.height > 0 &&
    rect.left <= 0 &&
    rect.top <= 0 &&
    rect.right >= width &&
    rect.bottom >= height
  )
}
