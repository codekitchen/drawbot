const template = document.createElement('template');
template.innerHTML = String.raw`
  <style>
    #status {
      padding: 0 1em;
      color: white;
    }
    #status.connecting {
      background-color: darkred;
    }
    #status.connected {
      background-color: darkblue;
    }
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
    this.statusDiv.classList.add('connecting');
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

  send(msg) {
    this.ws.send(JSON.stringify(msg))
  }

  serverClose = () => {
    this.statusDiv.classList.remove('connected');
    this.statusDiv.classList.add('connecting');
    setTimeout(this.connect.bind(this), 1000);
  }

  serverOpen = () => {
    this.statusDiv.classList.remove('connecting');
    this.statusDiv.classList.add('connected');
    this.statusDiv.innerText = 'Connected'
  }

  serverMessage = (event) => {
    this.onmessage(JSON.parse(event.data))
  }
}

customElements.define('server-connection', ServerConnection);
