// const loc = window.location
// const protocol = loc.protocol === 'https:' ? 'wss:' : 'ws:'
// const url = `${protocol}//${loc.host}/ws`
const url = `ws://drawbot.local/ws`
let ws = new WebSocket(url)

ws.onmessage = (event) => {
  let msg = JSON.parse(event.data)
  console.log('received', msg)
  if (msg.command === 'status') {
    document.querySelector('#startd').value = msg.d
    document.querySelector('#startx').value = msg.x
    document.querySelector('#starty').value = msg.y
  }
}

let setupForm = document.querySelector('form#setup')
setupForm.addEventListener("submit", (event) => {
  console.log('submitting setup form')
  event.preventDefault();
  let msg = {"command": "reset"}
  for (let v of setupForm) {
    msg[v.name] = +v.value
  }
  ws.send(JSON.stringify(msg))
  console.log('sent setup data', msg)
});

let testForm = document.querySelector('form#runtest')
testForm.addEventListener("submit", (event) => {
  console.log('submitting test form')
  event.preventDefault();
  let msg = {"command": "moveTo"}
  for (let v of testForm) {
    msg[v.name] = +v.value
  }
  ws.send(JSON.stringify(msg))
  console.log('sent test data', msg)
});
