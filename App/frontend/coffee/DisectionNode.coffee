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