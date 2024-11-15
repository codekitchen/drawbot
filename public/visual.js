import { InputLength } from './input_length.js'
import { bus } from './message_bus.js';

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

class DrawbotVisual extends HTMLElement {
  constructor() {
    super();
    // need to hook up to measurements data
    // this.state = { d: 500, x: 100, y: 290, h: 400 };
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
  }

  draw() {
    const canvas = this.canvas;
    const w = canvas.width = this.div.clientWidth;
    const h = canvas.height = this.div.clientHeight;
    if (!this.state)
      return;
    const originx = 20, originy = 20;
    const scaleFactor = (w - originx * 2) / this.state.d;
    const worldToScreen = (x, y) => ([x * scaleFactor + originx, y * scaleFactor + originy]);
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


    // ctx.strokeRect(0, 0, w, h);
    // ctx.moveTo(0, 0);
    // ctx.lineTo(w, h);
    // ctx.stroke();
    // ctx.beginPath();
    // for (let cmd of svg_draw.commands) {
    //   if (cmd.command == 'moveTo') {
    //     ctx.moveTo(cmd.x, cmd.y);
    //   } else {
    //     ctx.lineTo(cmd.x, cmd.y);
    //   }
    // }
  }
}

customElements.define('drawbot-visual', DrawbotVisual);
