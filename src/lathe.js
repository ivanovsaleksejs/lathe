import * as THREE from 'three'
import state from './state.js'

const initRenderer = node =>
{
  state.scene = new THREE.Scene()
  state.camera = new THREE.PerspectiveCamera(75, 800/600, 0.1, 1000)
  state.renderer = new THREE.WebGLRenderer()

  state.renderer.setSize(800, 600)
  node.appendChild(state.renderer.domElement)

  state.renderer.shadowMap.enabled = true
  state.renderer.shadowMap.type = THREE.PCFSoftShadowMap

  state.latheMesh = null

  state.ambientLight = new THREE.AmbientLight(0xffffff, 0.2)
  state.scene.add(state.ambientLight)

  state.directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  state.directionalLight.position.set(400, 400, 400)

  state.directionalLight.castShadow = true

  state.directionalLight.shadow.mapSize.width = 2048
  state.directionalLight.shadow.mapSize.height = 2048

  state.directionalLight.shadow.camera.near = 0.1
  state.directionalLight.shadow.camera.far = 500
  state.directionalLight.shadow.camera.left = -50
  state.directionalLight.shadow.camera.right = 50
  state.directionalLight.shadow.camera.top = 50
  state.directionalLight.shadow.camera.bottom = -50
  state.scene.add(state.directionalLight)

  state.isDragging = false
  state.previousMousePosition = { x: 0, y: 0 }
  state.distance = 10

  state.lightDistance = 10
  state.lightAngleTheta = Math.PI / 4
  state.lightAnglePhi = Math.PI / 4
  state.lightIntensity = 1
}

const animate = _ =>
{
  requestAnimationFrame(animate)
  state.renderer.render(state.scene, state.camera)
}

const adjustCamera = latheGeometry =>
{
  let camera = state.camera

  latheGeometry.computeBoundingBox()
  const boundingBox = latheGeometry.boundingBox

  const size = new THREE.Vector3()
  boundingBox.getSize(size)

  const maxDim = Math.max(size.x, size.y, size.z)
  const distance = maxDim / (2 * Math.tan((camera.fov * Math.PI) / 360))

  const center = new THREE.Vector3()
  boundingBox.getCenter(center)
  camera.position.set(center.x, center.y, distance * 1.5)
  camera.lookAt(center)
}

const updateShape = inputText =>
{
  let latheMesh = state.latheMesh

  const shape = new THREE.Shape()
  const lines = inputText.trim().split("\n")

  const [startX, startY] = lines[0].trim().split(" ").map(Number)
  shape.moveTo(startX, -startY)

  lines.slice(1).forEach(line => {
    const values = line.trim().split(" ").map(Number)

    if (values.length === 2) {
      const [x, y] = values
      shape.lineTo(x, -y)
    } else if (values.length === 6) {
      const [cp1x, cp1y, cp2x, cp2y, x, y] = values
      shape.bezierCurveTo(cp1x, -cp1y, cp2x, -cp2y, x, -y)
    }
  })

  const points = shape.getPoints().map(p => new THREE.Vector2(p.x - startX, p.y))
  const topY = Math.max(...points.map(p => p.y))
  const bottomY = Math.min(...points.map(p => p.y))

  points.push(new THREE.Vector2(0, bottomY))
  points.unshift(new THREE.Vector2(0, topY))

  const latheGeometry = new THREE.LatheGeometry(points, 64)
  const material = new THREE.MeshStandardMaterial({ color: 0xFFCC00, roughness: 0.7, metalness: 0.2 })

  if (latheMesh) {
    state.scene.remove(latheMesh)
    latheMesh.geometry.dispose()
    latheMesh.material.dispose()
  }

  state.latheMesh = new THREE.Mesh(latheGeometry, material)
  state.latheMesh.castShadow = true
  state.latheMesh.material.shadowSide = THREE.FrontSide
  state.scene.add(state.latheMesh)

  adjustCamera(latheGeometry)
}

const updateLightPosition = _ =>
{
  const center = getObjectCenter(state.latheMesh.geometry)

  const lightX = center.x + state.lightDistance * Math.sin(state.lightAnglePhi) * Math.cos(state.lightAngleTheta)
  const lightY = center.y + state.lightDistance * Math.cos(state.lightAnglePhi)
  const lightZ = center.z + state.lightDistance * Math.sin(state.lightAnglePhi) * Math.sin(state.lightAngleTheta)

  state.directionalLight.position.set(lightX, lightY, lightZ)

  state.directionalLight.target.position.set(center.x, center.y, center.z)
  state.directionalLight.target.updateMatrixWorld()
}

const getObjectCenter = latheGeometry =>
{
  latheGeometry.computeBoundingBox()
  const boundingBox = latheGeometry.boundingBox

  const center = new THREE.Vector3()
  boundingBox.getCenter(center)

  center.x = 0
  center.z = 0
  return center
}

const applyTexture = file =>
{
  const reader = new FileReader()

  reader.onload = event => {
    const texture = new THREE.TextureLoader().load(event.target.result, () => {
      let latheMesh = state.latheMesh

      if (latheMesh && latheMesh.geometry) {
        latheMesh.geometry.computeBoundingBox()
        const boundingBox = latheMesh.geometry.boundingBox

        const size = new THREE.Vector3()
        boundingBox.getSize(size)

        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
        texture.repeat.set(
          Math.max(1, size.x / texture.image.width),
          Math.max(1, size.y / texture.image.height)
        )

        latheMesh.material.map = texture
        latheMesh.material.needsUpdate = true
      }
    })
  }

  reader.readAsDataURL(file)
}

export { initRenderer, animate, updateShape, applyTexture, updateLightPosition, getObjectCenter }
