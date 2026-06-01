package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
)

type CreateScriptReq struct {
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Language    string   `json:"language" binding:"required"`
	Code        string   `json:"code"`
	Tags        []string `json:"tags"`
}

type UpdateScriptReq struct {
	ID          uint     `json:"id" binding:"required"`
	Title       string   `json:"title" binding:"required"`
	Description string   `json:"description"`
	Language    string   `json:"language" binding:"required"`
	Code        string   `json:"code"`
	Tags        []string `json:"tags"`
}

type SearchScriptParams struct {
	request.PageInfo
	Language string `json:"language" form:"language"`
	Keyword  string `json:"keyword" form:"keyword"`
}
