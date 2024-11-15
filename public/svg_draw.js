import { parseSVG, makeAbsolute } from './3rd-party/svg-path-parser/index.js'
import cubicCurve from './3rd-party/adaptive-bezier-curve.js'
import quadraticCurve from './3rd-party/adaptive-quadratic-curve.js'
import arcToBezier from './3rd-party/svg-arc-to-bezier.js';
import { InputLength } from './input_length.js';
import { bus } from './message_bus.js';

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
    bus.on('bot-status', ({ detail }) => this.changeStart(detail.x, detail.y));
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
    minX = InputLength.display(minX);
    maxX = InputLength.display(maxX);
    minY = InputLength.display(minY);
    maxY = InputLength.display(maxY);
    this.infoBox.innerText = `${this.commands.length} draw commands.\nExtents: x: [${minX}, ${maxX}], y: [${minY}, ${maxY}]`;
  }

  t(inp) {
    if (inp instanceof Array) {
      return this.t({ x: inp[0], y: inp[1] });
    }
    return {
      x: inp.x * this.scale + this.translation.x,
      y: inp.y * this.scale + this.translation.y,
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
    let prevCmd = { x: 0, y: 0, code: '' };
    let pts, cp;
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
        case 'C':
          pts = cubicCurve()([p.x0, p.y0], [p.x1, p.y1], [p.x2, p.y2], [p.x, p.y], 1);
          for (let pt of pts) {
            drawCommands.push({ command: 'moveTo', pen: true, ...this.t(pt) });
          }
          break;
        case 'S':
          cp = [p.x0, p.y0];
          if (isCurve(prevCmd)) {
            cp = [p.x0+(p.x0-prevCmd.x2), p.y0+(p.y0-prevCmd.y2)];
          }
          pts = cubicCurve()([p.x0, p.y0], cp, [p.x2, p.y2], [p.x, p.y], 1);
          for (let pt of pts) {
            drawCommands.push({ command: 'moveTo', pen: true, ...this.t(pt) });
          }
          break;
        case 'Q':
          pts = quadraticCurve()([p.x0, p.y0], [p.x1, p.y1], [p.x, p.y], 1);
          for (let pt of pts) {
            drawCommands.push({ command: 'moveTo', pen: true, ...this.t(pt) });
          }
          break;
        case 'T':
          cp = [p.x0, p.y0];
          if (isCurve(prevCmd)) {
            cp = [p.x0+(p.x0-prevCmd.x1), p.y0+(p.y0-prevCmd.y1)];
          }
          pts = quadraticCurve()([p.x0, p.y0], cp, [p.x, p.y], 1);
          for (let pt of pts) {
            drawCommands.push({ command: 'moveTo', pen: true, ...this.t(pt) });
          }
          break;
        case 'A':
          let curves = arcToBezier({ px: p.x0, py: p.y0, cx: p.x, cy: p.y, rx: p.rx, ry: p.ry, xAxisRotation: p.xAxisRotation, largeArcFlag: p.largeArc, sweepFlag: p.sweep });
          for (let curve of curves) {
            pts = cubicCurve()([p.x0, p.y0], [curve.x1, curve.y1], [curve.x2, curve.y2], [curve.x, curve.y], 1);
            for (let pt of pts) {
              drawCommands.push({ command: 'moveTo', pen: true, ...this.t(pt) });
            }
          }
          break;
        default:
          throw new Error(`don't know command: ${p.code}`)
      }
    }
    return drawCommands;
  }

}

customElements.define('svg-draw', SVGDraw);

function isCurve(cmd) {
  return cmd.code == 'C' || cmd.code == 'S' || cmd.code == 'Q' || cmd.code == 'T';
}