const template = document.createElement('template');
template.innerHTML = `
  <style>
  </style>
  <div id="status">Server Connection</div>
`;

class ServerConnection extends HTMLElement {
  constructor() {
    super();
    this.onmessage = () => { };
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.shadowRoot.appendChild(template.content.cloneNode(true));
    this.statusDiv = this.shadowRoot.getElementById('status');
  }

  connect(messageCB) {
    if (messageCB !== undefined)
      this.onmessage = messageCB
    // const loc = window.location
    // const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:'
    // const url = `${protocol}//${loc.host}/ws`
    const url = `ws://drawbot.local/ws`
    this.ws = new WebSocket(url)
    this.statusDiv.innerText = 'Connecting...'
    this.ws.onclose = this.serverClose
    this.ws.onopen = this.serverOpen
    this.ws.onmessage = this.serverMessage
  }

  serverClose = () => {
    this.connect()
  }

  serverOpen = () => {
    this.statusDiv.innerText = 'Connected'
  }

  serverMessage = (event) => {
    this.onmessage(JSON.parse(event.data))
  }
}

customElements.define('server-connection', ServerConnection);
