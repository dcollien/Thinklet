# TODO: multi pattern
class App extends core.App
	constructor: ->
		super( )
		
		@scrollBox = $('.centerbox')
		@gridSize = 8
		@barLength = 256
		
		@curveHeight = 256
		@curveSpacing = 32
		
		numCurves = 6
		
		@width = 800
		@height = @curveSpacing + numCurves*(@curveSpacing + @curveHeight)
		
		canvas.height = @height
		
		canvas.width = @width
			
		@pan = v 0, 0
		@panSpeed = 3.0
		@zoom = 1.0
		
		
		@curves = []
		
		@maxPanX = 64
		
		
		for i in [0...numCurves]
			@curves.push new Curve( @curveSpacing + i*(@curveSpacing + @curveHeight) )
			
		@dragNode = null
		@dragControl = null
		
		@pushDrag = null
		@pushStart = null
		@pushMode = false
		
		@disectionNode = new DisectionNode( )
	
	updateColors: ->
		for i in [0...(@curves.length)]
			curve = @curves[i]
			curve.color = $('#colorbox' + i).css 'background-color'
		@invalidate( )
		
	updateDragging: (dt) ->
		# handle the dragging parts of the update
		
		if @pushDrag
			mouse = v.sub core.canvasMouse( ), @pan
			diff = v.sub mouse, @pushDrag
			@pushDrag = mouse
			for curve in @curves
				if core.input.down 'precision'
					curve.stretch mouse.x, diff.x
				else if mouse.y > curve.topOffset and mouse.y < curve.topOffset + curve.height
					curve.stretch mouse.x, diff.x
					break
			
			@invalidate( )
		else if @dragPan
			mouse = core.canvasMouse( )
			
			diff = v.sub mouse, @dragPan
			@pan = v.add diff, @pan
			
			
			globalY = core.screenMouse( ).y
			@scrollBox.scrollTop (@scrollBox.scrollTop( ) - (globalY - @scrollStart))
			@scrollStart = globalY
			
			# constrain y pan
			@pan.y = 0
			
			if @pan.x > @maxPanX
				@pan.x = @maxPanX
			
			
			@dragPan = v mouse
			
			@invalidate( )
			
		else if @dragNode
			mouse = v.sub core.canvasMouse( ), @pan
			
			@disectionNode.coord = null
			@dragNode.moveTo mouse
				
			@invalidate( )
		
		else if @dragControl
			mouse = v.sub core.canvasMouse( ), @pan
			
			
			@disectionNode.coord = null
			@dragControl.moveTo mouse
			
			if @dragControl.parentNode.style == 'smooth' or @dragControl.parentNode.style == 'symmetric'
				# constrain the smoothness of this node
				@dragControl.smooth( )
			
			@invalidate( )

	resetDrag: ->
		@dragNode.isSelected = false if @dragNode
		@dragControl.isSelected = false if @dragControl
		
		@dragNode = null
		@dragControl = null
		@dragPan = null
		@pushDrag = null
		@pushStart = null
		@scrollStart = null

	createNode: ->
		return if not @disectionNode.coord
		
		coord = v @disectionNode.coord
		for curve in @curves
			if coord.y > curve.topOffset and coord.y < curve.topOffset + curve.height
				@dragNode = curve.disectAt coord
				break
		

	update:( dt ) ->
		
		mouse = v.sub core.canvasMouse( ), @pan
			
		if core.input.pressed 'push'
			$canvas = $(canvas)
			$canvas.css 'cursor', 'ew-resize'
			@pushMode = true
		else if core.input.released 'push'
			$(canvas).css 'cursor', 'auto'
			@pushMode = false
		if not core.input.down 'push'
			@prevPushCursor = null
			
		if core.input.pressed 'precision'
			$canvas = $(canvas)
			$canvas.css 'cursor', 'crosshair'
		else if core.input.released 'precision'
			$(canvas).css 'cursor', 'auto'
		
		for curve in @curves
			if mouse.y > curve.topOffset and mouse.y < curve.topOffset + curve.height
				@disectionNode.move mouse.x, curve.firstNode
				@invalidate( ) if @lastMouse and @disectionNode.coord and not v.eq mouse, @lastMouse
		
		if core.input.down 'keyframe'
			@showKeyframes = true
			@invalidate( )
		
		if core.input.released 'keyframe'
			@showKeyframes = false
			@invalidate( )
		
		# keys do panning	at the moment
		if core.input.down 'pan-right'
			@pan.x -= @panSpeed
				
			@invalidate( )	
		else if core.input.down 'pan-left'
			@pan.x += @panSpeed
			
			if @pan.x > @maxPanX
				@pan.x = @maxPanX
				
			@invalidate( )
		
		
		if core.input.down 'pan-down'
			@scrollBox.scrollTop (@scrollBox.scrollTop( ) + @panSpeed)
			#@pan.y -= @panSpeed
			#@invalidate( )	
		else if core.input.down 'pan-up'
			@scrollBox.scrollTop (@scrollBox.scrollTop( ) - @panSpeed)
			#@pan.y += @panSpeed
			#@invalidate( )
		
			
		# register the different start-drags
		if core.input.pressed 'left-mouse'
			$('.context-menu').fadeOut( 'fast' )
			
			@resetDrag( )
			
			if core.input.down 'push'
				@pushDrag = mouse
				@pushStart = mouse
			else if core.input.down 'precision'
				@createNode( )
			else
				for curve in @curves
					@dragNode = curve.nodeAtMouse @pan
					if @dragNode
						@dragNode.isSelected = true
						break
				
					@dragControl = curve.controlAtMouse @pan
					if @dragControl
						@dragControl.isSelected = true
						break
							
				if not @dragNode and not @dragControl
					if @disectionNode.isUnderMouse @pan
						@createNode( )
					else
						@dragPan = v core.canvasMouse( )
						@scrollStart = core.screenMouse( ).y
				
		# stop dragging	
		if core.input.released 'left-mouse'
			@resetDrag( )
		
		# right click
		if core.input.pressed 'right-mouse'
			for curve in @curves
				node = curve.nodeAtMouse @pan
				break if node
				
			if node
				# pop up a context menu on the selected node
				
				menuPos = v.add (core.toGlobal node), @pan
				menu = $('.context-menu')
				
				# make the menu's data reference the clicked node
				# to let menu selection affect this node
				menu.data { node: node }
				
				menu.fadeIn 'fast'
				menu.offset { top: menuPos.y, left: menuPos.x }
			
		@updateDragging dt
		@lastMouse = mouse
			
	drawGrid: ->
		gridSize = @gridSize
		ctx.lineWidth = 1
		ctx.strokeStyle = "rgb(50,50,50)"
		
		minRow = -1
		maxRow = 1 + Math.floor(@height/gridSize)
		
		minCol = -1
		maxCol = 1 + Math.floor(@width/gridSize)
		
		# repeat an infinite grid shifting by the @pan % gridSize
		
		for row in [minRow..maxRow]
			minX = (minCol * gridSize) + @pan.x % gridSize
			maxX = (maxCol * gridSize) + @pan.x % gridSize
			y = row * gridSize + @pan.y % gridSize
			
			ctx.beginPath( )
			ctx.moveTo minX, y
			ctx.lineTo maxX, y
			ctx.stroke( )
			
		for col in [minCol..maxCol]
			minY = (minRow * gridSize) + @pan.y % gridSize
			maxY = (maxRow * gridSize) + @pan.y % gridSize
			x = col * gridSize + @pan.x % gridSize
			
			ctx.beginPath( )
			ctx.moveTo x, minY
			ctx.lineTo x, maxY
			ctx.stroke( )
		
	drawBackground: ->
		ctx.fillStyle = "rgb(30,30,30)"
		ctx.fillRect 0, 0, @width, @height

	draw: ->
		super( )
		@drawBackground( )
		
		# automatic infinite panning grid
		@drawGrid( )
		
		# draw curve upper and lower bounds
		ctx.save( )
		ctx.translate 0, @pan.y
		
		ctx.strokeStyle = "rgb(192,192,192)"
		currY = 0
		for curve in @curves
			
			ctx.fillStyle = "rgb(0,0,0)"
			ctx.fillRect 0, curve.topOffset - @curveSpacing, @width, @curveSpacing
			
			ctx.beginPath( )
			ctx.moveTo 0, curve.topOffset
			ctx.lineTo @width, curve.topOffset
			ctx.stroke( )
			
			ctx.beginPath( )
			ctx.moveTo 0, curve.topOffset + curve.height
			ctx.lineTo @width, curve.topOffset + curve.height
			ctx.stroke( )
			
		ctx.restore( )
		
		# draw bar lines
		ctx.save( )
		ctx.translate @pan.x, 0
		
		for bar in [-4...(4*@width/@barLength)]
			
			if bar % 4 == 0
				ctx.strokeStyle = "rgb(192,192,192)"
			else if bar % 2 == 0
				ctx.strokeStyle = "rgb(128,128,128)"
			else
				ctx.strokeStyle = "rgb(64,64,64)"
				
			ctx.beginPath( )
			ctx.moveTo bar*@barLength/4 - (Math.floor (@pan.x / @barLength)) * @barLength, 0
			ctx.lineTo bar*@barLength/4 - (Math.floor (@pan.x / @barLength)) * @barLength, @height
			ctx.stroke( )
				
		ctx.restore( )
		
		
		if @pushMode
			point = core.canvasMouse( )
			# draw stretch bar

			ctx.strokeStyle = "rgb(224,224,224)"
			ctx.fillStyle = "rgba(224,224,224,0.06)"
			
			if @pushStart
				ctx.beginPath( )
				ctx.fillRect @width, 0, point.x - @width, @height
			
			ctx.beginPath( )
			ctx.moveTo point.x, 0
			ctx.lineTo point.x, @height
			ctx.stroke( )
			
		
		ctx.save( )
		ctx.translate @pan.x, @pan.y
		
	 	# draw curves
		for curve in @curves
			curve.drawSegments( )
		
		# draw disection node
		@disectionNode.draw( )
		
		# draw flattened lines
		if @showKeyframes
			for curve in @curves
				ctx.lineWidth = 2
				ctx.strokeStyle = "rgb(196,196,196)"
				ctx.beginPath( )
				ctx.moveTo curve.firstNode.x, curve.firstNode.y
				
				flattenedNodes = (curve.outputNodes flattenBy, 255*8, 8)
				
				for node in flattenedNodes
					ctx.lineTo node.x, (node.y + curve.topOffset)
					
				ctx.stroke( )
				
				for node in flattenedNodes
					ctx.fillStyle = "rgb(255,255,255)"
					ctx.strokeStyle = "rgb(0,0,0)"
					ctx.lineWidth = 1
					ctx.beginPath( )
					ctx.arc node.x, (node.y + curve.topOffset), 3, 0, TAU
					ctx.fill( )
					ctx.stroke( )
					
					
		# draw curve nodes
		for curve in @curves
			if not @showKeyframes
				curve.drawControlLines( )
			curve.drawNodes( )
				
		ctx.restore( )