package internal

import (
	"fmt"
	"os"
	"time"

	"github.com/stianeikeland/go-rpio/v4"
)

type MotorController struct {
	rdirPin int
	rstePin int
	ldirPin int
	lstePin int
}

func TestGPIO() {
	if err := rpio.Open(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
	defer rpio.Close()

	ldir := rpio.Pin(6)
	lste := rpio.Pin(13)

	ldir.Output()
	lste.Output()

	ldir.Low()
	for range 200 {
		lste.High()
		time.Sleep(time.Millisecond * 1)
		lste.Low()
		time.Sleep(time.Millisecond * 1)
	}
}
