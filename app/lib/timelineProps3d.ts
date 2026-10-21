import {
  BoxGeometry,
  CapsuleGeometry,
  ConeGeometry,
  CylinderGeometry,
  Group,
  LatheGeometry,
  Mesh,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  QuadraticBezierCurve3,
  SphereGeometry,
  TorusGeometry,
  TubeGeometry,
  Vector2,
  Vector3,
  type Material,
} from 'three'
import type { OniPalette } from './petitOni3d'

/**
 * The little 3D objects of the timeline, one per event of the journey: the
 * clarinet (conservatoire), a laptop (first code), the mixing desk (sound
 * engineering), headphones (freelance), a book (Koober), an alarm clock
 * (O'Clock), the torii (Japan), a rocket (work-study), Yuzu the black and tan
 * Shiba, a cube (QuantedSquare), a plane (Odysway), a crown (Crown), a
 * mortarboard (applied AI) and an octopus (Eledone). Built from primitives,
 * with the same glossy neon materials as Petit-Oni. Each fits in a box about
 * 2 world units tall, centered on its origin.
 */

export const TIMELINE_PROPS = [
  'clarinet',
  'laptop',
  'mixer',
  'headphones',
  'book',
  'clock',
  'torii',
  'rocket',
  'yuzu',
  'cube',
  'plane',
  'crown',
  'cap',
  'octopus',
] as const
export type TimelineProp = typeof TIMELINE_PROPS[number]

export interface TimelinePropObject {
  root: Group
  /** Idle animation; `focus` goes from 0 (far on the timeline) to 1 (current event). */
  animate: (time: number, focus: number) => void
}

export interface TimelineProps3D {
  props: Record<TimelineProp, TimelinePropObject>
  setPalette: (palette: OniPalette) => void
  dispose: () => void
}

const glossy = (color: string) => new MeshPhysicalMaterial({ color, roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.2 })

