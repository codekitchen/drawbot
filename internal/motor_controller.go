package internal

import (
	"encoding/json"
	"fmt"
	"log/slog"
	"math"
	"os"
	"time"

	"github.com/stianeikeland/go-rpio/v4"
)

type Command struct {
	// Command is "reset" | "moveTo"
	Command string  `json:"command"`
	D       float64 `json:"d"`
	X       float64 `json:"x"`
	Y       float64 `json:"y"`
}

type MotorController struct {
	RdirPin rpio.Pin
	RstePin rpio.Pin
	LdirPin rpio.Pin
	LstePin rpio.Pin

	X, Y float64 // current pos
	D    float64 // distance between strings
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

	mc := &MotorController{}
	err = json.Unmarshal(content, mc)
	if err != nil {
		return nil, err
	}
	return mc, nil
}

func SaveMotorController(mc *MotorController, path string) error {
	content, err := json.Marshal(mc)
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
	case "moveTo":
		slog.Debug("moveTo", "cmd", cmd)
		m.MoveTo(cmd.X, cmd.Y)
	}
}

func NewMotorController() *MotorController {
	m := &MotorController{
		LdirPin: rpio.Pin(6),
		LstePin: rpio.Pin(13),
		RdirPin: rpio.Pin(20),
		RstePin: rpio.Pin(21),
	}
	m.LdirPin.Output()
	m.RdirPin.Output()
	m.LstePin.Output()
	m.RstePin.Output()
	return m
}

type vec2 struct {
	x, y float64
}

func (a vec2) add(b vec2) vec2 {
	return vec2{a.x + b.x, a.y + b.y}
}
func (a vec2) sub(b vec2) vec2 {
	return vec2{a.x - b.x, a.y - b.y}
}
func (v vec2) mul(s float64) vec2 {
	return vec2{v.x * s, v.y * s}
}
func (v vec2) mag() float64 {
	return math.Sqrt(v.x*v.x + v.y*v.y)
}
func (v vec2) norm() vec2 {
	mag := v.mag()
	return vec2{v.x / mag, v.y / mag}
}

func (m *MotorController) MoveTo(x, y float64) {
	cur := vec2{m.X, m.Y}
	dst := vec2{x, y}
	diff := dst.sub(cur)
	if diff.mag() < 0.1 {
		return
	}
	dir := diff.norm()
	step := cur
	for dst.sub(step).mag() > 0.1 {
		m.moveStep(step.x, step.y)
		stepdist := min(dst.sub(step).mag(), 1.0)
		step = step.add(dir.mul(stepdist))
	}
}

func (m *MotorController) moveStep(x, y float64) {
	lcur := vec2{m.X, m.Y}
	rcur := vec2{m.D - m.X, m.Y}
	ldst := vec2{x, y}
	rdst := vec2{m.D - x, y}
	h1s := lcur.mag()
	h2s := rcur.mag()
	h1e := ldst.mag()
	h2e := rdst.mag()

	h1d, h2d := h1e-h1s, h2e-h2s
	lsteps := int(h1d * stepsPerMM)
	rsteps := int(h2d * stepsPerMM)
	// slog.Debug("move steps", "left", lsteps, "right", rsteps)

	lsteps = setDir(m.LdirPin, rpio.High, lsteps)
	rsteps = setDir(m.RdirPin, rpio.Low, rsteps)
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
