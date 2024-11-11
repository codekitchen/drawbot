package internal

import "math"

type Vec2 struct {
	x, y float64
}

func (a Vec2) Add(b Vec2) Vec2 {
	return Vec2{a.x + b.x, a.y + b.y}
}
func (a Vec2) Sub(b Vec2) Vec2 {
	return Vec2{a.x - b.x, a.y - b.y}
}
func (v Vec2) Mul(s float64) Vec2 {
	return Vec2{v.x * s, v.y * s}
}
func (v Vec2) Mag() float64 {
	return math.Sqrt(v.x*v.x + v.y*v.y)
}
func (v Vec2) Norm() Vec2 {
	mag := v.Mag()
	return Vec2{v.x / mag, v.y / mag}
}
