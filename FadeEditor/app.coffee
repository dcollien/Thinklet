canvas = core.canvas
ctx = core.ctx

flattenBy = 4

nodeColors = {
	smooth: "rgb(0,255,0)",
	sharp: "rgb(255,0,0)",
	flat: "rgb(255,255,0)",
	symmetric: "rgb(255,0,255)"
}


# TODO:
# - forward pushing
# - multiple curves
# - break into files by class
# - new class to handle compilation (machine code/ihex) and calc duty cycle here
# - timing text
# - curves with selectable colour
# - play marker and playback (simulation)
# - minimap
# - option to correct for gamma
# - option to control compile accuracy
# - compiler has knowledge of memory limit
# - sub-patterns and looping
# - easier disection node selection on near-vertical lines (y selection as well as x)


class DisectionNode
	constructor: ->
		@radius = 2
		@clickRadius = 8
		@coord = null
		@bezierParameter
	draw: ->
		if @coord
			coord = @coord
			offset = @radius
			ctx.fillStyle = "rgba(255,255,255, 0.5)"
			ctx.strokeStyle = "rgb(0,0,0)"
			ctx.beginPath( )
			ctx.arc coord.x, coord.y, @radius, 0, TAU
			ctx.fill( )
			
	move: (x, firstNode) ->
		currNode = firstNode
		@coord = null
		while currNode != null and currNode.next != null
			if x > currNode.x and x < currNode.next.x
				@bezierParameter = cubicBezierAtX x, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next
				@coord = cubicBezier @bezierParameter, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next
				break
			currNode = currNode.next
	isUnderMouse: (pan) ->
		mouse = v.sub core.canvasMouse( ), pan
		return false if not @coord
		return (v.sub mouse, @coord).len( ) < @clickRadius

class ControlNode
	constructor: (coord, @parentNode, @type) ->
		@moveTo coord
		@isSelected = false
		
	oppositeType: ->
		if @type == 'left'
			return 'right'
		else
			return 'left'
	
	constrain: (coord) ->
		# constrain control points to the left or right of the node
		# and between prev and next nodes
		if @type == 'left'
			coord.x = @parentNode.x if coord.x > @parentNode.x
			coord.x = @parentNode.prev.x if @parentNode.prev and coord.x < @parentNode.prev.x
		else
			coord.x = @parentNode.x if coord.x < @parentNode.x
			coord.x = @parentNode.next.x if @parentNode.next and coord.x > @parentNode.next.x
		
		# constrain control points to stay within the vertical bounds
		if coord.y < @parentNode.curve.topOffset
			coord.y = @parentNode.curve.topOffset
		else if coord.y > @parentNode.curve.topOffset + @parentNode.curve.height
			coord.y = @parentNode.curve.topOffset + @parentNode.curve.height
		
		return coord
		
	smooth: ->
		coord = v @
		
		# fetch the opposite control node
		otherNode = @parentNode.getControlNode @oppositeType( )
		if otherNode and (v.sub @parentNode, @).len( ) > 0			
			# doing stuff to the other control node:
			
			# the angle of this control node to the parent
			# (i.e. the direction the opposite control point should face)
			newParentAngle = (v.sub @parentNode, coord).angle( )
			
			# the distance of the opposite node from the parent
			if @parentNode.style == 'symmetric'
				distance = (v.sub @parentNode, @).len( )
			else
				distance = (v.sub @parentNode, otherNode).len( )
			
			# make a new vector of the desired angle
			# and lengthen it to the original distance
			newUnitVect = v.forAngle newParentAngle
			newVectFromParent = v.mul newUnitVect, distance
			
			# translate back to original coordinate system
			newVect = v.add @parentNode, newVectFromParent
			
			# move the opposite control point to its new location
			otherNode.moveTo newVect
			
	moveTo: (coord) ->
		coord = @constrain coord
		
		@x = coord.x
		@y = coord.y

