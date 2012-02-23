class Compiler
	constructor: ->
		@maxValue = 255
		@threshold = 4
		@gamma = 2.5
		@gammaTableSize = 64
	
	toHexByte: (num) -> 
		hex = num.toString(16)
		if hex.length == 1
			hex = '0' + hex
		return hex
		
	makeGammaTable: ->
		@gammaTable = []
		for i in [0...@gammaTableSize]
			@gammaTable.push Math.floor((Math.pow (i/(@gammaTableSize-1)), @gamma) * @maxValue)
	
	generatePrelude: ->
		# TODO: timing multiplier (256 = 1 microsecond, 256 = 1 second, or 256 = 1 minute, etc.)
		
		'''
		// Placeholder for stuff at the start
		
		'''
	
	generatePostlude: ->
		'''
		
		// Placeholder for other stuff to do
		
		'''
		
	
	generateGammaTableCode: ->
		outputCode = '// Gamma Table\n'
		outputCode += (@gammaTable.map @toHexByte).join ' '
		outputCode += '\n'
		
		return outputCode
		
	generatePathCode: ->
		
				
		outputCode = '''\n
		// Channels
		// Byte 1: Time Offset (since last)
		// Byte 2: Intensity value (raw)
		
		'''
		
		pathID = 0
		for path in @paths
			#console.log path, path.length
			pathCode = ''
			
			outputCode += '// Channel ' + pathID + '\n'
			offsetPath = []
			prevX = 0
			for coord in path
				offsetPath.push @toHexByte(coord.x - prevX) + ' ' + @toHexByte(coord.y)
				prevX = coord.x
			
			pathCode += (offsetPath).join '\n'
			pathID += 1
			
			outputCode += pathCode + '\n'
		
		return outputCode
		
	compile: (curves) ->
		curveHeight = 256
		stepSize = 8
		maxOffset = @maxValue * stepSize
		
		scaleNode = (node) => v Math.floor(node.x/stepSize), Math.round(@maxValue*node.y/curveHeight)
		
		outputCode =  @generatePrelude( )
		
		if @gamma > 1
			@makeGammaTable( )
			outputCode += @generateGammaTableCode( )
		
		@paths = []
		for curve in curves
			height = curve.height
			
			
			path = (curve.outputNodes maxOffset, stepSize)
			path = path.map scaleNode
			@paths.push path
		
		outputCode += @generatePathCode( )
		
		outputCode += @generatePostlude( )
		
		return outputCode
		
		
			