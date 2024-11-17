import { bus } from "./message_bus.js";
import { V } from "./vec.js";

const template = document.createElement('template');
template.innerHTML = String.raw`
  <div>Drag on the visualization to move the robot manually.</div>
  <button id="pen-up">Pen Up</button>
  <button id="pen-down">Pen Down</button>
`;

const DEADZONE_R = 40;

class DrawbotJoystick extends HTMLElement {
  constructor() {
    super();
    this.pos = new V();
    this.botState = { x: 0, y: 0, idle: false };
  }

  connectedCallback() {
    this.appendChild(template.content.cloneNode(true));
    this.querySelector('#pen-up').addEventListener('click', () => {
      bus.emit('pen-up');
    });
    this.querySelector('#pen-down').addEventListener('click', () => {
      bus.emit('pen-down');
    });
    bus.on('viz-joystick', ({ detail }) => {
      if (!this.checkVisibility()) return;
      this.move(detail);
    });
    bus.on('bot-status', ({ detail }) => {
      this.botState = detail;
      this.maybeSendMove();
    });
  }

  move(pos) {
    this.pos = pos;
    this.maybeSendMove();
  }

  maybeSendMove() {
    if (this.botState.idle && this.pos.len() >= DEADZONE_R/2) {
      let m = this.pos.setMag(2).add(new V(this.botState.x, this.botState.y));
      this.botState.idle = false;
      bus.emit('move-to', { x: m.x, y: m.y });
    }
  }
}

customElements.define('drawbot-joystick', DrawbotJoystick);
