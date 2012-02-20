#include <avr/io.h>
#include <util/delay.h>

typedef struct {
	// 256 = 1 second
	uint16_t t;
	// 4096 = on
	uint8_t dutyCycle;
} pwmKeyframe_t;

pwmKeyframe_t curve0[] = {
{0,0},
{255,255},
}

void main( void ) {
	DDRB = 1 << 3;
	PORTB = 0;
	
	while ( 1 ) {
		PORTB ^= 1 << 3;
		_delay_ms( 1000 );
	}
}
