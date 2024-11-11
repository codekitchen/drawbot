const server = document.querySelector('server-connection');
server.connect((msg) => {
  console.log('received', msg)
  if (msg.command === 'status') {
    document.querySelector('#startd').value = msg.d.toFixed(0)
    document.querySelector('#startx').value = msg.x.toFixed(2)
    document.querySelector('#starty').value = msg.y.toFixed(2)
  }
})

let setupForm = document.querySelector('form#setup')
setupForm.addEventListener("submit", (event) => {
  console.log('submitting setup form')
  event.preventDefault();
  let msg = {"command": "reset"}
  for (let v of setupForm) {
    msg[v.name] = +v.value
  }
  server.send(msg)
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
  server.send(msg)
  console.log('sent test data', msg)
});

document.querySelector('#triforce').addEventListener('click', () => {
  let startx = +document.querySelector('#startx').value
  let starty = +document.querySelector('#starty').value
  server.send({"command": "moveTo", "x": startx+75, "y": starty+150})
  server.send({"command": "moveTo", "x": startx, "y": starty+300})
  server.send({"command": "moveTo", "x": startx-75, "y": starty+150})
  server.send({"command": "moveTo", "x": startx+75, "y": starty+150})
  server.send({"command": "moveTo", "x": startx+150, "y": starty+300})
  server.send({"command": "moveTo", "x": startx-150, "y": starty+300})
  server.send({"command": "moveTo", "x": startx, "y": starty})
})
