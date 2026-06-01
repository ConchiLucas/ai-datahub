package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaNovelChapterSearch struct {
	system.TaNovelChapter
	request.PageInfo
}
