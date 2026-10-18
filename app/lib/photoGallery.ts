import {
  Mesh,
  OrthographicCamera,
  PlaneGeometry,
  Scene,
  ShaderMaterial,
  TextureLoader,
  Vector2,
  WebGLRenderer,
  type Texture,
} from 'three'

/**
 * WebGL layer of the photo gallery. The photos are laid out by the DOM (a
 * draggable strip of <img>); every frame, each plane copies its image's box
 * and the shaders add what CSS can't: a ripple and a lens zoom around the
 * cursor, colour that comes alive on hover, and an RGB split and a bend that
 * follow the strip's speed.
 */

const vertexShader = /* glsl */ `
  uniform float uVelocity;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec3 p = position;
    // The middle of the photo lags behind the edges while the strip moves.
    p.y += sin(uv.x * 3.14159) * uVelocity * 0.04;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uTexture;
  uniform vec2 uImage;
  uniform vec2 uPlane;
  uniform vec2 uMouse;
  uniform float uHover;
  uniform float uVelocity;
  uniform float uTime;
  uniform float uStrength;
  uniform float uReveal;
  varying vec2 vUv;

  // object-fit: cover
  vec2 cover(vec2 uv) {
    float imageRatio = uImage.x / uImage.y;
    float planeRatio = uPlane.x / uPlane.y;
    vec2 scale = planeRatio < imageRatio ? vec2(planeRatio / imageRatio, 1.0) : vec2(1.0, imageRatio / planeRatio);
    return (uv - 0.5) * scale + 0.5;
  }

  float roundedBox(vec2 p, vec2 halfSize, float radius) {
    vec2 q = abs(p) - halfSize + radius;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - radius;
  }

  void main() {
    vec2 uv = vUv;
    // Lens: a slight zoom toward the cursor.
    uv = mix(uv, uMouse, 0.07 * uHover);
    // Ripple rings around the cursor.
    vec2 toMouse = (vUv - uMouse) * vec2(uPlane.x / uPlane.y, 1.0);
    float dist = length(toMouse);
    float ripple = sin(dist * 30.0 - uTime * 5.0) * exp(-dist * 5.0) * 0.012 * uHover * uStrength;
    uv += normalize(toMouse + 1e-5) * ripple;

    vec2 tuv = cover(uv);
    float shift = (abs(uVelocity) * 0.012 + uHover * 0.003) * uStrength;
    float r = texture2D(uTexture, tuv + vec2(shift, 0.0)).r;
    vec2 gb = texture2D(uTexture, tuv).gb;
    float b = texture2D(uTexture, tuv - vec2(shift, 0.0)).b;
    vec3 colour = vec3(r, gb.x, b);

    // Slightly muted at rest, full colour under the cursor.
    float grey = dot(colour, vec3(0.299, 0.587, 0.114));
    colour = mix(vec3(grey), colour, 0.72 + 0.28 * uHover);

    // Rounded corners (14px), antialiased.
    float edge = roundedBox((vUv - 0.5) * uPlane, uPlane * 0.5, 14.0);
    float alpha = (1.0 - smoothstep(-1.0, 0.5, edge)) * uReveal;
    gl_FragColor = vec4(colour * alpha, alpha);
  }
`

interface Plane {
  element: HTMLElement
  mesh: Mesh<PlaneGeometry, ShaderMaterial>
  hover: number
  reveal: number
  loaded: boolean
}

export interface PhotoGalleryGL {
  /** Call every frame: `velocity` is the strip's speed (-1 to 1), `pointer` in viewport px or null. */
  render: (input: { velocity: number, pointer: { x: number, y: number } | null, dt: number }) => void
  resize: () => void
  dispose: () => void
}

export function createPhotoGalleryGL(canvas: HTMLCanvasElement, items: { element: HTMLElement, url: string }[], options: { reducedMotion: boolean }): PhotoGalleryGL {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, premultipliedAlpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x000000, 0)

  const scene = new Scene()
  const camera = new OrthographicCamera(-1, 1, 1, -1, -10, 10)
  const geometry = new PlaneGeometry(1, 1, 24, 1)
  const loader = new TextureLoader()
  const textures: Texture[] = []
  let time = 0

  const planes: Plane[] = items.map(({ element, url }) => {
    const material = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      transparent: true,
      // The fragment shader outputs premultiplied colour (rounded-corner mask).
      premultipliedAlpha: true,
      uniforms: {
        uTexture: { value: null },
        uImage: { value: new Vector2(3, 2) },
        uPlane: { value: new Vector2(1, 1) },
        uMouse: { value: new Vector2(0.5, 0.5) },
        uHover: { value: 0 },
        uVelocity: { value: 0 },
        uTime: { value: 0 },
        uStrength: { value: options.reducedMotion ? 0 : 1 },
        uReveal: { value: 0 },
      },
    })
    const mesh = new Mesh(geometry, material)
    scene.add(mesh)
    const plane: Plane = { element, mesh, hover: 0, reveal: 0, loaded: false }
    loader.load(url, (texture) => {
      textures.push(texture)
      material.uniforms.uTexture!.value = texture
      const image = texture.image as HTMLImageElement
      material.uniforms.uImage!.value.set(image.naturalWidth || image.width, image.naturalHeight || image.height)
      plane.loaded = true
    })
    return plane
  })

  const resize = () => {
    const { width, height } = canvas.getBoundingClientRect()
    renderer.setSize(width, height, false)
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = -height / 2
    camera.updateProjectionMatrix()
  }
  resize()

  const damp = (current: number, target: number, lambda: number, dt: number) => current + (target - current) * (1 - Math.exp(-lambda * dt))

  const render: PhotoGalleryGL['render'] = ({ velocity, pointer, dt }) => {
    time += dt
    const box = canvas.getBoundingClientRect()
    for (const plane of planes) {
      const rect = plane.element.getBoundingClientRect()
      const { mesh } = plane
      const uniforms = mesh.material.uniforms
      mesh.visible = rect.width > 0 && rect.right > box.left && rect.left < box.right
      if (!mesh.visible) continue
      mesh.position.set(rect.left - box.left + rect.width / 2 - box.width / 2, box.height / 2 - (rect.top - box.top + rect.height / 2), 0)
      mesh.scale.set(rect.width, rect.height, 1)
      uniforms.uPlane!.value.set(rect.width, rect.height)

      const inside = pointer && pointer.x >= rect.left && pointer.x <= rect.right && pointer.y >= rect.top && pointer.y <= rect.bottom
      if (inside) uniforms.uMouse!.value.set((pointer.x - rect.left) / rect.width, 1 - (pointer.y - rect.top) / rect.height)
      plane.hover = damp(plane.hover, inside ? 1 : 0, 6, dt)
      plane.reveal = damp(plane.reveal, plane.loaded ? 1 : 0, 4, dt)
      uniforms.uHover!.value = plane.hover
      uniforms.uReveal!.value = plane.reveal
      uniforms.uVelocity!.value = velocity
      uniforms.uTime!.value = time
    }
    renderer.render(scene, camera)
  }

  const dispose = () => {
    geometry.dispose()
    for (const plane of planes) plane.mesh.material.dispose()
    for (const texture of textures) texture.dispose()
    renderer.dispose()
  }

  return { render, resize, dispose }
}
