import './svg_draw.js'
import { Inch, MM, InputLength } from './input_length.js'

InputLength.mode = Inch;

server.connect((msg) => {
  console.log('received', msg)
  if (msg.command === 'status') {
    document.querySelector('#startd').value = msg.d.toFixed(0)
    document.querySelector('#startx').value = msg.x.toFixed(2)
    document.querySelector('#starty').value = msg.y.toFixed(2)
    svg_draw.changeStart(msg.x, msg.y);
  }
})

svg_draw.addEventListener('draw', (ev) => {
  console.log('drawing svg', ev);
  const commands = ev.detail.commands;
  for (let cmd of commands) {
    server.send(cmd);
  }
})

let setupForm = document.querySelector('form#setup')
setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let msg = {"command": "reset"}
  for (let v of setupForm.querySelectorAll('input-length')) {
    msg[v.name] = +v.value
  }
  console.log('sending setup data', msg)
  server.send(msg)
});

let testForm = document.querySelector('form#moveto')
testForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let msg = {"command": "moveTo"}
  for (let v of testForm.querySelectorAll('input-length')) {
    msg[v.name] = +v.value
  }
  console.log('sending moveto data', msg)
  server.send(msg)
});

let stringForm = document.querySelector('#xy-from-strings')
stringForm.addEventListener("submit", (event) => {
  event.preventDefault();
  let leftString = left_string.value
  let rightString = right_string.value
  let d = startd.value
  let a1 = Math.acos(Math.sqrt((Math.pow(d, 2)+Math.pow(leftString, 2)-Math.pow(rightString,2)) / (2 * d * leftString)))
  let a = Math.PI / 2 - a1
  let x = Math.cos(a) * leftString
  let y = Math.sin(a) * leftString
  startx.value = x.toFixed(2)
  starty.value = y.toFixed(2)
});

document.querySelector('#pen-up').addEventListener('click', () => {
  server.send({"command": "moveTo", "x": +startx.value, "y": +starty.value, "pen": false})
})
document.querySelector('#pen-down').addEventListener('click', () => {
  server.send({"command": "moveTo", "x": +startx.value, "y": +starty.value, "pen": true})
})
