app = module.exports = require 'appjs'

app.serveFilesFrom __dirname + '/frontend'


# create the main window
window = app.createWindow(
  width:  800,
  height: 500,
  icons:  __dirname + '/frontend/icons'
)

# when window is created...
window.on 'create', ->
  console.log "Window Created"
  
  window.frame.show()
  window.frame.center() # center window on screen


# when window is ready...
window.on 'ready', ->
  console.log "Window Ready"
  window.require = require
  window.process = process
  window.module = module
  
  # triggers to open chromium developer console
  F12 = (e)->
    e.keyIdentifier is 'F12'
  Command_Option_J = (e)->
    e.keyCode is 74 and e.metaKey and e.altKey
  
  window.addEventListener 'keydown', (e)->
    window.frame.openDevTools() if F12(e) or Command_Option_J(e)


# when window is closed
window.on 'close', ->
  console.log "Window Closed"

