package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaNovelSearch struct {
	system.TaNovel
	request.PageInfo
}
