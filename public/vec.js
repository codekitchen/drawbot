export class V {
  constructor(x = 0, y = 0) {
    this.x = x; this.y = y
  }
  static fromAngle(angle, r = 1) {
    return new V(+r * Math.cos(angle), +r * Math.sin(angle))
  }

  add(v2) { return new V(v2.x + this.x, v2.y + this.y) }
  sub(v2) { return new V(this.x - v2.x, this.y - v2.y) }
  mul(n) { return new V(this.x * n, this.y * n) }
  div(n) { return new V(this.x / n, this.y / n) }
  dot(v2) { return this.x * v2.x + this.y * v2.y }
  len() { return Math.sqrt(this.x ** 2 + this.y ** 2) }
  setMag(n) {
    if (n === 0 || this.len() === 0) return new V()
    let s = n / this.len()
    return new V(this.x * s, this.y * s)
  }
  normalize() {
    const l = this.len()
    if (l === 0) return this
    return new V(this.x / l, this.y / l)
  }
  heading() { return new Angle(Math.atan2(this.y, this.x)) }
  angle(v2) { return new Angle(Math.atan2(v2.y - this.y, v2.x - this.x)) }
  p() { return [this.x, this.y] }
}

// angle normalized between -PI and PI
export class Angle {
  constructor(radians = 0) { this.radians = Angle.normalize(radians) }
  static normalize(r) {
    while (r < -PI) r += TWO_PI
    while (r > PI) r -= TWO_PI
    return r
  }
  valueOf() { return this.radians }
  degrees() { return this.radians * 180 / PI }
  add(a2) { return new Angle(this.radians + a2) }
  sub(a2) { return new Angle(this.radians - a2) }
  clamp(min, max) { return new Angle(clamp(this.radians, min, max)) }
}

export function constrainDistance(pt, anchor, dist) {
  return pt.sub(anchor).setMag(dist).add(anchor)
}

export function clamp(val, min, max) {
  return val < min ? min : val > max ? max : val
}
