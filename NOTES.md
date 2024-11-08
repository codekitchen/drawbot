# Apriltag Detection

- [Webcam to JPEG](https://medium.com/@arpit23sh/capturing-webcam-images-using-html-and-javascript-9b8896ef1705)
- [emscripten compiling](https://emscripten.org/docs/getting_started/FAQ.html#faq-dead-code-elimination)
- [focal length](https://www.scantips.com/lights/subjectdistance.html)
-
image 5712 x 4284
focal len equiv: 26
focal len: 5.96
26/5.96 = 4.362 crop factor
35mm = 36 x 24, diagonal 43.2667 mm
43.2667 / 4.362 = 9.919 diagonal mm
diag = sqrt(5712**2+4284**2) = 7140
5712 / 7140 = 0.8
4284 / 7140 = 0.6
sensor width  = 9.919 * 0.8 = 7.93
sensor height = 9.919 * 0.6 = 5.95

focal length in pixels = (image width in pixels) * (focal length in mm) / (CCD width in mm)
fx = 5712 * 5.96 / 7.93 = 4293
fy = 4284 * 5.96 / 5.95 = 4291

# Pen Movement

## Motor Stepping

Spool diameter = 48mm
Spool circumference, distance moved in one full rotation = 48*PI = 150.79
Motor steps per rotation = 1600
Distance per step = 15.708 / 1600 = 0.0098175
Steps per mm = 101.8589

with string = 50*PI = 157

1600 steps = 155mm
Steps per mm = 10

d = 400.05
x = 60.32
y = 88.9

h1 = 107.43
h2 = 351


# new position
x=200
y=90
h1 = 220
h2 = 220

h1' = 220-107 = 113
h2' = 220-351 = -131
