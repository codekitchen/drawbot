import './svg_draw.js'
import './visual.js'
import './joystick.js'
import { Inch, MM, InputLength } from './input_length.js'
import { bus } from './message_bus.js';

InputLength.mode = Inch;

document.querySelectorAll('#unit-selector input').forEach((el) => {
  el.addEventListener('change', (ev) => {
    InputLength.mode = el.value == 'mm' ? MM : Inch;
  })
})

server.connect((msg) => {
  console.log('received', msg)
  if (msg.command === 'status') {
    document.querySelector('#startd').value = msg.d.toFixed(0)
    document.querySelector('#startx').value = msg.x.toFixed(2)
    document.querySelector('#starty').value = msg.y.toFixed(2)
    document.querySelector('#starth').value = msg.h.toFixed(2)
    bus.emit('bot-status', msg);
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

bus.on('move-to', ({ detail }) => {
  server.send({"command": "moveTo", "x": detail.x, "y": detail.y})
})

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

bus.on('pen-up', () => {
  server.send({"command": "moveTo", "x": +startx.value, "y": +starty.value, "pen": false})
})
bus.on('pen-down', () => {
  server.send({"command": "moveTo", "x": +startx.value, "y": +starty.value, "pen": true})
})
