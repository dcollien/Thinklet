class Curve
   constructor: (@topOffset, @stepSize) ->
      @height = 256
      
      @color = "rgb(0,0,255)"
      
      # linked nodes
      @firstNode = null
      @lastNode = null
      
      # debug
      @addNode (v 0, @height/2+@topOffset), null, (v 128, @height/2+@topOffset)
      @addNode (v @height*3, @height/2+@topOffset), (v @height*3-128, @height/2+@topOffset), null
      
      @debug = false
      @enabled = true
      @deviationThreshold = 4
      
      @autoDeviation = true
      
      @repeats = false
      
      @endpointLock = false
      
      
      @disabledColor = 'rgb(64,64,64)'
      @repeatColor = 'rgb(128,128,128)'
      
   outputNodes: (maxXOffset = 0, stepSize) ->
      threshold = @deviationThreshold
      
      stepSnap = (x) ->
         Math.round( x/stepSize ) * stepSize
      
      segments = @flatten threshold, stepSize
      output = []
      
      # ensure step size is maintained
      maxXOffset = Math.floor( maxXOffset/stepSize ) * stepSize
      
      for segment in segments
         line = segment.line
         [t, p0, p1, p2, p3] = segment.curve
         
         # add the first coord in each line
         output.push (v stepSnap(line[0].x), (Math.floor (line[0].y - @topOffset)))
         
         if maxXOffset > 0
            xOffset = Math.abs (line[0].x - line[1].x)
            if xOffset > maxXOffset
               numExtraNodes = Math.floor (xOffset/maxXOffset)
               for i in [1..numExtraNodes]
                  # put in extra nodes so that a max X distance is never exceeded
                  # get the Y value by finding where on the bezier the x value sits
                  x = stepSnap( line[0].x ) + (i*maxXOffset)
                  t = cubicBezierAtX x, p0, p1, p2, p3
                  y = (cubicBezier t, p0, p1, p2, p3).y
                  outX = (Math.floor x)
                  outY = (Math.floor (y - @topOffset))
                  output.push (v outX, outY)
         
      # add the last coord in the last line
      segment = segments[segments.length-1]
      line = segment.line
      output.push (v stepSnap(line[1].x), (Math.floor (line[1].y - @topOffset)))
      
      return output
   
   flatten: (threshold, stepSize) ->
      segments = []
      
      currNode = @firstNode
      while currNode != null and currNode.next != null
         
         start = currNode
         end = currNode.next
         
         newSegments = @flattenBezier start, start.controlRight, end.controlLeft, end, threshold, stepSize
         segments = segments.concat newSegments
         
         currNode = currNode.next
      return segments
   
   flattenBezier: (p0, p1, p2, p3, threshold, stepSize = 8) ->
      threshold = 2 if not threshold
      
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
      
      startCoord = v p0

      coords = []
      x = Math.floor(p0.x/stepSize) * stepSize
      x += stepSize
      while x < p3.x
         t = cubicBezierAtX x, p0, p1, p2, p3
         currCoord = cubicBezier t, p0, p1, p2, p3
         currCoord.x = x
         coords.push currCoord
         
         testLine = [startCoord, currCoord]
         
         if (x % stepSize) == 0
            # only add segments on full steps
            lastSegment = {
               line: [startCoord, currCoord],
               curve: [t, p0, p1, p2, p3]
            }
         
         # error too large, make a new line segment
         if (offPoints coords, testLine) > threshold
            lines.push lastSegment

            startCoord = lastSegment.line[1]
            coords = []
         
         x += 1
         
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
            
            node = new CurveNode( @, disectionPoint, controls[0], controls[1], @stepSize )
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
      node = new CurveNode( @, pos, leftCP, rightCP, @stepSize )
      
      if @firstNode == null
         @firstNode = node
         @lastNode = node
      else
         node.prev = @lastNode
         @lastNode.next = node
         @lastNode = node
      
      return node
      
   drawCurveSegment: (start, end, xShift = 0) ->
      c1 = start.controlRight
      c2 = end.controlLeft
      ctx.lineWidth = 2
      
      if xShift != 0
         ctx.strokeStyle = @repeatColor 
      else if @enabled
         ctx.strokeStyle = @color
      else
         ctx.strokeStyle = @disabledColor
         
      ctx.beginPath( )
      ctx.moveTo (start.x + xShift), start.y
      ctx.bezierCurveTo (c1.x + xShift), c1.y, (c2.x + xShift), c2.y, (end.x + xShift), end.y
      
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

   drawRepeats: (pan, width)->
      nodes = @getNodes( )
      
      
      offset = @lastNode.x
      
      while (offset + pan.x) < width
         ctx.lineWidth = 2
         ctx.strokeStyle = @repeatColor 

         ctx.beginPath( )
         ctx.moveTo offset, @lastNode.y
         ctx.lineTo @firstNode.x + offset, @firstNode.y
         ctx.stroke( )
         
         for i in [0...nodes.length-1]
            @drawCurveSegment nodes[i], nodes[i+1], offset
         offset += @lastNode.x
   
   drawControlLines: ->
      @drawControlPoints node for node in @getNodes( )
   
   drawNodes: ->
      @drawNode node for node in @getNodes( )
      
   controlAtMouse: (pan) ->
      return null if not @enabled
      
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
      return null if not @enabled
      
      radius = 6
      for node in @getNodes( )
         pannedNode = v.add pan, node
         dist = (v.sub core.canvasMouse(), pannedNode).len( )
         return node if dist < radius
      return null
