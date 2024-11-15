export class MessageBus {
  constructor(description = 'message bus') {
    this.bus = document.appendChild(document.createComment(description));
  }
  on(ev, cb) {
    this.bus.addEventListener(ev, cb);
  }
  off(ev, cb) {
    this.bus.removeEventListener(ev, cb);
  }
  emit(ev, detail) {
    return this.bus.dispatchEvent(new CustomEvent(ev, { detail }));
  }
}

export const bus = new MessageBus();