class CurveNode
	constructor: (@curve, coord, leftCP, rightCP) ->
		@moveTo coord
		@isSelected = false
		
		@controlLeft = new ControlNode( leftCP, @, 'left' ) if leftCP
		@controlRight = new ControlNode( rightCP, @, 'right' ) if rightCP
		
		# smooth points are the default
		@style = 'smooth'
		
		@next = null
		@prev = null
	
	canRemove: ->
		# not allowed to remove the end points
		(@prev != null and @next != null)
		
	remove: ->
		return if not @canRemove
		
		t = approxBezierDisectionParameter @controlLeft, @, @controlRight
		newControlPositions = invertedCubicDeCasteljau t, @prev, @prev.controlRight, @next.controlLeft, @next
		
		if @prev.controlRight
			@prev.controlRight.moveTo newControlPositions[0]
		
		if @next.controlLeft
			@next.controlLeft.moveTo newControlPositions[1]
		
		@next.prev = @prev
		@prev.next = @next
		
		# goodbye!
		
	getControlNode: (type) ->
		if type == 'left'
			return @controlLeft
		if type == 'right'
			return @controlRight
	
	flatten: ->
		if @controlLeft
			@controlLeft.x = @x 
			@controlLeft.y = @y
			
		if @controlRight
			@controlRight.x = @x 
			@controlRight.y = @y
	
	reset: ->
		@controlLeft.moveTo (v @x-32, @y)
		@controlRight.moveTo (v @x+32, @y)
			
		if @style == 'smooth' or @style == 'symmetric'
			@smooth( )
		else if @style != 'flat'
			@flatten( )
		
	smooth: ->
		
		if @controlLeft and v.eq @controlLeft, @
			@reset( )
		
		if @controlRight and v.eq @controlRight, @
			@reset( )
			
		if @controlLeft and @controlRight
			# vectors from this parent node to the control points
			leftOffset  = (v.sub @, @controlLeft)
			rightOffset = (v.sub @, @controlRight)

			# unit vectors of the above
			leftUnit  = v.unit leftOffset
			rightUnit = v.unit rightOffset
	
			# the vectors joining the control points in either direction, normalised
			leftVect  = v.unit (v.sub rightUnit, leftUnit)
			rightVect = v.unit (v.sub leftUnit, rightUnit)
	
			if @style == 'symmetric'
				distance = (leftOffset.len( ) + rightOffset.len( )) / 2
				# the above vectors sized to the average length
				leftVect  = v.mul leftVect, distance
				rightVect = v.mul rightVect, distance
			else
				# the above vectors sized to their original lengths
				leftVect  = v.mul leftVect, leftOffset.len( )
				rightVect = v.mul rightVect, rightOffset.len( )
			
	
			# back to the original coordinate system
			leftVect  = (v.add @, leftVect)
			rightVect = (v.add @, rightVect)

			# move the control points to their new positions
			@controlLeft.moveTo leftVect
			@controlRight.moveTo rightVect
		
		
	moveTo: (coord) ->
		
		# how much it moved by this update
		nodeMove = v.sub coord, @
		
		constrained = false
		
		if this is @curve.firstNode
			coord.x = 0
		
		# constrain movement to not let
		# control points past next or prev nodes
		if @controlRight
			newControlX = (@controlRight.x + nodeMove.x)
			if @next and newControlX > @next.x
				coord.x = @next.x - (newControlX - coord.x)
				constrained = true
			
			###	
			newControlY = (@controlRight.y + nodeMove.y)
			if newControlY < @curve.topOffset
				coord.y = @curve.topOffset - (newControlY - coord.y)
			###
			
		if @controlLeft
			newControlX = (@controlLeft.x + nodeMove.x)
			if @prev and newControlX < @prev.x
				coord.x = @prev.x - (newControlX - coord.x) 
				constrained = true
			
			###	
			newControlY = (@controlLeft.y + nodeMove.y)
			if newControlY < @curve.topOffset
				coord.y = @curve.topOffset - (newControlY - coord.y)
			###
			
		
		
		# a node isn't allowed past its neighbouring control points
		if @next and coord.x > @next.controlLeft.x
			coord.x = @next.controlLeft.x
			constrained = true
		if @prev and coord.x < @prev.controlRight.x
			coord.x = @prev.controlRight.x
			constrained = true
			
			
		# constrain within vertical bounds
		if coord.y < @curve.topOffset
			coord.y = @curve.topOffset
			constrained = true
		else if coord.y > @curve.topOffset + @curve.height
			coord.y = @curve.topOffset + @curve.height
			constrained = true
				
		# update movement vector with constrained values
		nodeMove = v.sub coord, @
		
		@x = coord.x
		@y = coord.y
		
		# move control points with the moving of the curve
		if @controlLeft
			@controlLeft.moveTo (v.add @controlLeft, nodeMove)
		if @controlRight
			@controlRight.moveTo (v.add @controlRight, nodeMove)
		
		
		if (@style == 'smooth' or @style == 'symmetric') and @controlLeft and @controlRight
			if constrained
				@smooth( )
			if @controlLeft.y <= @curve.topOffset or @controlLeft.y >= @curve.topOffset + @curve.height
				@smooth( )
			else if @controlRight.y <= @curve.topOffset or @controlRight.y >= @curve.topOffset + @curve.height
				@smooth( )
			

