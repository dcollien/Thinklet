canvas = core.canvas
ctx = core.ctx

flattenBy = 4

nodeColors = {
	smooth: "rgb(0,255,0)",
	sharp: "rgb(255,0,0)",
	flat: "rgb(255,255,0)",
	symmetric: "rgb(255,0,255)"
}

run = ->
	# TODO:
	# - timing text
	# - curves with selectable colour
	# - play marker and playback (simulation)
	# - minimap
	# - option to correct for gamma (on chip side)
	# - option to control compile accuracy
	# - compile to ihex or bin
	# - compiler has knowledge of memory limit
	# - easier disection node selection on near-vertical lines (y selection as well as x)
	# - make length limit at 65535
	# - looping and halting patterns
	# - snap to grid
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
			titles += "
				<div class=\"curveTitle flexbox\" id=\"curve#{i}\">
					<div style=\"text-align:center\">
						#{i}
						<div class=\"color-select\">
							<div class=\"colorbox\" id=\"colorbox#{i}\" style=\"background-color:#{colors[i]}\"></div>
						</div>
					</div>
				</div>"
		return titles
	
	$('.curveTitles').html makeTitles( )
	
	$('#colorchooser').modal {backdrop: false, show:false}
	$('#colorchooser').modal "hide"
	
	activeColorBox = null
	
	$('#farbtastic').farbtastic (color) ->
		console.log $(this).data( )
		if activeColorBox
			activeColorBox.css 'background-color', color
		app.updateColors( )
	
	for i in [0...6]
		colorbox = $('#colorbox' + i)
		colorbox.click ->
			console.log colorbox
			activeColorBox = $(this)
			$.farbtastic('#farbtastic').setColor (new RGBColor(activeColorBox.css 'background-color').toHex( ))
			$('#colorchooser').modal "show"
		
	app.updateColors( )
	
	# clicking on the context menu items
	$('#item-smooth-node').click ->
		data = $('.context-menu').data( )

		if data.node
			data.node.style = 'smooth' 
			data.node.smooth( )

		$('.context-menu').fadeOut 'fast'
		app.invalidate( )
		
	$('#item-sharp-node').click ->
		data = $('.context-menu').data( )
	
		if data.node
			if data.node.style is 'flat'
				data.node.reset( )
			data.node.style = 'sharp' 
	
		$('.context-menu').fadeOut 'fast'
		app.invalidate( )
	
	$('#item-flat-node').click ->
		data = $('.context-menu').data( )
	
		if data.node
			data.node.style = 'flat'
			data.node.flatten( )
	
		$('.context-menu').fadeOut 'fast'
		app.invalidate( )
	

	$('#item-symmetric-node').click ->
		data = $('.context-menu').data( )

		if data.node
			data.node.style = 'symmetric'
			data.node.smooth( )

		$('.context-menu').fadeOut 'fast'
		app.invalidate( )
	
	$('#item-remove-node').click ->
		data = $('.context-menu').data( )
		data.node.remove( ) if data.node
		$('.context-menu').fadeOut 'fast'
		app.invalidate( )

	$('#item-reset-node').click ->
		data = $('.context-menu').data( )
		data.node.reset( ) if data.node
		$('.context-menu').fadeOut 'fast'
		app.invalidate( )


	# menu items
	$('#compile-button').click ->
		$('#compile-output').val compiler.compile app.curves