ChildProcess = require('child_process')

# Wraps a precompiled platform specific micronucleus upload tool, uploading a hex file
class Micronucleus extends require('events').EventEmitter
  # type must be "intel-hex" or "raw"
  constructor: (data, format = 'intel-hex')->
    @state = {}
    @process = ChildProcess.spawn('micronucleus', ['--dump-progress', '--type', format, '-'])
    
    # send process data to upload
    @process.stdin.end data
    
    # read in progress info
    @process.stdout.setEncoding 'ascii'
    @input_buffer = ''
    @history_buffer = ''
    @process.stdout.on 'data', (string)=>
      @input_buffer += string
      @history_buffer += string
      while @input_buffer.indexOf("\n") >= 0
        [message, remainder...] = @input_buffer.split("\n", 2)
        @input_buffer = remainder.join("\n")
        @parse_message(message)
    
    @process.on 'exit', (code, signal)=>
      @emit 'success', @history_buffer if code == 0
      @emit 'failure', @history_buffer if code != 0
      @emit 'finished'
  
  # process message sent from micronucleus program
  parse_message: (message)->
    if message.match /^{status/
      old_state = @state
      @state = JSON.parse message
      # emit status change event when a new status appears
      @emit state.status, @state if old_state.status isnt @state.status
      # emit overall progress as a floating point number between 0.0 and 1.0
      @emit 'progress', ((@state.step - 1) / @state.steps) + @state.progress / @state.steps
      # emit generic 'update' event
      @emit 'update', @state
    else
      @emit 'notice', message # emit any regular text output of the utility program - might contain errors
  
  abort: ->
    @process.kill 'SIGINT'
    @status = 'finished'
    @progress = 1.0
    
