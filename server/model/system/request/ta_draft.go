package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
)

type TaDraftSearch struct {
	request.PageInfo
	Keyword string `json:"keyword" form:"keyword"` // 搜索内容或者标题
	Starred *bool  `json:"starred" form:"starred"` // 按收藏筛选
}
