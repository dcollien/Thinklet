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
      
      curve = @parentNode.curve
      useLast  = curve.endpointLock and @parentNode is curve.firstNode and otherNode is curve.lastNode.controlLeft
      useFirst = curve.endpointLock and @parentNode is curve.lastNode and otherNode is curve.firstNode.controlRight
      
      if useLast
         otherNode.x -= curve.lastNode.x
      else if useFirst
         otherNode.x += curve.lastNode.x
      
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
         if useLast
            otherNode.moveTo (v (newVect.x+curve.lastNode.x), newVect.y)
         else if useFirst
            otherNode.moveTo (v (newVect.x-curve.lastNode.x), newVect.y)
         else
            otherNode.moveTo newVect
         
   moveTo: (coord) ->
      coord = @constrain coord
      
      @x = coord.x
      @y = coord.y