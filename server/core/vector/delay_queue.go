package vector

import (
	"sync"
	"time"
)

type NoteTask struct {
	NoteId  uint   `json:"noteId"`
	Title   string `json:"title"`
	Content string `json:"content"`
	Version int    `json:"version"`
}

type DelayQueue struct {
	tasks map[uint]*time.Timer
	data  map[uint]NoteTask
	mu    sync.Mutex
	delay time.Duration
	run   func(task NoteTask)
}

// NewDelayQueue 创建基于内存的防抖延迟队列
func NewDelayQueue(delay time.Duration, runFunc func(NoteTask)) *DelayQueue {
	return &DelayQueue{
		tasks: make(map[uint]*time.Timer),
		data:  make(map[uint]NoteTask),
		delay: delay,
		run:   runFunc,
	}
}

// Push 投递任务，如果在 delay 时间内重复投递，则重置计时器
func (q *DelayQueue) Push(task NoteTask) {
	q.mu.Lock()
	defer q.mu.Unlock()

	// 更新最新数据
	q.data[task.NoteId] = task

	// 如果存在旧定时器，立刻停止
	if timer, exists := q.tasks[task.NoteId]; exists {
		timer.Stop()
	}

	// 设定新定时任务
	q.tasks[task.NoteId] = time.AfterFunc(q.delay, func() {
		q.execute(task.NoteId)
	})
}

func (q *DelayQueue) execute(noteId uint) {
	q.mu.Lock()
	task, exists := q.data[noteId]
	if !exists {
		q.mu.Unlock()
		return
	}
	// 清理追踪
	delete(q.data, noteId)
	delete(q.tasks, noteId)
	q.mu.Unlock()

	// 执行任务
	q.run(task)
}
