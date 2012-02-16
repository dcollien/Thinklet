canvas = core.canvas
ctx = core.ctx


class ControlNode
	constructor: (coord, @parentNode, @type) ->
		@moveTo coord
		
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
	constructor: (coord, leftCP, rightCP) ->
		@moveTo coord
		
		@controlLeft = new ControlNode( leftCP, @, 'left' ) if leftCP
		@controlRight = new ControlNode( rightCP, @, 'right' ) if rightCP
		
		# smooth points are the default
		@style = 'smooth'
		
		@next = null
		@prev = null
		
	getControlNode: (type) ->
		if type == 'left'
			return @controlLeft
		if type == 'right'
			return @controlRight
	
	smooth: ->
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
		
			# the above vectors sized to their original lengths
			leftVect  = v.mul leftVect, leftOffset.len( )
			rightVect = v.mul rightVect, rightOffset.len( )
		
			# back to the original coordinate system
			leftVect  = (v.add @, leftVect)
			rightVect = (v.add @, rightVect)
	
			# move the control points to their new positions
			@controlLeft.moveTo leftVect
			@controlRight.moveTo rightVect
			
			# double-ensure smoothing from one of the control points
			# (in case something was screwed up by constraints)
			@controlRight.smooth( )
		
		
	moveTo: (coord) ->
		
		# how much it moved by this update
		nodeMove = v.sub coord, @
		
		# constrain movement to not let
		# control points past next or prev nodes
		if @controlRight
			newControlX = (@controlRight.x + nodeMove.x)
			if @next and newControlX > @next.x
				coord.x = @next.x - (newControlX - coord.x) 
		
		if @controlLeft
			newControlX = (@controlLeft.x + nodeMove.x)
			if @prev and newControlX < @prev.x
				coord.x = @prev.x - (newControlX - coord.x) 
				
		# update movement vector with constrained values
		nodeMove = v.sub coord, @
		
		# move control points with the moving of the curve
		if @controlLeft
			@controlLeft.moveTo (v.add @controlLeft, nodeMove)
			
		if @controlRight
			@controlRight.moveTo (v.add @controlRight, nodeMove)
		
		@x = coord.x
		@y = coord.y

class Curve
	constructor: ->
		@color = "rgb(0,0,255)"
		
		# linked nodes
		@firstNode = null
		@lastNode = null
		
		# debug
		@addNode (v 10, 200), null, (v 60, 100)
		@addNode (v 300, 200), (v 250, 300), (v 300, 300)
		@addNode (v 500, 200), (v 450, 300), null
		
		@firstNode.next.style = "sharp"
		
	addNode: (pos, leftCP, rightCP) ->
		node = new CurveNode( pos, leftCP, rightCP )
		
		if @firstNode == null
			@firstNode = node
			@lastNode = node
		else
			node.prev = @lastNode
			@lastNode.next = node
			@lastNode = node
		
		
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

		ctx.lineWidth = 2
		ctx.strokeStyle = "rgb(63,63,63)"
		ctx.fillStyle = "rgb(195,195,195)"
		
		ctx.beginPath( )
		ctx.moveTo to.x-offset, to.y
		ctx.lineTo to.x, to.y-offset
		ctx.lineTo to.x+offset, to.y
		ctx.lineTo to.x, to.y+offset
		ctx.lineTo to.x-offset, to.y
		ctx.closePath( )
		
		ctx.stroke( )
		ctx.fill( )
		
	drawControlPoints: (node) ->
		@drawControlLine node, node.controlLeft  if node.controlLeft
		@drawControlLine node, node.controlRight if node.controlRight
	
	drawNode: (node) ->
		x = node.x
		y = node.y
		
		if node.style == "sharp"
			offset = 2.7
			ctx.lineWidth = 2
			ctx.fillStyle = "rgb(255,0,0)"
			ctx.strokeStyle = "rgb(63,63,63)"
			
			ctx.beginPath( )
			ctx.strokeRect x-offset, y-offset, offset*2, offset*2
			ctx.fillRect x-offset, y-offset, offset*2, offset*2
		else
			radius = 3
			ctx.lineWidth = 2
			ctx.fillStyle = "rgb(0,255,0)"
			ctx.strokeStyle = "rgb(63,63,63)"
			
			ctx.beginPath( )
			ctx.arc x, y, radius, 0, TAU
			ctx.closePath( )
			
			ctx.stroke( )
			ctx.fill( )

	getNodes: ->
		# get an array of the nodes 
		# from the linked list representation
		nodes = []
		currNode = @firstNode
		while currNode != null
			nodes.push currNode
			currNode = currNode.next
		return nodes
	
	draw: ->
		nodes = @getNodes( )
		
		for i in [0...nodes.length-1]
			@drawCurveSegment nodes[i], nodes[i+1]
			
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

class App extends core.App
	constructor: ->
		super( )
		
		@width = 800
		@height = 600
		
		canvas.width = @width
		canvas.height = @height
		
		@pan = v 0, 0
		@panSpeed = 3.0
		@zoom = 1.0
		
		@curve = new Curve
		@dragNode = null
		@dragControl = null


	updateDragging: (dt) ->
		# handle the dragging parts of the update
		
		if @dragPan
			mouse = core.canvasMouse( )
			
			diff = v.sub mouse, @dragPan
			@pan = v.add diff, @pan
			@dragPan = v mouse
			
			@invalidate( )
			
		else if @dragNode
			mouse = v.sub core.canvasMouse( ), @pan
			
			@dragNode.moveTo mouse
				
			@invalidate( )
		
		else if @dragControl
			mouse = v.sub core.canvasMouse( ), @pan
			
			@dragControl.moveTo mouse
			
			if @dragControl.parentNode.style == 'smooth'
				# constrain the smoothness of this node
				@dragControl.smooth( )
			
			@invalidate( )

	update:( dt ) ->	
		
		# keys do panning	at the moment
		if core.input.down 'pan-left'
			@pan.x -= @panSpeed
			@invalidate( )	
		else if core.input.down 'pan-right'
			@pan.x += @panSpeed
			@invalidate( )
			
		if core.input.down 'pan-up'
			@pan.y -= @panSpeed
			@invalidate( )	
		else if core.input.down 'pan-down'
			@pan.y += @panSpeed
			@invalidate( )
			
		# register the different start-drags
		if core.input.pressed 'left-mouse'
			$('.context-menu').fadeOut( 'fast' )
			
			@dragNode = @curve.nodeAtMouse @pan
			@dragControl = @curve.controlAtMouse @pan
			
			if not @dragNode and not @dragControl
				@dragPan = v core.canvasMouse( )
				
		# stop dragging	
		#if not core.input.down 'left-mouse'
		if core.input.released 'left-mouse'
			@dragNode = null
			@dragControl = null
			@dragPan = null
		
		# right click
		if core.input.pressed 'right-mouse'
			node = @curve.nodeAtMouse @pan
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
				
	drawGrid: ->
		gridSize = 10
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
		
		ctx.save( )
		ctx.translate @pan.x, @pan.y
	 	# draw the panned content
		@curve.draw( )
		ctx.restore( )
	

core.input.bind core.key.LEFT_ARROW, 'pan-left'
core.input.bind core.key.RIGHT_ARROW, 'pan-right'
core.input.bind core.key.UP_ARROW, 'pan-up'
core.input.bind core.key.DOWN_ARROW, 'pan-down'
core.input.bind core.button.RIGHT, 'right-mouse'
core.input.bind core.button.LEFT, 'left-mouse'


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
	data.node.style = 'sharp' if data.node
	$('.context-menu').fadeOut 'fast'
	app.invalidate( )
