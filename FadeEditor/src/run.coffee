canvas = core.canvas
ctx = core.ctx

nodeColors = {
   smooth: "rgb(0,255,0)",
   sharp: "rgb(255,0,0)",
   flat: "rgb(255,255,0)",
   symmetric: "rgb(255,0,255)"
}

run = ->
   # TODO:
   # - play marker and playback (simulation)
   # - minimap
   # - compile to ihex or bin
   # - compiler has knowledge of memory limit
   # - numeric input
   # - save and load
   # - node drag preview
   # - sub-patterns and looping
   
   compiler = new Compiler

   core.input.bind core.key.LEFT_ARROW, 'pan-left'
   core.input.bind core.key.RIGHT_ARROW, 'pan-right'
   core.input.bind core.key.UP_ARROW, 'pan-up'
   core.input.bind core.key.DOWN_ARROW, 'pan-down'
   core.input.bind core.button.RIGHT, 'right-mouse'
   core.input.bind core.button.LEFT, 'left-mouse'
   core.input.bind core.key.K, 'keyframe'
   core.input.bind core.key.SHIFT, 'push'
   core.input.bind core.key.CTRL, 'precision'
   core.input.bind core.key.COMMAND, 'precision'
   core.input.bind core.key.X, 'snapX'
   core.input.bind core.key.DELETE, 'delete'
   core.input.bind core.key.BACKSPACE, 'delete'

   app = new App( )
   app.run( )
   
   window.onblur = -> app.stop( )
   window.onfocus = -> app.run( )
   
   size = ->
      app.width = $('.canvasContainer').width( ) - $('.curveTitles').width( )
      canvas.width = app.width
      app.invalidate( )
   
   $(window).resize size
   size( )
   
   
   makeTitles = ->
      titles = ''
      
      colors = ['#0000ff', '#00ff00', '#ff0000', '#00ffff', '#ff00ff', '#ffff00']
      
      for i in [0...6]
         
         $('#led' + i).css 'background-color', colors[i]
         $("#led" + i).data { color: colors[i] }
         
         titles += "
            <div class=\"curveTitle flexbox\" id=\"curve#{i}\">
               <div style=\"text-align:center\">
                  #{i}
                  <div class=\"button-icon\" style=\"margin-top:10px\">
                     <div class=\"colorbox\" id=\"colorbox#{i}\" style=\"background-color:#{colors[i]}\"></div>
                  </div>
                  <div class=\"button-icon\" style=\"margin-top:10px\" id=\"settings-button#{i}\">
                     <i class=\"icon-cog icon-white\"></i>
                  </div>
                  <div class=\"button-icon\" style=\"margin-top:10px\" id=\"repeat-button#{i}\">
                     <i class=\"icon-repeat icon-white\" id=\"repeat-icon#{i}\"></i>
                  </div>
               </div>
            </div>"
      return titles
   
   $('#precision-button').mouseover ->
      $('#status-bar').text 'Toggle "Click to Place" Mode'
   $('#precision-button').mouseout ->
      $('#status-bar').text ''

   $('#push-button').mouseover ->
      $('#status-bar').text 'Toggle "Shift Channel" Mode'
   $('#push-button').mouseout ->
      $('#status-bar').text ''

   $('#pushall-button').mouseover ->
      $('#status-bar').text 'Toggle "Shift All Channels" Mode'
   $('#pushall-button').mouseout ->
      $('#status-bar').text ''

   $('#settings-button').mouseover ->
      $('#status-bar').text 'Editor Settings'
   $('#settings-button').mouseout ->
      $('#status-bar').text ''

   $('#compile-button').mouseover ->
      $('#status-bar').text 'Compilation Stuff'
   $('#compile-button').mouseout ->
      $('#status-bar').text ''

   precisionDisable = ->
      button = $('#precision-button')
      icon = button.find('img')
      icon.attr 'src', './media/crosshair_white.png'
      button.removeClass "button-selected"
   precisionEnable = ->
      button = $('#precision-button')
      icon = button.find('img')
      icon.attr 'src', './media/crosshair.png'
      button.addClass "button-selected"

   shiftChannelDisable = ->
      button = $('#push-button')
      icon = button.find('img')
      icon.attr 'src', './media/resize_white.png'
      button.removeClass "button-selected"
   shiftChannelEnable = ->
      button = $('#push-button')
      icon = button.find('img')
      icon.attr 'src', './media/resize.png'
      button.addClass "button-selected"

   shiftAllDisable = ->
      button = $('#pushall-button')
      icon = button.find('img')
      icon.attr 'src', './media/double-resize_white.png'
      button.removeClass "button-selected"
   shiftAllEnable = ->
      button = $('#pushall-button')
      icon = button.find('img')
      icon.attr 'src', './media/double-resize.png'
      button.addClass "button-selected"

   disableAll = ->
      shiftAllDisable()
      shiftChannelDisable()
      precisionDisable()

   app.toolChangeHandler = (tool) ->
      switch tool
         when 'pointer'
            disableAll()

         when 'placement'
            disableAll()
            precisionEnable()

         when 'shift'
            disableAll()
            shiftChannelEnable()

         when 'shiftAll'
            disableAll()
            shiftAllEnable()

   $('#precision-button').click ->
      icon = $(this).find('img')
      isActive = (icon.attr 'src') is './media/crosshair.png'

      disableAll()
      if isActive
         app.changeTool 'pointer'
      else
         precisionEnable()
         app.changeTool 'placement'
      
      app.invalidate( )
      return true

   $('#push-button').click ->
      icon = $(this).find('img')
      isActive = (icon.attr 'src') is './media/resize.png'

      disableAll()
      if isActive
         app.changeTool 'pointer'
      else
         shiftChannelEnable()
         app.changeTool 'shift'

      app.invalidate( )
      return true

   $('#pushall-button').click ->
      icon = $(this).find('img')
      isActive = (icon.attr 'src') is './media/double-resize.png'

      disableAll()
      if isActive
         app.changeTool 'pointer'
      else
         shiftAllEnable()
         app.changeTool 'shiftAll'

      app.invalidate( )
      return true

   $('.curveTitles').html makeTitles( )
   
   $('#colorchooser').modal {backdrop: false, show:false}
   $('#colorchooser').modal "hide"
   
   $('#channel-settings').modal {backdrop: false, show:false}
   $('#channel-settings').modal "hide"
   
   $('#settings').modal {backdrop: false, show:false}
   $('#settings').modal "hide"
   
   $('#lights').modal {backdrop: false, show:false}
   $('#lights').modal "hide"
   
   $('#how-to').modal {backdrop: false, show:false}
   $('#how-to').modal "hide"
   
   $('#setting-time-per-bar').change ->
      app.setTimeScale parseFloat $(this).val( )
      app.invalidate( )
      return true
   
   $('#setting-snap').click ->
      enabled = ($(this).prop 'checked')
      app.timeSnapEnabled = enabled
      return true
      
   $('#setting-vpan').click ->
      enabled = ($(this).prop 'checked')
      app.verticalPanEnabled = enabled
      return true
   
   activeColorBox = null
   activeSettingsChannel = null
   
   $('#farbtastic').farbtastic (color) ->
      if activeColorBox
         activeColorBox.css 'background-color', color
         $("#led" + activeColorBox.data( ).index).css 'background-color', color
         $("#led" + activeColorBox.data( ).index).data { color: color }
      app.updateColors( )
   
   $('#channel-enabled').click ->
      app.setEnabled activeSettingsChannel, ($(this).prop 'checked')
      app.invalidate( )
      return true
      
   $('#channel-deviation').change ->
      if $(this).val( ) == 'auto'
         app.setAutoDeviation activeSettingsChannel
      else
         app.setDeviation activeSettingsChannel, (parseFloat $(this).val( ))
      app.invalidate( )
      return true
   
   $('#channel-lock-endpoints').click ->
      app.setEndpointLock activeSettingsChannel, ($(this).prop 'checked')
      app.curves[activeSettingsChannel].firstNode.consolidateEndpoints( )
      return true
      
   for i in [0...6]
      repeatButton = $('#repeat-button' + i)
      repeatButton.data { index: i }
      
      repeatButton.mouseover -> $('#status-bar').text 'Toggle Channel ' + $(this).data( ).index + ' Repeat'
      repeatButton.mouseout -> $('#status-bar').text ''

      repeatButton.click ->
         index = $(this).data( ).index
         icon = $('#repeat-icon' + index)
         icon.toggleClass "icon-white"
         $(this).toggleClass "button-selected"
         app.toggleChannelRepeat index
         app.invalidate( )
         return true

      settingsButton = $('#settings-button' + i)
      settingsButton.data { index: i }

      settingsButton.mouseover -> $('#status-bar').text 'Channel ' + $(this).data( ).index + ' Settings'
      settingsButton.mouseout -> $('#status-bar').text ''

      settingsButton.click ->
         activeSettingsChannel = $(this).data( ).index
         $('#channel-settings').modal "show"
         return true
      
      
      colorbox = $('#colorbox' + i)
      colorbox.data { index: i }

      colorbox.mouseover -> $('#status-bar').text 'Change Channel ' + $(this).data( ).index + ' Color'
      colorbox.mouseout -> $('#status-bar').text ''

      colorbox.click ->
         activeColorBox = $(this)
         $.farbtastic('#farbtastic').setColor (new RGBColor(activeColorBox.css 'background-color').toHex( ))
         $('#colorchooser').modal "show"
         return true
      
   app.updateColors( )
   
   # clicking on the context menu items
   $('#item-smooth-node').click ->
      data = $('.context-menu').data( )

      if data.node
         if data.node.style is 'flat'
            data.node.reset( )
         data.node.style = 'smooth'
         data.node.smooth( )
         data.node.consolidateEndpoints( )

      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true
      
   $('#item-sharp-node').click ->
      data = $('.context-menu').data( )
   
      if data.node
         if data.node.style is 'flat'
            data.node.reset( )
         data.node.style = 'sharp' 
         data.node.consolidateEndpoints( )
   
      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true
   
   $('#item-flat-node').click ->
      data = $('.context-menu').data( )
   
      if data.node
         data.node.style = 'flat'
         data.node.flatten( )
         data.node.consolidateEndpoints( )
   
      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true
   

   $('#item-symmetric-node').click ->
      data = $('.context-menu').data( )

      if data.node
         if data.node.style is 'flat'
            data.node.reset( )
         data.node.style = 'symmetric'
         data.node.smooth( )
         data.node.consolidateEndpoints( )

      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true
   
   $('#item-remove-node').click ->
      data = $('.context-menu').data( )
      data.node.remove( ) if data.node
      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true

   $('#item-reset-node').click ->
      data = $('.context-menu').data( )
      data.node.reset( ) if data.node
      $('.context-menu').fadeOut 'fast'
      app.invalidate( )
      return true

   # dialogs
   $('.dialogModal').draggable( )
   
   # menu items
   $('#do-compile-button').click ->
      $('#compile-output').val compiler.compile app.curves
      return true