import {
  CapsuleGeometry,
  ExtrudeGeometry,
  Group,
  LineCurve3,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  Shape,
  SphereGeometry,
  TubeGeometry,
  Vector3,
  type BufferGeometry,
  type Curve,
} from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'

/**
 * Petit-Oni in 3D, built from the same paths as app/assets/icons/petit-oni.svg
 * (and ChatPetitOniAvatar): each stroke becomes a round tube, bent onto a
 * curved face so the drawing gets depth when the head turns.
 */

/** SVG units per world unit. The viewBox is 120x100, centered on (60, 50). */
const UNIT = 20
/** How much the face curves backward away from its center. */
const CURVATURE = 0.22
const LINE_RADIUS = 2.5 / UNIT
const THIN_RADIUS = 2 / UNIT

/** SVG point to world point, on the curved face. */
function toWorld(x: number, y: number) {
  const dx = (x - 60) / UNIT
  const dy = (50 - y) / UNIT
  return new Vector3(dx, dy, -CURVATURE * (dx * dx + 0.4 * dy * dy))
}

/** Parses the absolute M / L / Q / Z paths used by the drawing into curve segments. */
function parsePath(d: string) {
  const tokens = d.match(/[MLQZ]|-?\d*\.?\d+/g) ?? []
  const segments: Curve<Vector3>[] = []
  const vertices: Vector3[] = []
  let start: Vector3 | null = null
  let cursor: Vector3 | null = null
  let i = 0
  const read = () => toWorld(Number(tokens[i++]), Number(tokens[i++]))
  while (i < tokens.length) {
    const command = tokens[i++]
    if (command === 'M') {
      cursor = start = read()
      vertices.push(cursor)
    }
    else if (command === 'L' && cursor) {
      const to = read()
      segments.push(new LineCurve3(cursor, to))
      vertices.push(to)
      cursor = to
    }
    else if (command === 'Q' && cursor) {
      const control = read()
      const to = read()
      segments.push(new QuadraticBezierCurve3(cursor, control, to))
      vertices.push(to)
      cursor = to
    }
    else if (command === 'Z' && cursor && start) {
      segments.push(new LineCurve3(cursor, start))
      cursor = start
    }
  }
  return { segments, vertices }
}

/** A stroked path as one geometry: a tube per segment, a sphere at each vertex (round caps and joins). */
function strokeGeometry(paths: string[], radius = LINE_RADIUS) {
  const parts: BufferGeometry[] = []
  for (const d of paths) {
    const { segments, vertices } = parsePath(d)
    for (const segment of segments) {
      const straight = segment instanceof LineCurve3
      parts.push(new TubeGeometry(segment, straight ? 2 : 24, radius, 14, false))
    }
    for (const vertex of vertices) {
      parts.push(new SphereGeometry(radius, 14, 10).translate(vertex.x, vertex.y, vertex.z))
    }
  }
  return mergeGeometries(parts)!
}

/** Mesh whose origin sits at `pivot` (SVG coords), so it scales and rotates around it. */
function pivotMesh(geometry: BufferGeometry, material: MeshStandardMaterial, pivot: [number, number]) {
  const origin = toWorld(...pivot)
  geometry.translate(-origin.x, -origin.y, -origin.z)
  const mesh = new Mesh(geometry, material)
  mesh.position.copy(origin)
  return mesh
}

function sparkleGeometry(size: number) {
  const shape = new Shape()
  const inner = size * 0.28
  for (let k = 0; k < 8; k++) {
    const angle = (k / 8) * Math.PI * 2 + Math.PI / 2
    const r = k % 2 === 0 ? size : inner
    if (k === 0) shape.moveTo(Math.cos(angle) * r, Math.sin(angle) * r)
    else shape.lineTo(Math.cos(angle) * r, Math.sin(angle) * r)
  }
  return new ExtrudeGeometry(shape, { depth: size * 0.15, bevelEnabled: true, bevelSize: size * 0.08, bevelThickness: size * 0.08, bevelSegments: 2 }).center()
}

export interface OniPalette {
  line: string
  eyes: string
  shine: string
  /** Emissive strength of the lines: neon on dark backgrounds, softer on light ones. */
  glow: number
}

export const ONI_PALETTES = {
  color: { line: '#F75474', eyes: '#2626A0', shine: '#ffffff', glow: 0.55 },
  mono: { line: '#ffffff', eyes: '#ffffff', shine: '#0b0b0f', glow: 0.35 },
  /** Light theme: white lines would vanish on a white page. */
  light: { line: '#F75474', eyes: '#2626A0', shine: '#ffffff', glow: 0.15 },
} satisfies Record<string, OniPalette>

export interface PetitOni3D {
  root: Group
  head: Group
  horns: [Mesh, Mesh]
  brow: Mesh
  ears: [Mesh, Mesh]
  eyes: Group
  eye: [Group, Group]
  mouth: Mesh
  waves: Mesh[]
  sparkles: Mesh[]
  orbs: Mesh[]
  materials: { line: MeshPhysicalMaterial, eyes: MeshPhysicalMaterial, shine: MeshStandardMaterial, waves: MeshStandardMaterial[] }
  setPalette: (palette: OniPalette) => void
  dispose: () => void
}

