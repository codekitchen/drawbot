import { bus } from "./message_bus.js";
import { V } from "./vec.js";

const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
    canvas {
      display: block;
      margin: 0 auto;
    }
  </style>
  <div><canvas></canvas></div>
`;

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
    this.canvas.addEventListener('mousemove', (ev) => {
      if (ev.buttons != 1)
        return;
      this.move(new V(ev.offsetX - 100, ev.offsetY - 100));
    });
    document.body.addEventListener('mouseup', (ev) => {
      this.move(new V);
    });
    bus.on('bot-status', ({ detail }) => {
      this.botState = detail;
      this.maybeSendMove();
    });
    this.draw();
  }

  move(pos) {
    if (pos.len() > 100) {
      pos = pos.setMag(100);
    }
    this.pos = pos;
    this.maybeSendMove();
    this.draw();
  }

  maybeSendMove() {
    if (this.botState.idle && this.pos.len() > 20) {
      let m = this.pos.setMag(2).add(new V(this.botState.x, this.botState.y));
      this.botState.idle = false;
      bus.emit('move-to', { x: m.x, y: m.y });
    }
  }

  draw() {
    const canvas = this.canvas;
    const w = canvas.width = 225;
    const h = canvas.height = 225;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(w/2, h/2, 100, 0, 2 * Math.PI);
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = 'black';
    ctx.arc(w/2+this.pos.x, h/2+this.pos.y, 20, 0, 2 * Math.PI);
    ctx.fill();
    // ctx.beginPath();
    // ctx.arc(w/2+this.x, h/2+this.y, 15, 0, 2 * Math.PI);
    // ctx.stroke();
  }
}

customElements.define('drawbot-joystick', DrawbotJoystick);
