import * as THREE from 'three'
import state from './state.js'
import Lathe from './components/lathe.js'

state.lathe = new Lathe
state.lathe.toNode()
