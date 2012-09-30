Function.prototype.bind ?= (new_this) ->
   => @apply new_this, arguments

window.core = core = {}
core.input = {
   _bindings: {}
   _down: {}
   _pressed: {}
   _released: []
   mouse: { x:0, y:0 }

   bind: (key, action) ->
      @_bindings[key] = action

   onkeydown: (e) ->
      action = @_bindings[core.eventCode e]
      return unless action
      
      @_pressed[action] = true unless @_down[action]
      @_down[action] = true
      

      e.stopPropagation()
      e.preventDefault()

   onkeyup: (e) ->
      action = @_bindings[core.eventCode e]
      return unless action
      @_released.push action
      e.stopPropagation()
      e.preventDefault()

   clearPressed: ->
      for action in @_released
         @_down[action] = false
      @_released = []
      @_pressed = {}

   pressed: (action) -> @_pressed[action]
   down: (action) -> @_down[action]
   released: (action) -> (action in @_released)

   onmousemove: (e) ->
      @mouse = core.toCanvas { x: e.pageX, y: e.pageY }
   onmousedown: (e) -> @onkeydown(e)
   onmouseup: (e) -> @onkeyup(e)
   onmousewheel: (e) ->
      @onkeydown e
      @onkeyup e
   oncontextmenu: (e) ->
      if @_bindings[core.button.RIGHT]
         e.stopPropagation()
         e.preventDefault()
}

core.update = ->
   deadIdxs = []
   if core.apps
      for i in [0...core.apps.length]
         if core.apps[i]
            core.apps[i].step( )
         else
            deadIdxs.push i
      for idx in deadIdxs
         core.apps.splice idx, 1
            
core.apps = []
core.registerApp = (app) ->
   core.apps.push app

core.screenMouse = ->
   core.toGlobal core.input.mouse
   
core.scrollPos = ->
   node = core.canvas
   offsetLeft = 0
   offsetTop = 0
   while node
      offsetLeft += $(node).scrollLeft( )
      offsetTop += $(node).scrollTop( )
      node = node.parentNode
   return { x: offsetLeft, y: offsetTop }

core.toCanvas = (coord) ->
   scroll = core.scrollPos( )
   {
      x: coord.x - core.canvas.offsetLeft + scroll.x,
      y: coord.y - core.canvas.offsetTop + scroll.y
   }
   
core.toGlobal = (coord)->
   scroll = core.scrollPos( )
   {
      x: -scroll.x + core.canvas.offsetLeft + coord.x,
      y: -scroll.y + core.canvas.offsetTop + coord.y
   }
   
core.canvasMouse = ->
   core.input.mouse

###
   'keydown',
   'keyup',
   'mousedown',
   'mouseup',
   'mousewheel',
   'mousemove',
   'contextmenu'
###

core.button =
   LEFT: -1
   MIDDLE: -2
   RIGHT: -3
   WHEELDOWN: -4
   WHEELUP: -5
   
core.key =
   TAB: 9
   ENTER: 13
   ESC: 27
   SPACE: 32
   LEFT_ARROW: 37
   UP_ARROW: 38
   RIGHT_ARROW: 39
   DOWN_ARROW: 40
   SHIFT: 16
   CTRL: 17
   ALT: 18
   BACKSPACE: 8
   DELETE: 46
   COMMAND: 91
   
ascii = (c) -> c.charCodeAt 0

for c in [(ascii 'A')..(ascii 'Z')]
   core.key[String.fromCharCode c] = c
   
core.eventCode = (e) ->
   if e.type == 'keydown' or e.type == 'keyup'
      e.keyCode
   else if e.type == 'mousedown' or e.type == 'mouseup'
      switch e.button
         when 0 then core.button.LEFT
         when 1 then core.button.MIDDLE
         when 2 then core.button.RIGHT
   else if e.type == 'mousewheel'
      if e.wheel > 0
         core.button.WHEELUP
      else
         core.button.WHEELDOWN

# TODO, multicanvas: put this in App class
core.canvas = document.getElementsByTagName('canvas')[0]
core.ctx = core.canvas.getContext '2d'

core.canvas.onmousemove = core.input.onmousemove.bind core.input
core.canvas.onmousedown = core.input.onmousedown.bind core.input
core.canvas.onmouseup = core.input.onmouseup.bind core.input
core.canvas.onmousewheel = core.input.onmousewheel.bind core.input
core.canvas.oncontextmenu = core.input.oncontextmenu.bind core.input

document.onkeydown = core.input.onkeydown.bind core.input
document.onkeyup = core.input.onkeyup.bind core.input
document.onmouseup = core.input.onmouseup.bind core.input

requestAnimationFrame = window.requestAnimationFrame or
   window.webkitRequestAnimationFrame or
   window.mozRequestAnimationFrame or
   window.oRequestAnimationFrame or
   window.msRequestAnimationFrame or
   (callback) ->
      window.setTimeout(callback, 1000 / 60)

class App
   constructor: ->
      @fps = 30
      @time = 0
      @invalidated = true
   update: (dt) ->
   invalidate: ->
      @invalidated = true
   draw: ->
      @invalidated = false
   run: ->
      @running = true

      self = @
      s = ->
         self.step()
         if self.running
            requestAnimationFrame s

      @last_step = Date.now()
      s()
   stop: ->
      @running = false
   step: ->
      now = Date.now()
      dt = (now - @last_step) / 1000
      @last_step = now
      @time += dt
      @update dt
      @draw() if @invalidated
      core.input.clearPressed()

core.App = App

