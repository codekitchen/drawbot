const loc = window.location
const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:'
const url = `${protocol}//${loc.host}/ws`
let ws = new WebSocket(url)

let btn = document.getElementById('testbtn')
btn.onclick = () => {
  ws.send('test')
}
