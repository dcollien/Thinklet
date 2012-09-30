ChildProcess = require('child_process')

# Wraps a precompiled platform specific micronucleus upload tool, uploading a hex file
class Micronucleus extends require('events').EventEmitter
  constructor: (upload_filename)->
    @status = 'setup'
    @process = ChildProcess.spawn('micronucleus', [upload_filename])
    @process.stdout.setEncoding 'ascii'
    @input_buffer = ''
    @process.stdout.on 'data', (string)=>
      @input_buffer += string
      while @input_buffer.indexOf("\n") >= 0
        [message, remainder...] = @input_buffer.split("\n", 2)
        @input_buffer = remainder.join("\n")
        @parse_message(message)
  
  # process message sent from micronucleus program
  parse_message: (message)->
    @status =
      if message.match /Please plug the device/i
        @progress = 0.0
        'waiting'
      else if message.match /Device is found/
        @progress = 0.1
        'connecting'
      else if message.match /Erasing/
        @progress = 0.33
        'erasing'
      else if message.match /Starting to upload/
        @progress = 0.66
        'uploading'
      else if message.match /Starting the user app/
        @progress = 0.9
        'executing'
      else if message.match /Micronucleus done\./
        @progress = 1.0
        'finished'
    @emit 'progress', @progress, @status, this
    @emit @status if @status?
  
  abort: ->
    @process.kill 'SIGINT'
    @status = 'finished'
    @progress = 1.0
    
