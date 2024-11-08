package internal

import (
	"context"
	"encoding/json"
	"log/slog"
	"net/http"

	"github.com/coder/websocket"
)

const configPath = "drawbot.json"

type WebsocketServer struct {
	mc *MotorController
}

func NewServer() *WebsocketServer {
	mc, err := LoadMotorController(configPath)
	if err != nil {
		slog.Debug("failed to load motor controller", "err", err)
		mc = NewMotorController()
	}
	return &WebsocketServer{
		mc: mc,
	}
}

func (s *WebsocketServer) Stop() {
}

func (s WebsocketServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	ws, err := websocket.Accept(w, r, &websocket.AcceptOptions{
		InsecureSkipVerify: true,
	})
	if err != nil {
		slog.Debug("failed to accept websocket", "err", err)
		return
	}
	defer func() { _ = ws.CloseNow() }()

	slog.Debug("accepted websocket", "conn", r.RemoteAddr)

	err = s.writeStatus(ctx, ws)
	if err != nil {
		slog.Debug("write error", "err", err)
		return
	}

	for {
		_, bmsg, err := ws.Read(ctx)
		if err != nil {
			slog.Debug("ws error", "err", err)
			return
		}
		var cmd Command
		err = json.Unmarshal(bmsg, &cmd)
		if err != nil {
			slog.Debug("json error", "err", err)
			return
		}
		s.mc.Do(cmd)

		err = SaveMotorController(s.mc, configPath)
		if err != nil {
			slog.Debug("config error", "err", err)
			return
		}

		err = s.writeStatus(ctx, ws)
		if err != nil {
			slog.Debug("write error", "err", err)
			return
		}
	}
}

func (s *WebsocketServer) writeStatus(ctx context.Context, ws *websocket.Conn) error {
	res := &Command{
		Command: "status",
		D:       s.mc.D,
		X:       s.mc.X,
		Y:       s.mc.Y,
	}
	resBytes, err := json.Marshal(res)
	if err != nil {
		return err
	}
	err = ws.Write(ctx, websocket.MessageText, resBytes)
	if err != nil {
		return err
	}
	return nil
}
