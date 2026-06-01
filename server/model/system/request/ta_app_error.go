package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaSearchAppErrorParams struct {
	request.PageInfo
	Status      string `json:"status" form:"status"`           // 'unsolved' | 'solved' | 'all'
	SearchQuery string `json:"searchQuery" form:"searchQuery"` // For fuzzy title, description search
}

type TaCreateAppErrorReq struct {
	Title        string `json:"title" binding:"required"`
	ErrorMessage string `json:"errorMessage" binding:"required"`
	Solution     string `json:"solution"`
	Status       string `json:"status" binding:"required"`
	Severity     string `json:"severity" binding:"required"`
	Tag          string `json:"tag"`
}

type TaUpdateAppErrorReq struct {
	ID           uint   `json:"id" binding:"required"`
	Title        string `json:"title"`
	ErrorMessage string `json:"errorMessage"`
	Solution     string `json:"solution"`
	Status       string `json:"status"`
	Severity     string `json:"severity"`
	Tag          string `json:"tag"`
}

type TaUpdateErrorStatusReq struct {
	ID     uint   `json:"id" binding:"required"`
	Status string `json:"status" binding:"required"`
}

type TaAppErrorResponse struct {
	system.TaAppError
	UpdatedAtStr string `json:"updatedAt"` // Formatted date string for the frontend
}
