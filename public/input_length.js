import { bus } from './message_bus.js';

const template = document.createElement('template');
template.innerHTML = String.raw`
  <input type="number" step="any" /> <span>mm</span>
`;

export const Inch = 'in';
export const MM = 'mm';

const InchToMM = 25.4;

export class InputLength extends HTMLElement {
  static _mode = MM;
  #value = 0; // always in mm

  constructor() {
    super();
    this.mode = InputLength.mode;
    this.attachShadow({ mode: 'open' });
  }

  static get mode() {
    return InputLength._mode;
  }

  static set mode(mode) {
    InputLength._mode = mode;
    bus.emit('length-mode', { mode });
  }

  static display(val_in_mm) {
    let val = val_in_mm;
    if (InputLength.mode === Inch)
      val /= InchToMM;
    return (val|0)==val ? val : val.toFixed(2);
  }

  connectedCallback() {
    bus.on('length-mode', this.changeMode);
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.input = this.shadowRoot.querySelector('input');
    // set default value
    this.value = +this.getAttribute('value');
    this.input.oninput = (ev) => {
      let val = +this.input.value;
      if (this.mode === Inch)
        val *= InchToMM;
      this.#value = val;
    }
  }

  disconnectedCallback() {
    bus.off('length-mode', this.changeMode);
  }

  get name() {
    return this.getAttribute('name');
  }

  // always returns mm
  get value() {
    return this.#value;
  }

  set value(val) {
    this.#value = val;
    if (this.mode === Inch)
      val /= InchToMM;
    this.input.value = (val|0)==val ? val : val.toFixed(2);
  }

  changeMode = ({ detail: { mode } }) => {
    this.mode = mode;
    this.value = this.#value;
    this.shadowRoot.querySelector('span').innerText = mode;
  }
}

customElements.define('input-length', InputLength);
