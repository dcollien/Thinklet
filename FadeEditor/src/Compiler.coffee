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
		#include <avr/io.h>
		#include <util/delay.h>
		'''
	
	generatePostlude: ->
		'''
		int main( void ) {
			DDRB = 1;
			PORTB = 0;
			
			// TODO: set up interrupts
			// and write code
			
			return 0;
		}
		'''
		
	
	generateGammaTableCode: ->
		outputCode = 'uint8_t gamma[' + @gammaTableSize + '] = {\n'
		outputCode += @gammaTable.join ',\n'
		outputCode += '\n};\n'
		
		return outputCode
		
	generatePathCode: ->
		outputCode = '''
		typedef struct {
			// 256 = 1 second
			uint16_t t;
			
			// 255 = 100%
			uint8_t dutyCycle;
		} pwmKeyframe_t;
		'''
		
		coordCode = (coord) ->
			'{' + (Math.floor coord.x) + ',' + (Math.floor coord.y) + '}'
		
		pathID = 0
		for path in @paths
			pathCode = 'pwmKeyframe_t path' + pathID + '[' + path.length + '] = {\n'
			pathCode += (path.map coordCode).join ',\n'
			pathCode += '};\n'
			pathID += 1
			
			outputCode += pathCode
		
		return outputCode
		
	compile: (curves) ->
		outputCode =  @generatePrelude( )
		
		if @gamma > 1
			@makeGammaTable( )
			outputCode += @generateGammaTableCode( )
		
		@paths = []
		for curve in curves
			height = curve.height
			@paths.push curve.outputNodes( )
		
		outputCode += @generatePathCode( )
		
		outputCode += @generatePostlude( )
		
		return outputCode
		
		
			