# Apriltag Detection

- [Webcam to JPEG](https://medium.com/@arpit23sh/capturing-webcam-images-using-html-and-javascript-9b8896ef1705)
- [emscripten compiling](https://emscripten.org/docs/getting_started/FAQ.html#faq-dead-code-elimination)
- [focal length](https://www.scantips.com/lights/subjectdistance.html)
-
image 5712 x 4284
focal len equiv: 26
focal len: 5.96
26/5.96 = 4.362 crop factor
43.2667 / 4.362 = 9.919 diagonal mm
diag = sqrt(5712**2+4284**2) = 7140
5712 / 7140 = 0.8
4284 / 7140 = 0.6

35mm = 36 x 24

focal length in pixels = (image width in pixels) * (focal length in mm) / (CCD width in mm)
fx = 5712 * 5.96 / 7.93 = 4293
fy = 4284 * 5.96 / 5.95 = 4291