class Curve
	constructor: (@topOffset) ->
		@height = 256
		
		@color = "rgb(0,0,255)"
		
		# linked nodes
		@firstNode = null
		@lastNode = null
		
		# debug
		@addNode (v 0, @height/2+@topOffset), null, (v 128, @height/2+@topOffset)
		@addNode (v @height*3, @height/2+@topOffset), (v @height*3-128, @height/2+@topOffset), null
		
		@debug = false
	
	outputLines: (threshold, steps) ->
		lines = @flatten threshold, steps
		output = []
		for line in lines
			output.push [(v line[0].x, (line[0].y - @topOffset)), (v line[1].x, (line[1].y - @topOffset))]
		return output
	
	flatten: (threshold, steps) ->
		lines = []
		
		currNode = @firstNode
		while currNode != null and currNode.next != null
			
			start = currNode
			end = currNode.next
			
			newLines = @flattenBezier start, start.controlRight, end.controlLeft, end, threshold, steps
			lines = lines.concat newLines
			
			currNode = currNode.next
		return lines
			
	# TODO: make this operate over entire curve to eliminate nodes as required points
	# (although it might be nice to guarantee hitting the nodes?)
	flattenBezier: (p0, p1, p2, p3, threshold, steps) ->
		# x length?
		threshold = 2 if not threshold
		steps = 128 if not steps

		offPoints = (coords, line) ->
			numPoints = 0
			for coord in coords
				linearErrorX = Math.abs ((lineX coord.y, line) - coord.x)
				linearErrorY = Math.abs ((lineY coord.x, line) - coord.y)
				
				# deviate by either x or y
				linearError = Math.min linearErrorX, linearErrorY
				if linearError >= threshold
					numPoints += 1
			return numPoints
		
		
		lines = []

		stepSize = 1/steps

		lastSegment = [v p0, v p1]
		startCoord = v p0

		coords = []
		t = stepSize
		while t < 1
			currCoord = cubicBezier t, p0, p1, p2, p3
			coords.push currCoord
			
			testLine = [startCoord, currCoord]
			
			# error too large, make a new line segment
			if (offPoints coords, testLine) > threshold
				lastSegment = [startCoord, currCoord]
				lines.push lastSegment

				startCoord = currCoord
				coords = []
			else
				lastSegment = testLine

			t += stepSize

		lastSegment = [startCoord, v p3]
		lines.push lastSegment
		
		return lines


	disectAt: (disectionPoint) ->
		x = disectionPoint.x
		
		currNode = @firstNode
		while currNode != null and currNode.next != null
			if x > currNode.x and x < currNode.next.x
				t = cubicBezierAtX x, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next
				controls = cubicDeCasteljau t, currNode, currNode.controlRight, currNode.next.controlLeft, currNode.next
				
				node = new CurveNode( @, disectionPoint, controls[0], controls[1] )
				currNode.controlRight.moveTo controls[2]
				currNode.next.controlLeft.moveTo controls[3]
				
				
				node.prev = currNode
				node.next = currNode.next
				currNode.next.prev = node
				currNode.next = node
				
				return node
			else
				currNode = currNode.next
		
		return null
		
		
	
	addNode: (pos, leftCP, rightCP) ->
		node = new CurveNode( @, pos, leftCP, rightCP )
		
		if @firstNode == null
			@firstNode = node
			@lastNode = node
		else
			node.prev = @lastNode
			@lastNode.next = node
			@lastNode = node
		
		return node
		
	drawCurveSegment: (start, end) ->
		c1 = start.controlRight
		c2 = end.controlLeft
		ctx.lineWidth = 2
		ctx.strokeStyle = @color
		
		ctx.beginPath( )
		ctx.moveTo start.x, start.y
		ctx.bezierCurveTo c1.x, c1.y, c2.x, c2.y, end.x, end.y
		
		ctx.stroke( )
	
	drawControlLine: (from, to) ->
		ctx.lineWidth = 1
		ctx.strokeStyle = "rgb(127,127,127)"
		
		ctx.beginPath( )
		ctx.moveTo from.x, from.y
		ctx.lineTo to.x, to.y
		
		ctx.stroke( )
		
		offset = 3
		
		if to.isSelected
			ctx.lineWidth = 2
			ctx.strokeStyle = "rgb(196,196,196)"
			ctx.fillStyle = "rgb(195,195,195)"
		else
			ctx.lineWidth = 1
			ctx.strokeStyle = "rgb(63,63,63)"
			ctx.fillStyle = "rgb(195,195,195)"
		
		ctx.beginPath( )
		ctx.moveTo to.x-offset, to.y
		ctx.lineTo to.x, to.y-offset
		ctx.lineTo to.x+offset, to.y
		ctx.lineTo to.x, to.y+offset
		ctx.lineTo to.x-offset, to.y
		ctx.closePath( )
		
		ctx.fill( )
		
		ctx.stroke( )
		
	drawControlPoints: (node) ->
		if node.style != "flat"
			@drawControlLine node, node.controlLeft  if node.controlLeft
			@drawControlLine node, node.controlRight if node.controlRight
	
	drawNode: (node) ->
		x = node.x
		y = node.y
		
		if node.isSelected
			ctx.lineWidth = 2
			ctx.strokeStyle = "rgb(128,128,128)"
			brightness = 1
		else
			ctx.lineWidth = 1
			ctx.strokeStyle = "rgb(63,63,63)"
			brightness = 0.5
		
		if node.style == "sharp" or node.style == "flat"
			offset = 2.7
			ctx.fillStyle = nodeColors[node.style]
			
			ctx.beginPath( )
			ctx.fillRect x-offset, y-offset, offset*2, offset*2
			
			ctx.strokeRect x-offset, y-offset, offset*2, offset*2
		else if node.style == "smooth" or node.style == "symmetric"
			radius = 3
			ctx.fillStyle = nodeColors[node.style]
			
			ctx.beginPath( )
			ctx.arc x, y, radius, 0, TAU
			ctx.closePath( )
			
			ctx.fill( )
			ctx.stroke( )
			
	getNodes: ->
		# get an array of the nodes 
		# from the linked list representation
		nodes = []
		currNode = @firstNode
		while currNode != null
			nodes.push currNode
			currNode = currNode.next
		return nodes
	
	drawSegments: ->
		nodes = @getNodes( )
		
		for i in [0...nodes.length-1]
			@drawCurveSegment nodes[i], nodes[i+1]
	
	drawNodes: ->
		nodes = @getNodes( )
		@drawControlPoints node for node in nodes
		
		@drawNode node for node in nodes
		
		
	controlAtMouse: (pan) ->
		radius = 6
		
		isUnderMouse = (node) ->
			pannedNode = v.add pan, node
			(v.sub core.canvasMouse(), pannedNode).len( ) < radius
		
		nodes = @getNodes( )
		for node in nodes
			if node.controlLeft and (isUnderMouse node.controlLeft)
				return node.controlLeft
			if node.controlRight and (isUnderMouse node.controlRight)
				return node.controlRight
		
		return null
		
	nodeAtMouse: (pan) ->
		radius = 6
		for node in @getNodes( )
			pannedNode = v.add pan, node
			dist = (v.sub core.canvasMouse(), pannedNode).len( )
			return node if dist < radius
		return null

