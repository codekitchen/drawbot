import { bus } from './message_bus.js';
import { pathFromSVG, svgToDrawbot } from './svg_translation.js';
import { V } from "./vec.js";

const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
    input[type=range] {
      width: 100%;
    }
    label {
      display: block;
    }
  </style>
  <form id="draw-svg">
    <label>
      SVG:
      <input type="file" name="svg" id="svg-file" accept=".svg" />
    </label>
    <label>
      Scale:
      <input type="range" id="svg-scale" name="scale" step="any" min="0" max="1" value="1" />
    </label>
    <pre id="svg-info"></pre>
    <input type="submit" value="draw" />
  </form>
`;

class SVGDraw extends HTMLElement {
  constructor() {
    super();
    this.svgPath = [];
    this.userScale = 1.0;
    this.svgScale = 1.0;
    this.translation = new V;
    this.attachShadow({ mode: 'open' });
    bus.on('bot-status', this.botStatus);
  }

  botStatus = ({ detail }) => {
    this.botState = detail;
    this.update();
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.svgForm = this.shadowRoot.querySelector('form#draw-svg')
    this.svgFile = this.shadowRoot.querySelector('#svg-file')
    this.infoBox = this.shadowRoot.querySelector('#svg-info')
    this.update();

    bus.on('draw-translate', ({ detail }) => {
      this.translation = this.translation.add(detail.delta);
      this.update();
    });

    this.svgForm.addEventListener("submit", this.submit)

    this.shadowRoot.querySelector('#svg-scale').oninput = (ev) => {
      this.userScale = ev.target.valueAsNumber;
      this.update();
    }
    this.svgFile.addEventListener('change', (ev) => {
      bus.emit('draw-reset');
      this.svgPath = [];
      let file = ev.target.files[0];
      if (!file) return;
      let reader = new FileReader();
      reader.onload = (ev) => {
        let svgStr = ev.target.result;
        this.svgPath = pathFromSVG(svgStr);
        if (!this.svgPath) {
          this.infoBox.innerText = 'No path element found';
          return;
        }
        const commands = svgToDrawbot(this.svgPath, 1, { x: 0, y: 0 });
        const ext = extents(commands);
        const xscale = this.botState.d / (ext.maxX - ext.minX);
        const yscale = this.botState.h / (ext.maxY - ext.minY);
        this.svgScale = Math.min(xscale, yscale);
        this.translation = new V(-ext.minX, -ext.minY);
        this.update();
      }
      reader.readAsText(file);
    })
  }

  update() {
    let lines = this.drawbotCommands();
    // let { minX, maxX, minY, maxY } = extents(lines);
    // minX = InputLength.display(minX);
    // maxX = InputLength.display(maxX);
    // minY = InputLength.display(minY);
    // maxY = InputLength.display(maxY);
    // this.infoBox.innerText = `${lines.length} draw commands.\nExtents: x: [${minX}, ${maxX}], y: [${minY}, ${maxY}]`;
    bus.emit('preview', { lines });
  }

  submit = (ev) => {
    ev.preventDefault();
    let commands = this.drawbotCommands();
    this.dispatchEvent(new CustomEvent('draw', { detail: { commands } }));
  }

  drawbotCommands() {
    return svgToDrawbot(this.svgPath, this.svgScale * this.userScale, this.translation);
  }
}

customElements.define('svg-draw', SVGDraw);

function extents(steps) {
  let minX = 0, maxX = 0, minY = 0, maxY = 0;
  let i = 0;
  for (let t of steps) {
    if (i == 0) {
      minX = maxX = t.x;
      minY = maxY = t.y;
    }
    i++;
    minX = Math.min(minX, t.x);
    maxX = Math.max(maxX, t.x);
    minY = Math.min(minY, t.y);
    maxY = Math.max(maxY, t.y);
  };
  return { minX, maxX, minY, maxY };
}
