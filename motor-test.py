#!/usr/bin/env python

# Import required modules
import time
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)

RDIR=20
RSTE=21
LDIR=6
LSTE=13
STEPS=1250

GPIO.setup(RDIR, GPIO.OUT)
GPIO.setup(RSTE, GPIO.OUT)
GPIO.setup(LDIR, GPIO.OUT)
GPIO.setup(LSTE, GPIO.OUT)

def run():
    for i in range(STEPS):
        GPIO.output(RSTE, True)
        GPIO.output(LSTE, True)
        time.sleep(0.001)
        GPIO.output(RSTE, False)
        GPIO.output(LSTE, False)
        time.sleep(0.001)

GPIO.output(RDIR, True)
GPIO.output(LDIR, False)
run()

GPIO.output(RDIR, False)
GPIO.output(LDIR, True)
run()

