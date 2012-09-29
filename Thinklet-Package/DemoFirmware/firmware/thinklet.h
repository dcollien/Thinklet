#include <avr/io.h>
#include <util/delay_basic.h>
#include <avr/interrupt.h>
#include <avr/sleep.h>

#define forever for(;;)
#define macro static inline void

macro do_setup( void );
macro do_loop( void );

//// math utilities
#define bit( number ) (1 << (number))
#define pin( number ) bit(number)

// ensure a value is within the bounds of a minimum and maximum (inclusive)
#define constrainUpper(value, max) (value > max ? max : value)
#define constrainLower(value, min) (value < min ? min : value)
#define constrain(value, min, max) constrainLower(constrainUpper(value, max), min)
#define multiplyDecimal(a,b) (((a) * (b)) / 256)

//// digital port configuration
#define make_outputs( pinmap ) DDRB |= pinmap
#define make_inputs( pinmap ) DDRB &= ~(pinmap)
#define make_output_pin( number ) make_outputs(pin(number))
#define make_input_pin( number ) make_inputs(pin(number))
#define pins_on( pinmap ) PORTB |= pinmap
#define pins_off( pinmap ) PORTB &= ~(pinmap)
#define pin_on( number ) pins_on(pin(number))
#define pin_off( number ) pins_off(pin(number))
#define pin_toggle( pin ) (PORTB ^= bit(pin))

//// wait loops
// delay a number of microseconds - or as close as we can get
#define wait_us(microseconds) _delay_loop_2(((microseconds) * (F_CPU / 100000)) / 40)

// delay in milliseconds - a custom implementation to avoid util/delay's tendancy to import floating point math libraries
macro wait_ms(unsigned int ms) {
	while (ms > 0) {
		// delay for one millisecond (250*4 cycles, multiplied by cpu mhz)
		// subtract number of time taken in while loop and decrement and other bits
		_delay_loop_2((25 * F_CPU / 100000));
		ms--;
	}
}


#define on_timer() ISR( TIM0_OVF_vect )

#define on_watchdog() ISR( WDT_vect )

#define loop() macro do_loop( void )
#define setup() macro do_setup( void )

#define global volatile

// TODO: Verify watchdog stuff works on t85 chips as described here:
#define WD_16ms 0x00
#define WD_32ms bit(WDP0)
#define WD_64ms bit(WDP1)
#define WD_125ms (bit(WDP1) | bit(WDP0))
#define WD_250ms bit(WDP2)
#define WD_500ms (bit(WDP2) | bit(WDP0))
#define WD_1s (bit(WDP2) | bit(WDP1))
#define WD_2s (bit(WDP2) | bit(WDP1) | bit(WDP0))
#define WD_4s bit(WDP3)
#define WD_8s (bit(WDP3) | bit(WDP0))
#define WD_MASK (~(bit(WDP3) | bit(WDP2) | bit(WDP1) | bit(WDP0)))
#define WD_ENABLE bit(WDTIE)

#define setup_watchdog( config ) \
	WDTCR = ((WDTCR & WD_MASK) | config) | WD_ENABLE;

// TODO: Verify timer works on t85 chips as described here
#define TIMER_Stop    0
#define TIMER_Clock   bit(CS00)
#define TIMER_Div8    bit(CS01)
#define TIMER_Div64   (bit(CS01) | bit(CS00))
#define TIMER_Div256  bit(CS02)
#define TIMER_Div1024 (bit(CS02) | bit(CS00))
#define TIMER_PinFall (bit(CS02) | bit(CS01))
#define TIMER_PinRise (bit(CS02) | bit(CS01) | bit(CS00))
#define TIMER_MASK (~(bit(CS02) | bit(CS01) | bit(CS00)))

#define setup_timer( config ) \
	TCCR0B = (TCCR0B & TIMER_MASK) | config; TIMSK |= bit(TOIE0);

#define start_interrupts() sei()
#define stop_interrupts() cli()

#define sleep() sleep_mode()

void __attribute__((noreturn)) main( void ) {
	DDRB = 0;
	
	set_sleep_mode( SLEEP_MODE_PWR_DOWN );
	
	do_setup( );

	forever {
		do_loop( );
	}
}