export function createTimelineProps(palette: OniPalette): TimelineProps3D {
  // Neon accents follow the palette, like Petit-Oni's lines and eyes.
  const line = new MeshPhysicalMaterial({ roughness: 0.22, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.15 })
  const blue = new MeshPhysicalMaterial({ roughness: 0.15, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.05 })
  const shine = new MeshStandardMaterial({ roughness: 0.4 })
  const ebony = glossy('#17172b')
  const silver = new MeshStandardMaterial({ color: '#d9dbe6', roughness: 0.25, metalness: 1 })
  const gold = new MeshStandardMaterial({ color: '#f2c14e', roughness: 0.2, metalness: 1 })
  const desk = glossy('#26263a')
  const paper = glossy('#f4efe6')
  const flame = new MeshStandardMaterial({ color: '#ffb347', emissive: '#ff7a1a', emissiveIntensity: 1.6, roughness: 0.6 })
  const screen = new MeshStandardMaterial({ color: '#0d0d24', emissive: '#1d1d5c', emissiveIntensity: 0.8, roughness: 0.3 })
  // Yuzu is a black and tan Shiba: black coat, tan points, cream urajiro.
  const coat = glossy('#2a2523')
  const tan = glossy('#c9813f')
  const cream = glossy('#f3e6d3')
  const nose = glossy('#0e0e12')
  const materials: Material[] = [line, blue, shine, ebony, silver, gold, desk, paper, flame, screen, coat, tan, cream, nose]

  const setPalette = (p: OniPalette) => {
    line.color.set(p.line)
    line.emissive.set(p.line)
    line.emissiveIntensity = p.glow
    blue.color.set(p.eyes)
    blue.emissive.set(p.eyes)
    blue.emissiveIntensity = p.glow * 0.6
    shine.color.set(p.shine)
    shine.emissive.set(p.shine)
    shine.emissiveIntensity = 0.6
  }
  setPalette(palette)

  const props: Record<TimelineProp, TimelinePropObject> = {
    clarinet: clarinet(),
    laptop: laptop(),
    mixer: mixer(),
    headphones: headphones(),
    book: book(),
    clock: clock(),
    torii: torii(),
    rocket: rocket(),
    yuzu: yuzu(),
    cube: cube(),
    plane: plane(),
    crown: crown(),
    cap: cap(),
    octopus: octopus(),
  }

  function clarinet(): TimelinePropObject {
    const root = new Group()
    const body = new Group()
    // Profile from the mouthpiece (top) to the bell (bottom), turned around Y.
    const profile = [
      [0, 1.12], [0.05, 1.1], [0.09, 1.0], [0.1, 0.9], [0.13, 0.88], [0.13, 0.66], [0.1, 0.64],
      [0.1, -0.55], [0.12, -0.62], [0.17, -0.8], [0.27, -0.95], [0.3, -1.0], [0, -1.0],
    ].map(([r, y]) => new Vector2(r, y))
    body.add(new Mesh(new LatheGeometry(profile, 32), ebony))
    // Mouthpiece in neon pink, silver rings, and a row of glowing tone holes.
    body.add(new Mesh(new CylinderGeometry(0.06, 0.1, 0.24, 24).translate(0, 1.0, 0), line))
    for (const y of [0.88, 0.66, 0.08, -0.55]) {
      body.add(new Mesh(new TorusGeometry(0.115, 0.022, 10, 32).rotateX(Math.PI / 2).translate(0, y, 0), silver))
    }
    for (const y of [0.48, 0.3, 0.12, -0.06, -0.24, -0.42]) {
      body.add(new Mesh(new SphereGeometry(0.035, 12, 8).translate(0, y, 0.095), blue))
    }
    // Keys: thin silver rods along the body.
    body.add(new Mesh(new CylinderGeometry(0.012, 0.012, 0.9, 8).translate(0.07, -0.05, 0.07), silver))
    body.rotation.z = -0.55
    root.add(body)
    return {
      root,
      animate(time, focus) {
        // A little tune: sways like it is being played.
        body.rotation.x = Math.sin(time * 2.4) * 0.12 * focus
        body.rotation.z = -0.55 + Math.sin(time * 1.2) * 0.08
      },
    }
  }

  function laptop(): TimelinePropObject {
    const root = new Group()
    root.add(new Mesh(new BoxGeometry(1.8, 0.08, 1.2).translate(0, -0.55, 0.3), desk))
    root.add(new Mesh(new BoxGeometry(1.5, 0.01, 0.55).translate(0, -0.505, 0.38), ebony))
    // The lid hinges at the back edge of the base.
    const lid = new Group()
    lid.position.set(0, -0.51, -0.3)
    lid.add(new Mesh(new BoxGeometry(1.8, 1.15, 0.06).translate(0, 0.575, 0), desk))
    lid.add(new Mesh(new BoxGeometry(1.6, 0.95, 0.01).translate(0, 0.585, 0.035), screen))
    // "</>" in neon on the screen, and a blinking cursor.
    const glyph = (w: number, h: number, x: number, y: number, angle: number) => {
      const mesh = new Mesh(new BoxGeometry(w, h, 0.02), line)
      mesh.position.set(x, y, 0.045)
      mesh.rotation.z = angle
      lid.add(mesh)
    }
    glyph(0.05, 0.26, -0.37, 0.66, -0.6)
    glyph(0.05, 0.26, -0.37, 0.48, 0.6)
    glyph(0.05, 0.5, 0, 0.57, -0.35)
    glyph(0.05, 0.26, 0.37, 0.66, 0.6)
    glyph(0.05, 0.26, 0.37, 0.48, -0.6)
    const caret = new Mesh(new BoxGeometry(0.12, 0.03, 0.02).translate(0.6, 0.22, 0.045), shine)
    lid.add(caret)
    lid.rotation.x = -0.18
    root.add(lid)
    return {
      root,
      animate(time, focus) {
        caret.visible = Math.sin(time * 6) > 0
        lid.rotation.x = -0.18 - 0.08 * focus
      },
    }
  }

  function mixer(): TimelinePropObject {
    const root = new Group()
    const board = new Group()
    board.add(new Mesh(new BoxGeometry(2.1, 0.22, 1.4), desk))
    const faders: Mesh[] = []
    const CHANNELS = 6
    for (let k = 0; k < CHANNELS; k++) {
      const x = -0.85 + (k * 1.7) / (CHANNELS - 1)
      // Fader slot, cap, and two knobs at the back of the strip.
      board.add(new Mesh(new BoxGeometry(0.05, 0.02, 0.7).translate(x, 0.12, 0.25), nose))
      const fader = new Mesh(new BoxGeometry(0.18, 0.1, 0.1), k === CHANNELS - 1 ? blue : line)
      fader.position.set(x, 0.16, 0.25)
      board.add(fader)
      faders.push(fader)
      for (const [z, material] of [[-0.25, k % 2 ? blue : shine], [-0.5, line]] as const) {
        board.add(new Mesh(new CylinderGeometry(0.07, 0.08, 0.1, 16).translate(x, 0.15, z), material))
      }
    }
    board.rotation.x = 0.75
    root.add(board)
    return {
      root,
      animate(time, focus) {
        // Faders ride the music.
        faders.forEach((fader, k) => {
          const level = Math.sin(time * (1.6 + k * 0.37) + k * 1.3) * 0.5 + 0.5
          fader.position.z = 0.55 - (0.15 + 0.5 * level * (0.3 + 0.7 * focus))
        })
      },
    }
  }

  function headphones(): TimelinePropObject {
    const root = new Group()
    const set = new Group()
    // Headband: half a torus over the top.
    set.add(new Mesh(new TorusGeometry(0.72, 0.07, 14, 40, Math.PI), line).translateY(-0.05))
    for (const side of [-1, 1]) {
      const cup = new Group()
      cup.position.set(side * 0.72, -0.35, 0)
      cup.add(new Mesh(new CylinderGeometry(0.06, 0.06, 0.35, 10).translate(0, 0.25, 0), silver))
      cup.add(new Mesh(new CylinderGeometry(0.34, 0.34, 0.26, 28).rotateZ(Math.PI / 2), ebony))
      cup.add(new Mesh(new TorusGeometry(0.27, 0.07, 12, 28).rotateY(Math.PI / 2).translate(-side * 0.15, 0, 0), blue))
      cup.add(new Mesh(new CylinderGeometry(0.2, 0.2, 0.02, 24).rotateZ(Math.PI / 2).translate(side * 0.14, 0, 0), line))
      set.add(cup)
    }
    root.add(set)
    return {
      root,
      animate(time, focus) {
        // Nods to the beat.
        const beat = Math.max(0, Math.sin(time * 6.5)) ** 6
        set.rotation.x = 0.15 * beat * focus
        set.scale.setScalar(1 + 0.04 * beat * focus)
      },
    }
  }

  function book(): TimelinePropObject {
    const root = new Group()
    const spread = new Group()
    // Covers and page blocks open in a V around the spine (along Z).
    for (const side of [-1, 1]) {
      const half = new Group()
      half.add(new Mesh(new BoxGeometry(0.95, 0.06, 1.3).translate(side * 0.48, 0, 0), line))
      half.add(new Mesh(new BoxGeometry(0.88, 0.12, 1.2).translate(side * 0.46, 0.08, 0), paper))
      half.rotation.z = side * 0.28
      spread.add(half)
    }
    // A page turning from right to left.
    const page = new Group()
    page.add(new Mesh(new BoxGeometry(0.86, 0.01, 1.18).translate(0.44, 0.16, 0), paper))
    spread.add(page)
    spread.add(new Mesh(new BoxGeometry(0.03, 0.03, 0.7).translate(-0.55, 0.2, 0), blue))
    spread.rotation.x = 0.9
    spread.position.y = -0.1
    root.add(spread)
    return {
      root,
      animate(time) {
        const phase = (time * 0.45) % 1
        page.rotation.z = 0.28 + Math.min(1, phase * 1.6) * (Math.PI - 0.56)
        page.visible = phase < 0.75
      },
    }
  }

  function clock(): TimelinePropObject {
    const root = new Group()
    const body = new Group()
    body.add(new Mesh(new CylinderGeometry(0.72, 0.72, 0.36, 40).rotateX(Math.PI / 2), line))
    body.add(new Mesh(new CylinderGeometry(0.6, 0.6, 0.02, 40).rotateX(Math.PI / 2).translate(0, 0, 0.19), paper))
    for (let k = 0; k < 12; k++) {
      const angle = (k / 12) * Math.PI * 2
      body.add(new Mesh(new BoxGeometry(0.03, k % 3 ? 0.06 : 0.12, 0.02).translate(0, 0.5, 0.21).rotateZ(angle), ebony))
    }
    const hour = new Mesh(new BoxGeometry(0.06, 0.32, 0.02).translate(0, 0.14, 0.22), ebony)
    const minute = new Mesh(new BoxGeometry(0.04, 0.46, 0.02).translate(0, 0.21, 0.23), ebony)
    body.add(hour, minute, new Mesh(new SphereGeometry(0.05, 12, 8).translate(0, 0, 0.23), blue))
    // Twin bells, their hammer, and little feet.
    for (const side of [-1, 1]) {
      const bell = new Mesh(new SphereGeometry(0.26, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), blue)
      bell.position.set(side * 0.45, 0.68, 0)
      bell.rotation.z = -side * 0.5
      body.add(bell)
      body.add(new Mesh(new CylinderGeometry(0.05, 0.07, 0.25, 10).translate(side * 0.42, -0.78, 0).rotateZ(side * 0.2), ebony))
    }
    body.add(new Mesh(new CylinderGeometry(0.03, 0.03, 0.3, 8).translate(0, 0.8, 0), silver))
    body.add(new Mesh(new SphereGeometry(0.07, 12, 8).translate(0, 0.95, 0), silver))
    root.add(body)
    return {
      root,
      animate(time, focus) {
        minute.rotation.z = -time * 1.2
        hour.rotation.z = -time * 0.1
        // Rings when it is the current event.
        body.rotation.z = Math.sin(time * 40) * 0.05 * focus * (Math.sin(time * 1.5) > 0.3 ? 1 : 0)
      },
    }
  }

  function torii(): TimelinePropObject {
    const root = new Group()
    // Pillars, slightly leaning inward like real torii.
    for (const side of [-1, 1]) {
      const pillar = new Mesh(new CylinderGeometry(0.075, 0.095, 1.75, 20), line)
      pillar.position.set(side * 0.62, -0.12, 0)
      pillar.rotation.z = side * 0.035
      root.add(pillar)
      root.add(new Mesh(new CylinderGeometry(0.12, 0.12, 0.12, 20).translate(side * 0.64, -0.96, 0), ebony))
    }
    // Kasagi: the dark top beam, curving up at both ends.
    const kasagi = new QuadraticBezierCurve3(new Vector3(-1.12, 0.98, 0), new Vector3(0, 0.74, 0), new Vector3(1.12, 0.98, 0))
    root.add(new Mesh(new TubeGeometry(kasagi, 32, 0.075, 12, false), ebony))
    for (const side of [-1, 1]) root.add(new Mesh(new SphereGeometry(0.075, 12, 8).translate(side * 1.12, 0.98, 0), ebony))
    // Shimaki under it, the nuki tie beam, and the plaque in between.
    root.add(new Mesh(new BoxGeometry(1.9, 0.1, 0.16).translate(0, 0.76, 0), line))
    root.add(new Mesh(new BoxGeometry(1.62, 0.08, 0.1).translate(0, 0.42, 0), line))
    root.add(new Mesh(new BoxGeometry(0.18, 0.26, 0.06).translate(0, 0.59, 0.04), blue))
    return {
      root,
      animate(time) {
        root.position.y = Math.sin(time * 1.1) * 0.03
      },
    }
  }

  function rocket(): TimelinePropObject {
    const root = new Group()
    const ship = new Group()
    const profile = [[0, 1.0], [0.12, 0.85], [0.26, 0.55], [0.32, 0.2], [0.32, -0.35], [0.26, -0.55], [0, -0.55]]
      .map(([r, y]) => new Vector2(r, y))
    ship.add(new Mesh(new LatheGeometry(profile, 32), paper))
    ship.add(new Mesh(new ConeGeometry(0.15, 0.32, 24).translate(0, 0.85, 0), line))
    ship.add(new Mesh(new TorusGeometry(0.13, 0.035, 10, 24).translate(0, 0.25, 0.3), silver))
    ship.add(new Mesh(new SphereGeometry(0.11, 16, 12).scale(1, 1, 0.5).translate(0, 0.25, 0.3), blue))
    for (let k = 0; k < 3; k++) {
      ship.add(new Mesh(new BoxGeometry(0.04, 0.42, 0.32).translate(0, -0.42, 0.42).rotateY((k / 3) * Math.PI * 2), line))
    }
    const fire = new Mesh(new ConeGeometry(0.18, 0.55, 20).rotateX(Math.PI).translate(0, -0.85, 0), flame)
    ship.add(fire)
    ship.rotation.z = -0.35
    root.add(ship)
    return {
      root,
      animate(time, focus) {
        fire.scale.set(1, 0.8 + 0.3 * Math.sin(time * 30) * Math.sin(time * 17) + 0.4 * focus, 1)
        ship.position.y = Math.sin(time * 2) * 0.05 + 0.12 * focus
      },
    }
  }

  function yuzu(): TimelinePropObject {
    const root = new Group()
    const head = new Group()
    head.add(new Mesh(new SphereGeometry(0.7, 32, 24).scale(1.05, 0.92, 0.9), coat))
    // Cream urajiro on the muzzle and chin, framed by tan cheeks.
    head.add(new Mesh(new SphereGeometry(0.4, 24, 16).scale(1.15, 0.72, 0.95).translate(0, -0.24, 0.42), cream))
    for (const side of [-1, 1]) {
      head.add(new Mesh(new SphereGeometry(0.22, 20, 14).scale(1, 0.8, 0.8).translate(side * 0.4, -0.2, 0.36), tan))
      head.add(new Mesh(new SphereGeometry(0.085, 16, 12).translate(side * 0.26, 0.06, 0.6), nose))
      head.add(new Mesh(new SphereGeometry(0.03, 8, 6).translate(side * 0.25 - 0.02, 0.1, 0.68), shine))
      // Tan "eyebrows" above the eyes: the four-eyed look of black and tan Shibas.
      head.add(new Mesh(new SphereGeometry(0.07, 12, 8).scale(1.3, 0.8, 0.6).translate(side * 0.27, 0.25, 0.57), tan))
    }
    head.add(new Mesh(new SphereGeometry(0.1, 16, 12).scale(1.2, 0.8, 0.8).translate(0, -0.14, 0.8), nose))
    head.add(new Mesh(new SphereGeometry(0.07, 12, 8).scale(1.3, 0.5, 0.6).translate(0, -0.44, 0.7), line))
    const ears = [-1, 1].map((side) => {
      const ear = new Group()
      ear.add(new Mesh(new ConeGeometry(0.25, 0.5, 4), coat))
      ear.add(new Mesh(new ConeGeometry(0.15, 0.32, 4).translate(0, -0.05, 0.08), cream))
      ear.position.set(side * 0.42, 0.66, -0.05)
      ear.rotation.set(0, Math.PI / 4, -side * 0.32)
      head.add(ear)
      return { ear, side }
    })
    root.add(head)
    return {
      root,
      animate(time, focus) {
        // Head tilt of a curious dog, and twitching ears.
        head.rotation.z = Math.sin(time * 0.9) * 0.12 + 0.15 * focus * Math.sin(time * 0.45)
        for (const { ear, side } of ears) {
          ear.rotation.z = -side * (0.32 + Math.max(0, Math.sin(time * 3 + side)) ** 8 * 0.25)
        }
      },
    }
  }

  function cube(): TimelinePropObject {
    const root = new Group()
    const box = new Group()
    box.add(new Mesh(new BoxGeometry(1.1, 1.1, 1.1), blue))
    // Neon edges.
    const half = 0.57
    for (const axis of [0, 1, 2]) {
      for (const a of [-1, 1]) {
        for (const b of [-1, 1]) {
          const edge = new CylinderGeometry(0.045, 0.045, half * 2 + 0.09, 10)
          if (axis === 0) edge.rotateZ(Math.PI / 2).translate(0, a * half, b * half)
          else if (axis === 1) edge.translate(a * half, 0, b * half)
          else edge.rotateX(Math.PI / 2).translate(a * half, b * half, 0)
          box.add(new Mesh(edge, line))
        }
      }
    }
    root.add(box)
    return {
      root,
      animate(time, focus) {
        box.rotation.set(0.6 + time * 0.4 * (0.3 + focus), time * 0.7, 0.2)
      },
    }
  }

  function plane(): TimelinePropObject {
    const root = new Group()
    const craft = new Group()
    craft.add(new Mesh(new CapsuleGeometry(0.2, 1.4, 8, 20).rotateZ(Math.PI / 2), paper))
    craft.add(new Mesh(new BoxGeometry(0.42, 0.05, 2.0).translate(0.05, -0.04, 0), line))
    craft.add(new Mesh(new BoxGeometry(0.22, 0.04, 0.7).translate(-0.78, 0.05, 0), line))
    craft.add(new Mesh(new BoxGeometry(0.26, 0.42, 0.04).translate(-0.8, 0.24, 0), blue))
    for (let k = 0; k < 5; k++) {
      craft.add(new Mesh(new SphereGeometry(0.04, 10, 8).translate(0.45 - k * 0.2, 0.06, 0.19), blue))
    }
    for (const z of [-0.55, 0.55]) {
      craft.add(new Mesh(new CylinderGeometry(0.08, 0.08, 0.28, 14).rotateZ(Math.PI / 2).translate(0.15, -0.14, z), ebony))
    }
    craft.rotation.y = -0.5
    root.add(craft)
    return {
      root,
      animate(time, focus) {
        craft.rotation.x = Math.sin(time * 1.3) * 0.25
        craft.position.y = Math.sin(time * 1.3 + 1) * 0.08 + 0.1 * focus
      },
    }
  }

  function crown(): TimelinePropObject {
    const root = new Group()
    root.add(new Mesh(new CylinderGeometry(0.72, 0.62, 0.5, 40, 1, true).translate(0, -0.3, 0), gold))
    root.add(new Mesh(new TorusGeometry(0.64, 0.05, 10, 40).rotateX(Math.PI / 2).translate(0, -0.55, 0), gold))
    const jewels: Mesh[] = []
    for (let k = 0; k < 6; k++) {
      const angle = (k / 6) * Math.PI * 2
      const x = Math.sin(angle) * 0.7
      const z = Math.cos(angle) * 0.7
      root.add(new Mesh(new ConeGeometry(0.16, 0.55, 12).translate(x, 0.2, z), gold))
      root.add(new Mesh(new SphereGeometry(0.07, 12, 8).translate(x, 0.5, z), shine))
      const jewel = new Mesh(new SphereGeometry(0.09, 14, 10).scale(1, 1.2, 0.6), k % 2 ? blue : line)
      jewel.position.set(Math.sin(angle) * 0.73, -0.3, Math.cos(angle) * 0.73)
      jewel.rotation.y = angle
      root.add(jewel)
      jewels.push(jewel)
    }
    return {
      root,
      animate(time, focus) {
        jewels.forEach((jewel, k) => jewel.scale.setScalar(1 + 0.15 * focus * Math.max(0, Math.sin(time * 3 + k))))
      },
    }
  }

  function cap(): TimelinePropObject {
    const root = new Group()
    const hat = new Group()
    hat.add(new Mesh(new CylinderGeometry(0.55, 0.62, 0.45, 32).translate(0, -0.2, 0), ebony))
    hat.add(new Mesh(new BoxGeometry(1.6, 0.07, 1.6).rotateY(Math.PI / 4).translate(0, 0.06, 0), ebony))
    hat.add(new Mesh(new CylinderGeometry(0.07, 0.07, 0.05, 12).translate(0, 0.12, 0), line))
    // The tassel swings from the button to the edge of the board.
    const tassel = new Group()
    tassel.position.set(0, 0.12, 0)
    tassel.add(new Mesh(new CylinderGeometry(0.015, 0.015, 0.78, 6).rotateZ(Math.PI / 2).translate(0.39, 0, 0), line))
    const cord = new Group()
    cord.position.set(0.78, 0, 0)
    cord.add(new Mesh(new CylinderGeometry(0.015, 0.015, 0.35, 6).translate(0, -0.17, 0), line))
    cord.add(new Mesh(new ConeGeometry(0.07, 0.22, 12).translate(0, -0.4, 0), line))
    tassel.add(cord)
    hat.add(tassel)
    hat.rotation.x = 0.35
    root.add(hat)
    return {
      root,
      animate(time, focus) {
        cord.rotation.z = Math.sin(time * 2.4) * (0.15 + 0.25 * focus)
        hat.position.y = Math.sin(time * 1.2) * 0.04
      },
    }
  }

  function octopus(): TimelinePropObject {
    const root = new Group()
    root.add(new Mesh(new SphereGeometry(0.55, 32, 24).scale(1, 1.15, 0.95).translate(0, 0.35, 0), line))
    for (const side of [-1, 1]) {
      root.add(new Mesh(new SphereGeometry(0.12, 16, 12).scale(0.8, 1.2, 0.5).translate(side * 0.2, 0.22, 0.48), blue))
      root.add(new Mesh(new SphereGeometry(0.035, 8, 6).translate(side * 0.2 - 0.03, 0.28, 0.54), shine))
    }
    // Eight tentacles, each a chain of shrinking beads that waves.
    const tentacles = Array.from({ length: 8 }, (_, k) => {
      const angle = (k / 8) * Math.PI * 2
      const base = new Group()
      base.position.set(Math.sin(angle) * 0.38, -0.05, Math.cos(angle) * 0.38)
      base.rotation.y = angle
      const joints: Group[] = []
      let parent = base
      for (let j = 0; j < 6; j++) {
        const joint = new Group()
        joint.position.set(0, j ? -0.16 : 0, 0)
        joint.add(new Mesh(new SphereGeometry(0.11 - j * 0.014, 12, 8), line))
        parent.add(joint)
        joints.push(joint)
        parent = joint
      }
      root.add(base)
      return { joints, phase: k * 0.8 }
    })
    return {
      root,
      animate(time, focus) {
        for (const { joints, phase } of tentacles) {
          joints.forEach((joint, j) => {
            joint.rotation.x = 0.25 + Math.sin(time * 2.2 + phase + j * 0.6) * (0.18 + 0.12 * focus)
          })
        }
      },
    }
  }

  const dispose = () => {
    for (const prop of Object.values(props)) {
      prop.root.traverse((object) => {
        if (object instanceof Mesh) object.geometry.dispose()
      })
    }
    for (const material of materials) material.dispose()
  }

  return { props, setPalette, dispose }
}
