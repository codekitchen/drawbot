package internal

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"os"
	"time"

	"github.com/stianeikeland/go-rpio/v4"
)

const (
	penDown = 10
	penUp   = 5
)
const penSleep = time.Millisecond * 1000

type Command struct {
	// Command is "reset" | "moveTo"
	Command string  `json:"command"`
	D       float64 `json:"d"`
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
	Pen     bool    `json:"pen"`
}

type MotorController struct {
	RdirPin rpio.Pin
	RstePin rpio.Pin
	LdirPin rpio.Pin
	LstePin rpio.Pin
	PenPin  rpio.Pin

	X, Y float64 // current pos
	D    float64 // distance between strings

	startX, startY float64 // start position
	stepL, stepR   int     // current steps, current pos has to be rounded to step positions
	penPos         uint32
}

func MotorControllerInit() {
	if err := rpio.Open(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

func MotorControllerClose() {
	rpio.Close()
}

func LoadMotorController(path string) (*MotorController, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	mc := NewMotorController()
	err = json.Unmarshal(content, mc)
	if err != nil {
		return nil, err
	}
	mc.startX, mc.startY = mc.X, mc.Y
	return mc, nil
}

func SaveMotorController(mc *MotorController, path string) error {
	content, err := json.MarshalIndent(mc, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, content, 0644)
}

const stepsPerMM = 10

func (m *MotorController) Do(cmd Command) {
	switch cmd.Command {
	case "reset":
		slog.Debug("reset", "cmd", cmd)
		m.D = cmd.D
		m.X = cmd.X
		m.Y = cmd.Y
		m.startX, m.startY = m.X, m.Y
		m.stepL, m.stepR = 0, 0
	case "moveTo":
		slog.Debug("moveTo", "cmd", cmd)
		if cmd.Pen {
			m.MovePen(penDown)
		} else {
			m.MovePen(penUp)
		}
		m.MoveTo(cmd.X, cmd.Y)
	}
}

func NewMotorController() *MotorController {
	m := &MotorController{
		LdirPin: rpio.Pin(6),
		LstePin: rpio.Pin(13),
		RdirPin: rpio.Pin(20),
		RstePin: rpio.Pin(21),
		PenPin:  rpio.Pin(18),
	}
	return m
}

func (m *MotorController) Init() {
	m.LdirPin.Output()
	m.RdirPin.Output()
	m.LstePin.Output()
	m.RstePin.Output()
	m.PenPin.Output()
	m.PenPin.Pwm()
	m.PenPin.Freq(5000)
	m.penPos = penDown
	m.PenPin.DutyCycle(penDown, 100)
}

func (m *MotorController) MovePen(newPos uint32) {
	if newPos == m.penPos {
		return
	}
	m.penPos = newPos
	m.PenPin.DutyCycle(m.penPos, 100)
	time.Sleep(penSleep)
}

func (m *MotorController) MoveTo(x, y float64) {
	cur := Vec2{m.X, m.Y}
	dst := Vec2{x, y}
	diff := dst.Sub(cur)
	if diff.Mag() < 0.1 {
		return
	}
	dir := diff.Norm()
	step := cur.Add(dir)
	for dst.Sub(step).Mag() > 1.0 {
		m.moveStep(step.x, step.y)
		step = step.Add(dir)
	}
	// final move to exact requested position
	m.moveStep(x, y)
}

func (m *MotorController) moveStep(x, y float64) {
	lstart := Vec2{m.startX, m.startY}
	rstart := Vec2{m.D - m.startX, m.startY}
	ldst := Vec2{x, y}
	rdst := Vec2{m.D - x, y}
	h1s := lstart.Mag()
	h2s := rstart.Mag()
	h1e := ldst.Mag()
	h2e := rdst.Mag()

	h1d, h2d := h1e-h1s, h2e-h2s
	lstepsabs := int(h1d * stepsPerMM)
	rstepsabs := int(h2d * stepsPerMM)
	lsteps := lstepsabs - m.stepL
	rsteps := rstepsabs - m.stepR

	// slog.Debug("moveStep", "lstepsabs", lstepsabs, "lsteps", lsteps, "rstepsabs", rstepsabs, "rsteps", rsteps)

	lsteps = setDir(m.LdirPin, rpio.Low, lsteps)
	rsteps = setDir(m.RdirPin, rpio.High, rsteps)
	nsteps := max(lsteps, rsteps)
	lmoved, rmoved := 0, 0
	for range nsteps {
		lmoved += lsteps
		if lmoved >= nsteps {
			lmoved -= nsteps
			m.LstePin.High()
		}
		rmoved += rsteps
		if rmoved >= nsteps {
			rmoved -= nsteps
			m.RstePin.High()
		}
		time.Sleep(time.Millisecond)
		m.LstePin.Low()
		m.RstePin.Low()
		time.Sleep(time.Millisecond)
	}

	m.X, m.Y = x, y
	m.stepL, m.stepR = lstepsabs, rstepsabs
}

func setDir(dir rpio.Pin, posdir rpio.State, nsteps int) (steps int) {
	setDir := posdir
	if nsteps < 0 {
		setDir = invert(setDir)
		nsteps = -nsteps
	}
	dir.Write(setDir)
	return nsteps
}

func invert(s rpio.State) rpio.State {
	return 1 - s
}