export function createPetitOni(palette: OniPalette): PetitOni3D {
  const line = new MeshPhysicalMaterial({ roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15 })
  const eyes = new MeshPhysicalMaterial({ roughness: 0.15, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 })
  const shine = new MeshStandardMaterial({ roughness: 0.4 })
  // One material per wave ring, so each fades on its own.
  const waveMaterials = [0, 1].map(() => new MeshStandardMaterial({ transparent: true, opacity: 0, depthWrite: false }))

  const setPalette = (p: OniPalette) => {
    line.color.set(p.line)
    line.emissive.set(p.line)
    line.emissiveIntensity = p.glow
    eyes.color.set(p.eyes)
    eyes.emissive.set(p.eyes)
    eyes.emissiveIntensity = p.glow * 0.6
    shine.color.set(p.shine)
    shine.emissive.set(p.shine)
    shine.emissiveIntensity = 0.6
    for (const wave of waveMaterials) {
      wave.color.set(p.line)
      wave.emissive.set(p.line)
      wave.emissiveIntensity = p.glow
    }
  }
  setPalette(palette)

  const root = new Group()
  const head = new Group()
  root.add(head)

  // Horns pivot at their base, on the brow, so they can tilt and glow independently.
  const horns: [Mesh, Mesh] = [
    pivotMesh(strokeGeometry(['M38.5 25.5 L19.5 18 Q14.5 16.5 15.5 21.5 Q17.5 30.5 25 37']), line, [38.5, 25.5]),
    pivotMesh(strokeGeometry(['M81.5 25.5 L100.5 18 Q105.5 16.5 104.5 21.5 Q102.5 30.5 95 37']), line, [81.5, 25.5]),
  ]
  const brow = pivotMesh(strokeGeometry(['M41.5 18.5 Q60 8 78.5 18.5']), line, [60, 15])
  const ears: [Mesh, Mesh] = [
    pivotMesh(strokeGeometry(['M22.5 46 Q8 55 22.5 63.5']), line, [19, 55]),
    pivotMesh(strokeGeometry(['M97.5 46 Q112 55 97.5 63.5']), line, [101, 55]),
  ]
  // The mouth opens from its top edge, like the SVG (transform-origin 50% 0%).
  const mouth = pivotMesh(strokeGeometry([
    'M34.5 75.5 Q60 101.5 85.5 75.5',
    'M41.5 80.5 L47 70.5 L52 83.5 Z',
    'M78.5 80.5 L73 70.5 L68 83.5 Z',
  ], 2 / UNIT), line, [60, 72])
  head.add(...horns, brow, ...ears, mouth)

  // Eyes: the SVG's 10.5x19 rounded rects become flattened capsules, with a shine dot.
  const eyeGroup = new Group()
  const eye = [[43.25, 53.5], [76.75, 53.5]].map(([x, y]) => {
    const center = toWorld(x!, y!)
    const group = new Group()
    group.position.copy(center)
    // Face the curved surface's normal.
    group.rotation.y = Math.atan(2 * CURVATURE * center.x)
    const ball = new Mesh(new CapsuleGeometry(5.25 / UNIT, 8.5 / UNIT, 8, 20), eyes)
    ball.scale.z = 0.55
    const dot = new Mesh(new SphereGeometry(2.6 / UNIT, 16, 12), shine)
    dot.position.set(-1.25 / UNIT, 4 / UNIT, 2.4 / UNIT)
    dot.scale.z = 0.4
    group.add(ball, dot)
    eyeGroup.add(group)
    return group
  }) as [Group, Group]
  head.add(eyeGroup)

  // Sound waves around the ears ("listening", a nod to Alex's audio background).
  const waves = [
    ['M10 48 Q4 55 10 62', 'M110 48 Q116 55 110 62'],
    ['M3 44 Q-5 55 3 66', 'M117 44 Q125 55 117 66'],
  ].map((paths, k) => new Mesh(strokeGeometry(paths, THIN_RADIUS), waveMaterials[k]))
  head.add(...waves)

  // Sparkles ("showing" a card), in the corners like the SVG.
  const sparkles = ([[6, 6, 4], [112, 10, 6], [104, 82, 3.5]] as const).map(([x, y, size]) => {
    const mesh = new Mesh(sparkleGeometry(size / UNIT), line)
    mesh.position.copy(toWorld(x, y)).setZ(0.6)
    mesh.scale.setScalar(0)
    return mesh
  })
  head.add(...sparkles)

  // Little orbs circling the head while the agent works ("thinking").
  const orbs = [0, 1, 2].map(() => {
    const mesh = new Mesh(new SphereGeometry(1.8 / UNIT, 16, 12), line)
    mesh.scale.setScalar(0)
    return mesh
  })
  root.add(...orbs)

  const dispose = () => {
    root.traverse((object) => {
      if (object instanceof Mesh) object.geometry.dispose()
    })
    for (const material of [line, eyes, shine, ...waveMaterials]) material.dispose()
  }

  return {
    root,
    head,
    horns,
    brow,
    ears,
    eyes: eyeGroup,
    eye,
    mouth,
    waves,
    sparkles,
    orbs,
    materials: { line, eyes, shine, waves: waveMaterials },
    setPalette,
    dispose,
  }
}
