#include <avr/io.h>
#include <util/delay.h>

typedef struct {
	// 256 = 1 second
	uint8_t t;
	// 4096 = on
	uint16_t dutyCycle;
} pwmKeyframe_t;

pwmKeyframe_t curve0[55] = {
{0,723},
{53,1484},
{119,2742},
{150,2900},
{168,2278},
{207,414},
{215,410},
{231,827},
{251,3776},
{264,4095},
{307,3611},
{335,2322},
{337,2100},
{351,7},
{363,18},
{409,756},
{414,723},
{472,0},
{481,0},
{502,5},
{540,879},
{574,3830},
{582,4095},
{609,2142},
{613,1537},
{625,39},
{643,66},
{690,1559},
{753,304},
{788,203},
{819,382},
{883,1610},
{902,1627},
{917,898},
{926,11},
{934,6},
{988,5},
{1027,50},
{1039,436},
{1051,1697},
{1085,2771},
{1144,3516},
{1173,3557},
{1208,2911},
{1253,1033},
{1315,5},
{1343,0},
{1345,0},
{1371,3},
{1393,237},
{1416,3290},
{1432,3820},
{1462,3353},
{1507,1460},
{1518,1058}
};

void main( void ) {
	DDRB = 1 << 3;
	PORTB = 0;
	
	while ( 1 ) {
		PORTB ^= 1 << 3;
		_delay_ms( 1000 );
	}
}
