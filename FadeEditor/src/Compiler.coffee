class Compiler
	constructor: ->
		@maxValue = 255
		@threshold = 4
		@gamma = 2.5
		@gammaTableSize = 64
		
	makeGammaTable: ->
		@gammaTable = []
		for i in [0...@gammaTableSize]
			@gammaTable.push Math.floor((Math.pow (i/(@gammaTableSize-1)), @gamma) * @maxValue)
	
	generatePrelude: ->
		# TODO: timing multiplier (256 = 1 microsecond, 256 = 1 second, or 256 = 1 minute, etc.)
		
		'''
		// Start
		
		'''
	
	generatePostlude: ->
		'''
		// Do stuff
		
		'''
		
	
	generateGammaTableCode: ->
		outputCode = 'gamma = {\n'
		outputCode += @gammaTable.join ','
		outputCode += '\n}\n'
		
		return outputCode
		
	generatePathCode: ->
		outputCode = '''
		// Byte 1: Time Offset (since last)
		// Byte 2: Intensity value (raw)
		
		'''
		
		pathID = 0
		for path in @paths
			console.log path, path.length
			pathCode = ''
			
			outputCode += '// Channel ' + pathID + '\n'
			offsetPath = []
			prevX = 0
			for coord in path
				offsetPath.push (coord.x - prevX) + ',' + coord.y
				prevX = coord.x
			
			pathCode += (offsetPath).join ',\n'
			pathID += 1
			
			outputCode += pathCode + '\n'
		
		return outputCode
		
	compile: (curves) ->
		outputCode =  @generatePrelude( )
		
		if @gamma > 1
			@makeGammaTable( )
			outputCode += @generateGammaTableCode( )
		
		@paths = []
		for curve in curves
			height = curve.height
			@paths.push (curve.outputNodes flattenBy, @maxValue)
		
		outputCode += @generatePathCode( )
		
		outputCode += @generatePostlude( )
		
		return outputCode
		
		
			