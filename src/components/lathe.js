import Element from 'element'
import * as THREE from 'three'
import state from '../state.js'
import { initRenderer, animate, updateShape, applyTexture } from '../lathe.js'
import { drag, startDrag, stopDrag, zoom, lightControl } from '../controls.js'

class Lathe extends Element
{
  name = "body"

  children = {
    svgInput: {
      name: "textarea",
      listeners: {
        input: event => {
          updateShape(event.target.value)
        }
      }
    },
    texture: {
      name: "input",
      props: { type: "file" },
      listeners: {
        change: event => {
          const file = event.target.files[0]
          if (file) {
            applyTexture(file)
          }
        }
      }
    }
  }

  listeners = {
    mousedown: startDrag,
    mouseup: stopDrag,
    mousemove: drag,
    keydown: lightControl,
    wheel: zoom
  }

  postRender = {
    attach: _ => {
      document.body = this.node
      initRenderer(this.node)
      animate()
    }
  }
}

export default Lathe
