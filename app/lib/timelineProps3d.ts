import {
  BoxGeometry,
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
} from 'three'
import type { OniPalette } from './petitOni3d'

/**
 * The little 3D objects of the scrollytelling timeline, one per turning point
 * of the journey: the clarinet (conservatoire), the mixing desk (sound
 * engineering), the torii (Japan) and Yuzu the Shiba. Built from primitives,
 * with the same glossy neon materials as Petit-Oni. Each fits in a box about
 * 2 world units tall, centered on its origin.
 */

export const TIMELINE_PROPS = ['clarinet', 'mixer', 'torii', 'yuzu'] as const
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
  const desk = glossy('#26263a')
  const fur = glossy('#e38b3f')
  const cream = glossy('#f6e8d4')
  const nose = glossy('#14141c')

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

  const props = {
    clarinet: clarinet(),
    mixer: mixer(),
    torii: torii(),
    yuzu: yuzu(),
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

  function yuzu(): TimelinePropObject {
    const root = new Group()
    const head = new Group()
    head.add(new Mesh(new SphereGeometry(0.7, 32, 24).scale(1.05, 0.92, 0.9), fur))
    // Cream muzzle and cheeks, the Shiba "urajiro".
    head.add(new Mesh(new SphereGeometry(0.4, 24, 16).scale(1.15, 0.72, 0.95).translate(0, -0.24, 0.42), cream))
    head.add(new Mesh(new SphereGeometry(0.1, 16, 12).scale(1.2, 0.8, 0.8).translate(0, -0.14, 0.8), nose))
    head.add(new Mesh(new SphereGeometry(0.07, 12, 8).scale(1.3, 0.5, 0.6).translate(0, -0.44, 0.7), line))
    for (const side of [-1, 1]) {
      head.add(new Mesh(new SphereGeometry(0.085, 16, 12).translate(side * 0.26, 0.06, 0.6), nose))
      head.add(new Mesh(new SphereGeometry(0.025, 8, 6).translate(side * 0.25 - 0.02, 0.09, 0.68), shine))
      // Little cream "eyebrows" dots, very Shiba.
      head.add(new Mesh(new SphereGeometry(0.06, 12, 8).scale(1.3, 0.8, 0.6).translate(side * 0.27, 0.24, 0.57), cream))
    }
    const ears = [-1, 1].map((side) => {
      const ear = new Group()
      ear.add(new Mesh(new ConeGeometry(0.25, 0.5, 4), fur))
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

  const dispose = () => {
    for (const prop of Object.values(props)) {
      prop.root.traverse((object) => {
        if (object instanceof Mesh) object.geometry.dispose()
      })
    }
    for (const material of [line, blue, shine, ebony, silver, desk, fur, cream, nose]) material.dispose()
  }

  return { props, setPalette, dispose }
}
