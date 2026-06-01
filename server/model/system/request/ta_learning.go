package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaLearningItemSearch struct {
	system.TaLearningItem
	request.PageInfo
}

type TaLearningChapterSearch struct {
	system.TaLearningChapter
	request.PageInfo
}

type TaLearningNoteSearch struct {
	system.TaLearningNote
	request.PageInfo
}

// 供前端更新章节状态的特化参数
type TaLearningChapterUpdateStatus struct {
	ID        uint `json:"id"`
	Completed bool `json:"completed"`
}