# TODO: multi pattern
class App extends core.App
	constructor: ->
		super( )
		
		
		@gridSize = 8
		@barLength = 256
		
		@curveHeight = 256
		@curveSpacing = 32
		
		numCurves = 6
		
		@width = 800
		@height = @curveSpacing + numCurves*(@curveSpacing + @curveHeight)
		
		canvas.width = @width
		canvas.height = @height
		
		@pan = v 0, 0
		@panSpeed = 3.0
		@zoom = 1.0
		
		
		@curves = []
		
		@maxPanX = 64
		
		
		for i in [0..0] #numCurves
			@curves.push new Curve( @curveSpacing + i*(@curveSpacing + @curveHeight) )
			
		@dragNode = null
		@dragControl = null
		
		@disectionNode = new DisectionNode( )
		
		
	updateDragging: (dt) ->
		# handle the dragging parts of the update
		
		if @dragPan
			mouse = core.canvasMouse( )
			
			diff = v.sub mouse, @dragPan
			@pan = v.add diff, @pan
			
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

	createNode: ->
		return if not @disectionNode.coord
		
		coord = v @disectionNode.coord
		for curve in @curves
			if coord.y > curve.topOffset and coord.y < curve.topOffset + curve.height
				@dragNode = curve.disectAt coord
				break
		

	update:( dt ) ->
		
		mouse = v.sub core.canvasMouse( ), @pan
		
		for curve in @curves
			if mouse.y > curve.topOffset and mouse.y < curve.topOffset + curve.height
				@disectionNode.move mouse.x, curve.firstNode
				@invalidate( ) if @disectionNode.coord and not v.eq mouse, @lastMouse
		
		if core.input.down 'debug'
			@debug = true
			@invalidate( )
		
		if core.input.released 'debug'
			@debug = false
			@invalidate( )
		
		# keys do panning	at the moment
		if core.input.down 'pan-left'
			@pan.x -= @panSpeed
				
			@invalidate( )	
		else if core.input.down 'pan-right'
			@pan.x += @panSpeed
			
			if @pan.x > @maxPanX
				@pan.x = @maxPanX
				
			@invalidate( )
		
		###
		if core.input.down 'pan-up'
			@pan.y -= @panSpeed
			@invalidate( )	
		else if core.input.down 'pan-down'
			@pan.y += @panSpeed
			@invalidate( )
		###
			
		# register the different start-drags
		if core.input.pressed 'left-mouse'
			$('.context-menu').fadeOut( 'fast' )
			
			@resetDrag( )
			
			for curve in @curves
				@dragNode = curve.nodeAtMouse @pan
				@dragNode.isSelected = true if @dragNode
				
				if not @dragNode
					@dragControl = curve.controlAtMouse @pan
					@dragControl.isSelected = true if @dragControl
			
			if not @dragNode and not @dragControl
				if @disectionNode.isUnderMouse @pan
					@createNode( )
				else
					@dragPan = v core.canvasMouse( )
				
		# stop dragging	
		if core.input.released 'left-mouse'
			@resetDrag( )
		
		# right click
		if core.input.pressed 'right-mouse'
			for curve in @curves
				node = curve.nodeAtMouse @pan
				
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
		
		
		ctx.save( )
		ctx.translate @pan.x, @pan.y
		
	 	# draw curves
		for curve in @curves
			curve.drawSegments( )
		
		# draw disection node
		@disectionNode.draw( )
			
		# draw curve nodes
		if not @debug
			for curve in @curves
				curve.drawNodes( )
		
		# draw flattened lines
		if @debug
			for curve in @curves
				for line in (curve.flatten flattenBy)
					ctx.lineWidth = 1
					ctx.strokeStyle = "rgb(255,255,255)"
					ctx.beginPath( )
					ctx.moveTo line[0].x, line[0].y
					ctx.lineTo line[1].x, line[1].y
					ctx.stroke( )
					
					ctx.fillStyle = "rgb(255,255,255)"
					ctx.beginPath( )
					ctx.arc line[0].x, line[0].y, 3, 0, TAU
					ctx.fill( )
					
					ctx.beginPath( )
					ctx.arc line[1].x, line[1].y, 3, 0, TAU
					ctx.fill( )
			
		ctx.restore( )
	

