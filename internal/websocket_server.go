package internal

import (
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
)

type WebsocketServer struct {
}

func NewServer() *WebsocketServer {
	return &WebsocketServer{}
}

func (s *WebsocketServer) Stop() {
}

func (s WebsocketServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{})
	if err != nil {
		slog.Debug("failed to accept websocket", "err", err)
		return
	}
	defer func() { _ = ws.CloseNow() }()

	slog.Debug("accepted websocket", "conn", r.RemoteAddr)

	for {
		_, bmsg, err := ws.Read(ctx)
		if err != nil {
			slog.Debug("ws error", "err", err)
			break
		}
		msg := string(bmsg)
		if msg == "test" {
			TestGPIO()
		}
	}
}
