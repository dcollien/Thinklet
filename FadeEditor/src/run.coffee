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
	core.input.bind core.key.X, 'snapX'

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
	
	$('.curveTitles').html makeTitles( )
	
	$('#colorchooser').modal {backdrop: false, show:false}
	$('#colorchooser').modal "hide"
	
	$('#channel-settings').modal {backdrop: false, show:false}
	$('#channel-settings').modal "hide"
	
	$('#settings').modal {backdrop: false, show:false}
	$('#settings').modal "hide"
	
	$('#lights').modal {backdrop: false, show:false}
	$('#lights').modal "hide"
	
	$('#setting-time-per-bar').change ->
		app.timeMultiplier = parseFloat $(this).val( )
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
		settingsButton.click ->
			activeSettingsChannel = $(this).data( ).index
			$('#channel-settings').modal "show"
			return true
		
		
		colorbox = $('#colorbox' + i)
		colorbox.data { index: i }
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
	$('#compile-button').click ->
		$('#compile-output').val compiler.compile app.curves
		return true