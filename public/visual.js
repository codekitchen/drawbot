import { InputLength } from './input_length.js'
import { bus } from './message_bus.js';
import { V } from "./vec.js";

const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
    div {
      position: relative;
      width: 100%;
      height: 100%;
    }
    canvas {
      position: absolute;
    }
  </style>
  <div><canvas></canvas></div>
`;

const originx = 20, originy = 20;

class DrawbotVisual extends HTMLElement {
  constructor() {
    super();
    this.preview = [];
    this.translation = new V;
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.div = this.shadowRoot.querySelector('div');
    this.canvas = this.shadowRoot.querySelector('canvas');
    this.draw();
    this.resizeObserver = new ResizeObserver(() => this.draw());
    this.resizeObserver.observe(this.div);
    bus.on('length-mode', () => this.draw());
    bus.on('bot-status', ({ detail }) => {
      this.state = detail;
      this.draw();
    });
    bus.on('preview', ({ detail }) => {
      this.preview = detail.lines;
      this.draw();
    });
    bus.on('draw-reset', () => this.translation = new V);
    this.div.addEventListener('pointerdown', this.pointerStart);
    this.div.addEventListener('pointermove', this.pointerMove);
  }

  pointerStart = (ev) => {
    if (ev.target != this.canvas || ev.buttons != 1)
      return;
    this.canvas.setPointerCapture(ev.pointerId);
    this.lastPoint = new V(ev.offsetX, ev.offsetY);
  }

  pointerMove = (ev) => {
    if (ev.target != this.canvas || ev.buttons != 1)
      return;
    const newPoint = new V(...this.screenToWorld(ev.offsetX, ev.offsetY));
    const delta = newPoint.sub(new V(...this.screenToWorld(this.lastPoint.x, this.lastPoint.y)));
    bus.emit('draw-translate', { delta });
    this.lastPoint = new V(ev.offsetX, ev.offsetY);
  }

  worldToScreen(x, y) {
    const w = this.div.clientWidth;
    const scaleFactor = (w - originx * 2) / this.state.d;
    return [x * scaleFactor + originx, y * scaleFactor + originy];
  }

  screenToWorld(x, y) {
    const w = this.div.clientWidth;
    const scaleFactor = (w - originx * 2) / this.state.d;
    return [(x - originx) / scaleFactor, (y - originy) / scaleFactor];
  }

  draw() {
    const canvas = this.canvas;
    const w = canvas.width = this.div.clientWidth;
    const h = canvas.height = this.div.clientHeight;
    if (!this.state)
      return;
    const scaleFactor = (w - originx * 2) / this.state.d;
    const worldToScreen = this.worldToScreen.bind(this);
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    // outline the drawing area
    ctx.strokeStyle = '#3399'
    ctx.lineWidth = 1;
    ctx.moveTo(...worldToScreen(0, 0));
    ctx.lineTo(...worldToScreen(this.state.d, 0));
    ctx.lineTo(...worldToScreen(this.state.d, this.state.h));
    ctx.lineTo(...worldToScreen(0, this.state.h));
    ctx.closePath();
    ctx.stroke();

    // draw the hardware and strings
    ctx.strokeStyle = 'black';
    ctx.beginPath();
    ctx.arc(...worldToScreen(0,0), 5, 0, 2 * Math.PI);
    ctx.arc(...worldToScreen(this.state.d, 0), 5, 0, 2 * Math.PI);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(...worldToScreen(0, 0));
    ctx.lineTo(...worldToScreen(this.state.x, this.state.y));
    ctx.lineTo(...worldToScreen(this.state.d, 0));
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(...worldToScreen(this.state.x, this.state.y), 5, 0, 2 * Math.PI);
    ctx.fill();

    // dashed measurement lines
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(...worldToScreen(0, 0));
    ctx.lineTo(...worldToScreen(this.state.d, 0));
    ctx.moveTo(...worldToScreen(0, 0));
    ctx.lineTo(...worldToScreen(0, this.state.y));
    ctx.lineTo(...worldToScreen(this.state.x, this.state.y));
    ctx.stroke();
    ctx.setLineDash([]);

    // distance labels
    ctx.font = '1em monospace';
    ctx.textAlign = 'center';
    ctx.fillText(InputLength.display(this.state.d), ...worldToScreen(this.state.d/2, 30));
    ctx.fillText(InputLength.display(this.state.x), ...worldToScreen(this.state.x/2, this.state.y-10));
    ctx.save();
    ctx.translate(...worldToScreen(10, this.state.y/2));
    ctx.rotate(Math.PI/2);
    ctx.fillText(InputLength.display(this.state.y), 0, 0);
    ctx.restore();

    ctx.beginPath();
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 1;
    for (let line of this.preview) {
      if (line.pen) {
        ctx.lineTo(...worldToScreen(line.x, line.y));
      } else {
        ctx.moveTo(...worldToScreen(line.x, line.y));
      }
    }
    ctx.stroke();
  }
}

customElements.define('drawbot-visual', DrawbotVisual);
