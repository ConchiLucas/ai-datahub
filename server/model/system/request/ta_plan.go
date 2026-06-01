package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaSearchPlanParams struct {
	request.PageInfo
	Priority string `json:"priority" form:"priority"`
	Status   string `json:"status" form:"status"` // e.g. "completed", "todo"
}

type TaCreatePlanReq struct {
	Title       string `json:"title" binding:"required"`
	Description string `json:"description"`
	Priority    string `json:"priority" binding:"required"`
	Progress    int    `json:"progress"`
}

type TaUpdatePlanReq struct {
	ID          uint   `json:"id" binding:"required"`
	Title       string `json:"title"`
	Description string `json:"description"`
	Priority    string `json:"priority"`
	Progress    int    `json:"progress"`
}

type TaUpdatePlanProgressReq struct {
	ID       uint `json:"id" binding:"required"`
	Progress int  `json:"progress" binding:"required"`
}

type TaPlanResponse struct {
	system.TaPlan
	CreatedAtStr string `json:"createdAt"` // Formatted date string for the frontend
}
