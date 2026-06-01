package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
)

type CreateCodeReq struct {
	Feature     string `json:"feature" binding:"required"`
	Language    string `json:"language" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Code        string `json:"code"`
}

type UpdateCodeReq struct {
	ID          uint   `json:"id" binding:"required"`
	Feature     string `json:"feature" binding:"required"`
	Language    string `json:"language" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Code        string `json:"code"`
}

type SearchCodeParams struct {
	request.PageInfo
	Feature string `json:"feature" form:"feature"`
	Keyword string `json:"keyword" form:"keyword"`
}
