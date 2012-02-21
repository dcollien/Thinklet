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
	
	outputNodes: (threshold, maxXOffset = 0, steps) ->
		segments = @flatten threshold, steps
		output = []
		for segment in segments
			line = segment.line
			[t, p0, p1, p2, p3] = segment.curve
			
			output.push (v (Math.floor line[0].x), (Math.floor (line[0].y - @topOffset)))
			
			if maxXOffset > 0
				xOffset = Math.abs (line[0].x - line[1].x)
				if xOffset > maxXOffset
					numExtraNodes = Math.floor (xOffset/maxXOffset)
					for i in [1..numExtraNodes]
						x = line[0].x + (i*maxXOffset)
						t = cubicBezierAtX x, p0, p1, p2, p3
						y = (cubicBezier t, p0, p1, p2, p3).y
						outX = (Math.floor x)
						outY = (Math.floor (y - @topOffset))
						output.push (v outX, outY)
			
		
		segment = segments[segments.length-1]
		line = segment.line
		output.push (v (Math.floor line[1].x), (Math.floor (line[1].y - @topOffset)))
		
		return output
	
	flatten: (threshold, steps) ->
		segments = []
		
		currNode = @firstNode
		while currNode != null and currNode.next != null
			
			start = currNode
			end = currNode.next
			
			newSegments = @flattenBezier start, start.controlRight, end.controlLeft, end, threshold, steps
			segments = segments.concat newSegments
			
			currNode = currNode.next
		return segments
	
	flattenBezier: (p0, p1, p2, p3, threshold, steps) ->
		# x length?
		threshold = 2 if not threshold
		steps = 128 if not steps # Math.floor((Math.abs (p0.x - p3.x))/2)
		
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
				lastSegment = {
					line: [startCoord, currCoord],
					curve: [t, p0, p1, p2, p3]
				}
				
				lines.push lastSegment

				startCoord = currCoord
				coords = []
			else
				lastSegment = testLine

			t += stepSize
		
		lastSegment = {
			line: [startCoord, v p3],
			curve: [t, p0, p1, p2, p3]
		}
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
			
	stretch: (fromX, byX) ->
		node = @lastNode
		while node != null
			if node.x >= fromX
				node.moveTo (v (node.x + byX), node.y)
			else
				# no more nodes past this x
				break
			node = node.prev
			
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
