NAME = test
DEVICE	 = attiny13a
CLOCK	  = 1200000
OBJECTS	= test.o
CFLAGS	 =

COMPILE = avr-gcc -Wall -Os $(CFLAGS) -DF_CPU=$(CLOCK) -mmcu=$(DEVICE) -std=gnu99

# symbolic targets:
all: upload

upload: $(NAME).hex
	avrdude -p t13 -c avr910 -P /dev/cu.penguino-uart -e -U flash:w:$(NAME).hex

fuseread:
	avrdude -p t13 -c avr910 -P /dev/cu.penguino-uart -U hfuse:r:high.bin:b -U lfuse:r:low.bin:b

fusewrite:
	avrdude -p t13 -c avr910 -P /dev/cu.penguino-uart -U lfuse:w:0xE2:m

.c.o:
	$(COMPILE) -c $< -o $@

.cpp.o:
	$(COMPILE) -c $< -o $@

.S.o:
	$(COMPILE) -x assembler-with-cpp -c $< -o $@

.c.s:
	$(COMPILE) -S $< -o $@

clean:
	rm -f $(NAME).bin $(NAME).elf $(OBJECTS)

$(NAME).elf: $(OBJECTS)
	$(COMPILE) -o $(NAME).elf $(OBJECTS)

$(NAME).hex: $(NAME).elf
	rm -f $(NAME).hex
	avr-objcopy -j .text -j .data -O ihex $(NAME).elf $(NAME).hex

disasm:	$(NAME).elf
	avr-objdump -d $(NAME).elf