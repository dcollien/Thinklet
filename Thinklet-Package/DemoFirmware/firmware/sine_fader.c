/* Name: sine_fader.c
 * Author: Icy Labs Pty. Ltd.
 * Copyright: (c) 2012 Icy Labs Pty. Ltd.
 * License: Internal Use Only. Open Source Licensing TBA
 */

#include "thinklet.h"
#include <avr/pgmspace.h>

#define LED_A PB4
#define LED_B PB3

#define PWM_WINDOW 255
#define BRIGHTNESS_LIMIT 256
#define WAVE_STEPS 256

uint8_t gammaTable[BRIGHTNESS_LIMIT] PROGMEM = {
     0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,
     0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   0,   1,   1,   1,   1,
     1,   1,   1,   1,   1,   2,   2,   2,   2,   2,   2,   2,   3,   3,   3,   3,
     3,   4,   4,   4,   4,   5,   5,   5,   5,   6,   6,   6,   6,   7,   7,   7,
     8,   8,   8,   9,   9,   9,  10,  10,  10,  11,  11,  11,  12,  12,  13,  13,
    14,  14,  14,  15,  15,  16,  16,  17,  17,  18,  18,  19,  19,  20,  21,  21,
    22,  22,  23,  23,  24,  25,  25,  26,  27,  27,  28,  29,  29,  30,  31,  31,
    32,  33,  34,  34,  35,  36,  37,  37,  38,  39,  40,  41,  42,  42,  43,  44,
    45,  46,  47,  48,  49,  50,  51,  52,  52,  53,  54,  55,  56,  57,  59,  60,
    61,  62,  63,  64,  65,  66,  67,  68,  69,  71,  72,  73,  74,  75,  77,  78,
    79,  80,  82,  83,  84,  85,  87,  88,  89,  91,  92,  93,  95,  96,  98,  99,
   100, 102, 103, 105, 106, 108, 109, 111, 112, 114, 115, 117, 119, 120, 122, 123,
   125, 127, 128, 130, 132, 133, 135, 137, 138, 140, 142, 144, 145, 147, 149, 151,
   153, 155, 156, 158, 160, 162, 164, 166, 168, 170, 172, 174, 176, 178, 180, 182,
   184, 186, 188, 190, 192, 194, 197, 199, 201, 203, 205, 207, 210, 212, 214, 216,
   219, 221, 223, 226, 228, 230, 233, 235, 237, 240, 242, 245, 247, 250, 252, 255
};

uint8_t sineTable[WAVE_STEPS] PROGMEM = {
   127, 130, 133, 136, 139, 142, 145, 148, 151, 154, 157, 160, 163, 166, 169, 172,
   175, 178, 181, 184, 186, 189, 192, 194, 197, 200, 202, 205, 207, 209, 212, 214,
   216, 218, 221, 223, 225, 227, 229, 230, 232, 234, 235, 237, 239, 240, 241, 243,
   244, 245, 246, 247, 248, 249, 250, 250, 251, 252, 252, 253, 253, 253, 253, 253,
   254, 253, 253, 253, 253, 253, 252, 252, 251, 250, 250, 249, 248, 247, 246, 245,
   244, 243, 241, 240, 239, 237, 235, 234, 232, 230, 229, 227, 225, 223, 221, 218,
   216, 214, 212, 209, 207, 205, 202, 200, 197, 194, 192, 189, 186, 184, 181, 178,
   175, 172, 169, 166, 163, 160, 157, 154, 151, 148, 145, 142, 139, 136, 133, 130,
   127, 124, 121, 118, 115, 112, 109, 106, 103, 100,  97,  94,  91,  88,  85,  82,
    79,  76,  73,  70,  68,  65,  62,  60,  57,  54,  52,  49,  47,  45,  42,  40,
    38,  36,  33,  31,  29,  27,  25,  24,  22,  20,  19,  17,  15,  14,  13,  11,
    10,   9,   8,   7,   6,   5,   4,   4,   3,   2,   2,   1,   1,   1,   1,   1,
     0,   1,   1,   1,   1,   1,   2,   2,   3,   4,   4,   5,   6,   7,   8,   9,
    10,  11,  13,  14,  15,  17,  19,  20,  22,  24,  25,  27,  29,  31,  33,  36,
    38,  40,  42,  45,  47,  49,  52,  54,  57,  60,  62,  65,  68,  70,  73,  76,
    79,  82,  85,  88,  91,  94,  97, 100, 103, 106, 109, 112, 115, 118, 121, 124
};


global uint8_t channelA = 0;
global uint8_t channelB = 0;

setup( ) {
   make_output_pin( LED_A );
   make_output_pin( LED_B );
   
   setup_timer( TIMER_Clock );
   
   start_interrupts( );
}

on_timer( ) {
   static uint8_t windowCounter = 0;
   
   if ( windowCounter >= pgm_read_byte(gammaTable + channelA) ) {
      pin_off( LED_A );
   } else {
      pin_on( LED_A );
   }
      
   if ( windowCounter >= pgm_read_byte(gammaTable + channelB) ) {
      pin_off( LED_B );
   } else {
      pin_on( LED_B );
   }
   
   windowCounter = (windowCounter + 1) % PWM_WINDOW;
}

loop( ) {
   static uint8_t waveIndexA = 0;
   static uint8_t waveIndexB = WAVE_STEPS>>1;
   
   channelA = pgm_read_byte(sineTable + waveIndexA);
   waveIndexA = (waveIndexA + 1) % WAVE_STEPS;
   
   channelB = pgm_read_byte(sineTable + waveIndexB);
   waveIndexB = (waveIndexB + 1) % WAVE_STEPS;
   
   wait_us( 40 );
}

