package request

import "github.com/conchi/ai-note/server/model/system"

type TaChangelogProjectReq struct {
	ID          uint   `json:"id"`
	Name        string `json:"name" binding:"required"`
	Description string `json:"description"`
}

type TaChangelogLogReq struct {
	ID          uint   `json:"id"`
	ProjectId   uint   `json:"projectId" binding:"required"`
	Version     string `json:"version"`
	Description string `json:"description" binding:"required"`
	ChangeType  string `json:"changeType" binding:"required"`
	Date        string `json:"date" binding:"required"`
	Details     string `json:"details"`
}

type TaSearchChangelogParams struct {
	Status      string `json:"status" form:"status"`
	SearchQuery string `json:"searchQuery" form:"searchQuery"` // Reserved for future global search
	Page        int    `json:"page" form:"page"`
	PageSize    int    `json:"pageSize" form:"pageSize"`
}

type TaChangelogProjectResponse struct {
	system.TaChangelogProject
	CreatedAtStr string `json:"createdAt"` // override date string format
}

// Overrides for response
type TaChangelogLogResponse struct {
	system.TaChangelogLog
}