core.input.bind core.key.LEFT_ARROW, 'pan-left'
core.input.bind core.key.RIGHT_ARROW, 'pan-right'
core.input.bind core.key.UP_ARROW, 'pan-up'
core.input.bind core.key.DOWN_ARROW, 'pan-down'
core.input.bind core.button.RIGHT, 'right-mouse'
core.input.bind core.button.LEFT, 'left-mouse'
core.input.bind core.key.D, 'debug'


app = new App( )
app.run( )

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
	pwmBits = 12
	curveHeight = 256
	barLength = 256
	
	maxValue = (Math.pow 2, pwmBits) - 1
	
	outputFunc = null
	
	gammaCorrectedDutyCycle = (value) ->
		gamma = 2.5
		Math.floor (maxValue * (Math.pow (value/curveHeight), gamma))
	
	coordToCode = (coord) ->
		output = outputFunc coord.y
		'{' + ([(Math.floor coord.x), output].join ',') + '}'
		
	lineToCode = (line) ->
		coordToCode line[0], outputFunc
		
	curves = app.curves
	curveOutput = {}
	curveNum = 0
	
	outputCode = []
	
	for curve in curves
		lines = curve.outputLines flattenBy
		
		curveOutput['curve' + curveNum] = lines
		
		lastCoord = lines[lines.length-1][1]
		
		# use gamma correct function
		outputFunc = gammaCorrectedDutyCycle
		
		# gamma correct and get duty cycle for first point in each line
		coords = (lines.map lineToCode)
		
		# add the last lines's end point too
		coords = coords.concat [(coordToCode lastCoord, gammaCorrectedDutyCycle)]
		
		linesCode = '{\n' + coords.join(',\n') + '\n}'
		
		outputCode.push '''
		typedef struct {
			// 256 = 1 second
			uint8_t t;
			// 4096 = on
			uint16_t dutyCycle;
		} pwmKeyframe_t;
		'''
		
		outputCode.push 'pwmKeyframe_t curve' + curveNum + '[' + (lines.length + 1) + '] = ' + linesCode + ';'
		
		curveNum += 1
	
	$('#compile-output').val outputCode.join('\n')