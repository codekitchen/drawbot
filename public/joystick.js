import { bus } from "./message_bus.js";
import { V } from "./vec.js";

const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
    div {
      position: relative;
    }
    canvas {
      display: block;
      margin: 0 auto;
    }
  </style>
  <div><canvas></canvas></div>
`;

const JOYSTICK_R = 100;
const KNOB_R = 20;
const DEADZONE_R = 40;
const CANVAS_W = 225;
const CANVAS_H = 225;

class DrawbotJoystick extends HTMLElement {
  constructor() {
    super();
    this.pos = new V();
    this.botState = { x: 0, y: 0, idle: false };
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.div = this.shadowRoot.querySelector('div');
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.div.addEventListener('pointerdown', this.pointerMove);
    this.div.addEventListener('pointermove', this.pointerMove);
    this.div.addEventListener('pointerup', this.pointerStop);
    bus.on('bot-status', ({ detail }) => {
      this.botState = detail;
      this.maybeSendMove();
    });
    this.draw();
  }

  pointerMove = (ev) => {
    if (ev.target != this.canvas || ev.buttons != 1)
      return;
    this.canvas.setPointerCapture(ev.pointerId);
    this.move(new V(ev.offsetX - CANVAS_W/2, ev.offsetY - CANVAS_H/2));
  }

  pointerStop = (ev) => {
    this.move(new V);
  }

  move(pos) {
    const maxMag = JOYSTICK_R - KNOB_R;
    if (pos.len() > maxMag) {
      pos = pos.setMag(maxMag);
    }
    this.pos = pos;
    this.maybeSendMove();
    this.draw();
  }

  maybeSendMove() {
    if (this.botState.idle && this.pos.len() >= DEADZONE_R/2) {
      let m = this.pos.setMag(2).add(new V(this.botState.x, this.botState.y));
      this.botState.idle = false;
      bus.emit('move-to', { x: m.x, y: m.y });
    }
  }

  draw() {
    const canvas = this.canvas;
    const w = canvas.width = CANVAS_W;
    const h = canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w/2, h/2, JOYSTICK_R, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#555';
    ctx.arc(w/2, h/2, DEADZONE_R, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.arc(w/2+this.pos.x, h/2+this.pos.y, KNOB_R, 0, 2 * Math.PI);
    ctx.stroke();
    // ctx.beginPath();
    // ctx.arc(w/2+this.x, h/2+this.y, 15, 0, 2 * Math.PI);
    // ctx.stroke();
  }
}

customElements.define('drawbot-joystick', DrawbotJoystick);
