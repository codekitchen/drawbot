import { parseSVG, makeAbsolute } from './svg-path-parser/index.js'

const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
  </style>
  <form id="draw-svg">
    <label>
      SVG:
      <input type="file" name="svg" id="svg-file" accept=".svg" />
    </label>
    <label>
      Scale:
      <input type="number" id="svg-scale" name="scale" step="any" value="1" />
    </label>
    <pre id="svg-info"></pre>
    <input type="submit" value="draw" />
  </form>
`;

class SVGDraw extends HTMLElement {
  constructor() {
    super();
    this.commands = [];
    this.scale = 1.0;
    this.translation = { x: 0, y: 0 };
    this.attachShadow({ mode: 'open' });
  }

  changeStart(x, y) {
    this.translation.x = x;
    this.translation.y = y;
    this.update();
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.svgForm = this.shadowRoot.querySelector('form#draw-svg')
    this.svgFile = this.shadowRoot.querySelector('#svg-file')
    this.infoBox = this.shadowRoot.querySelector('#svg-info')
    this.update();

    this.svgForm.addEventListener("submit", this.submit)

    this.shadowRoot.querySelector('#svg-scale').oninput = (ev) => {
      this.scale = ev.target.valueAsNumber;
      this.update();
    }
    this.svgFile.addEventListener('change', (ev) => {
      this.commands = [];
      let file = ev.target.files[0];
      if (!file) return;
      let reader = new FileReader();
      reader.onload = (ev) => {
        let svgStr = ev.target.result;
        const parser = new DOMParser();
        const svg = parser.parseFromString(svgStr, "image/svg+xml");
        const pathNode = svg.querySelector('path');
        if (!pathNode) {
          this.infoBox.innerText = 'No path element found';
          return;
        }
        const path = pathNode.getAttribute('d');
        this.commands = makeAbsolute(parseSVG(path));
        this.update();
      }
      reader.readAsText(file);
    })
  }

  update() {
    let minX = 0, maxX = 0, minY = 0, maxY = 0;
    let i = 0;
    for (let cmd of this.commands) {
      const t = this.t(cmd);
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
    this.infoBox.innerText = `${this.commands.length} draw commands.\nExtents: x: [${minX}, ${maxX}], y: [${minY}, ${maxY}]`;
  }

  t({ x, y }) {
    return {
      x: x * this.scale + this.translation.x,
      y: y * this.scale + this.translation.y,
    }
  }

  submit = (ev) => {
    ev.preventDefault();
    let commands;
    try {
      commands = this.svgToDrawbot();
    } catch (e) {
      this.infoBox.innerText = e.message;
      throw e;
    }
    this.dispatchEvent(new CustomEvent('draw', { detail: { commands } }));
  }

  svgToDrawbot() {
    let drawCommands = [];
    for (let p of this.commands) {
      switch (p.code) {
        case 'M':
          drawCommands.push({ command: 'moveTo', pen: false, ...this.t(p) });
          break;
        case 'L':
        case 'H':
        case 'V':
        case 'Z':
          // makeAbsolute lets us treat these all the same
          drawCommands.push({ command: 'moveTo', pen: true, ...this.t(p) });
          break;
        default:
          throw new Error(`don't know command: ${p.code}`)
      }
    }
    return drawCommands;
  }

}

customElements.define('svg-draw', SVGDraw);

