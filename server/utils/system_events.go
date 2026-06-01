package utils

import (
	"sync"
)

type SystemEvents struct {
	reloadHandlers []func() error
	mu             sync.RWMutex
}

var GlobalSystemEvents = &SystemEvents{}

func (e *SystemEvents) RegisterReloadHandler(handler func() error) {
	e.mu.Lock()
	defer e.mu.Unlock()
	e.reloadHandlers = append(e.reloadHandlers, handler)
}

func (e *SystemEvents) TriggerReload() error {
	e.mu.RLock()
	defer e.mu.RUnlock()
	
	for _, handler := range e.reloadHandlers {
		if err := handler(); err != nil {
			return err
		}
	}
	return nil
}
