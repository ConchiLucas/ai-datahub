package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
)

type CreateSkillReq struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Code        string `json:"code"`
	Language    string `json:"language" binding:"required"`
	Service     string `json:"service"`
}

type UpdateSkillReq struct {
	ID          uint   `json:"id" binding:"required"`
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Code        string `json:"code"`
	Language    string `json:"language" binding:"required"`
	Service     string `json:"service"`
}

type ToggleSkillStarReq struct {
	ID      uint `json:"id" binding:"required"`
	Starred bool `json:"starred"`
}

type SearchSkillParams struct {
	request.PageInfo
	Service  string `json:"service" form:"service"`
	Language string `json:"language" form:"language"`
	Keyword  string `json:"keyword" form:"keyword"`
}
