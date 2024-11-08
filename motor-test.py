#!/usr/bin/env python

# Import required modules
import time
import RPi.GPIO as GPIO

GPIO.setmode(GPIO.BCM)

RDIR=20
RSTE=21
LDIR=6
LSTE=13
STEPS=1600

# LDIR=False = pull in
# RDIR=False = push out

GPIO.setup(RDIR, GPIO.OUT)
GPIO.setup(RSTE, GPIO.OUT)
GPIO.setup(LDIR, GPIO.OUT)
GPIO.setup(LSTE, GPIO.OUT)

def move(mdir, mste, d, nsteps):
    GPIO.output(mdir, d)
    for i in range(nsteps):
        GPIO.output(mste, True)
        time.sleep(0.001)
        GPIO.output(mste, False)
        time.sleep(0.001)

move(LDIR, LSTE, True, 1130)
move(RDIR, RSTE, True, 1310)

#move(RDIR, RSTE, False, 200)
#move(RDIR, RSTE, True, 200)

def run():
    for i in range(STEPS):
        GPIO.output(RSTE, True)
        GPIO.output(LSTE, True)
        time.sleep(0.001)
        GPIO.output(RSTE, False)
        GPIO.output(LSTE, False)
        time.sleep(0.001)

#GPIO.output(RDIR, True)
#GPIO.output(LDIR, False)
#run()

#GPIO.output(RDIR, False)
#GPIO.output(LDIR, True)
#run()

