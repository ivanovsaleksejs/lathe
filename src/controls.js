import * as THREE from 'three'
import state from './state.js'
import { updateLightPosition, getObjectCenter } from './lathe.js'

const drag = event =>
{

  let latheMesh = state.latheMesh
  let camera = state.camera
  let previousMousePosition = state.previousMousePosition

  if (state.isDragging) {
    const deltaMove = {
      x: event.clientX - previousMousePosition.x,
      y: event.clientY - previousMousePosition.y,
    }

    const spherical = new THREE.Spherical()
    spherical.setFromVector3(camera.position.clone().sub(getObjectCenter(latheMesh.geometry)))
    spherical.theta -= deltaMove.x * 0.01
    spherical.phi -= deltaMove.y * 0.01

    spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1, spherical.phi))

    const targetPosition = new THREE.Vector3().setFromSpherical(spherical).add(getObjectCenter(latheMesh.geometry))
    camera.position.copy(targetPosition)
    camera.lookAt(getObjectCenter(latheMesh.geometry))

    state.previousMousePosition = { x: event.clientX, y: event.clientY }
  }
}

const startDrag = event =>
{
  state.isDragging = true
  state.previousMousePosition = { x: event.clientX, y: event.clientY }
}

const stopDrag = _ =>
{
  state.isDragging = false
}

const zoom = event =>
{

  let latheMesh = state.latheMesh
  let camera = state.camera

  const center = getObjectCenter(latheMesh.geometry)
  const direction = camera.position.clone().sub(center)
  const currentDistance = direction.length()

  latheMesh.geometry.computeBoundingBox()
  const boundingBox = latheMesh.geometry.boundingBox
  const size = new THREE.Vector3()
  boundingBox.getSize(size)

  const maxSize = Math.max(size.x, size.y, size.z)
  const minDistance = maxSize * 0.5
  const maxDistance = maxSize * 5

  const zoomDelta = event.deltaY * 0.001 * maxSize
  const newDistance = currentDistance + zoomDelta

  const clampedDistance = Math.max(minDistance, Math.min(maxDistance, newDistance))

  const normalizedDirection = direction.normalize()
  camera.position.copy(normalizedDirection.multiplyScalar(clampedDistance).add(center))
  camera.lookAt(center)
}

const lightControl = event =>
{
  switch (event.key) {
    case "ArrowDown":
      state.lightAnglePhi = Math.max(0.1, state.lightAnglePhi - 0.1)
      break
    case "ArrowUp":
      state.lightAnglePhi = Math.min(Math.PI - 0.1, state.lightAnglePhi + 0.1)
      break
    case "ArrowRight":
      state.lightAngleTheta -= 0.1
      break
    case "ArrowLeft":
      state.lightAngleTheta += 0.1
      break
    case "+":
      state.lightIntensity = Math.min(5, state.lightIntensity + 0.1)
      state.directionalLight.intensity = state.lightIntensity
      break
    case "-":
      state.lightIntensity = Math.max(0, state.lightIntensity - 0.1)
      state.directionalLight.intensity = state.lightIntensity
      break
    default:
      return
  }

  updateLightPosition()
}

export { drag, startDrag, stopDrag, zoom, lightControl }
