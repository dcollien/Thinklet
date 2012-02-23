class CurveNode
	constructor: (@curve, coord, leftCP, rightCP, @stepSize) ->
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
			return @getLeftCP( )
		if type == 'right'
			return @getRightCP( )
	
	flatten: ->
		if @controlLeft
			@controlLeft.x = @x 
			@controlLeft.y = @y
			
		if @controlRight
			@controlRight.x = @x 
			@controlRight.y = @y
	
	getLeftCP: ->
		if @curve.endpointLock and this is @curve.firstNode
			return @curve.lastNode.controlLeft
		else
			return @controlLeft
	
	getRightCP: ->
		if @curve.endpointLock and this is @curve.lastNode
			return @curve.firstNode.controlRight
		else
			return @controlRight
			
	reset: ->
		ctrlLeft = @getLeftCP( )
		ctrlRight = @getRightCP( )

		ctrlLeft.moveTo (v ctrlLeft.parentNode.x-32, ctrlLeft.parentNode.y) if ctrlLeft
		ctrlRight.moveTo (v ctrlRight.parentNode.x+32, ctrlRight.parentNode.y) if ctrlRight
		
		console.log ctrlLeft.parentNode.x-32, ctrlRight.parentNode.x+32
		
		if @style == 'smooth' or @style == 'symmetric'
			@smooth( )
		else if @style == 'flat'
			@style = 'sharp'
		
	consolidateEndpoints: ->
		if @curve.endpointLock
			if this is @curve.firstNode
				@curve.lastNode.style = @style
			else if this is @curve.lastNode
				@curve.firstNode.style = @style
		
	smooth: ->
		ctrlLeft = v @getLeftCP( )
		ctrlRight = v @getRightCP( )
				
		leftIsLastLeft = this is @curve.firstNode and @curve.endpointLock
		rightIsFirstRight  = this is @curve.lastNode and @curve.endpointLock
		
		if leftIsLastLeft
			ctrlLeft = (v ctrlLeft.x - @curve.lastNode.x, ctrlLeft.y)
		if rightIsFirstRight
			ctrlRight = (v ctrlRight.x + @curve.lastNode.x, ctrlRight.y)
		
		if ctrlLeft and v.eq ctrlLeft, @
			@reset( )
		
		if ctrlRight and v.eq ctrlRight, @
			@reset( )
			
		if ctrlLeft and ctrlRight
			# vectors from this parent node to the control points
			leftOffset  = (v.sub @, ctrlLeft)
			rightOffset = (v.sub @, ctrlRight)

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
			
			if leftIsLastLeft
				@curve.lastNode.controlLeft.moveTo (v (leftVect.x+@curve.lastNode.x), leftVect.y)
			else
				@controlLeft.moveTo leftVect
			
			if rightIsFirstRight
				@curve.firstNode.controlRight.moveTo (v (rightVect.x-@curve.lastNode.x), rightVect.y)
			else
				@controlRight.moveTo rightVect
		
		
	moveTo: (coord, snap = false, bubble=true) ->
		#return if not @curve.enabled
		
		snapX = (x) => Math.round( x / @stepSize) * @stepSize
		
		
		if snap
			console.log @stepSize, coord.x, snapX coord.x
			coord.x = snapX coord.x
			
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
		
		if bubble and @curve.endpointLock
			if this is @curve.firstNode
				@curve.lastNode.moveTo (v @curve.lastNode.x, @y), snap, false
			if this is @curve.lastNode
				@curve.firstNode.moveTo (v @curve.firstNode.x, @y), snap, false
				
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