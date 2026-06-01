package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaSearchProductIdeaParams struct {
	request.PageInfo
	FilterPriority string `json:"filterPriority" form:"filterPriority"` // 'high' | 'medium' | 'low' | 'all'
	FilterProduct  string `json:"filterProduct" form:"filterProduct"`   // project name or 'all'
	SearchQuery    string `json:"searchQuery" form:"searchQuery"`       // For fuzzy title, description search
}

type TaCreateProductIdeaReq struct {
	Title       string           `json:"title" binding:"required"`
	Product     string           `json:"product"`
	Description string           `json:"description"`
	KeyPoints   system.KeyPoints `json:"keyPoints"`
	Notes       string           `json:"notes"`
	Priority    string           `json:"priority" binding:"required"`
}

type TaUpdateProductIdeaReq struct {
	ID          uint             `json:"id" binding:"required"`
	Title       string           `json:"title"`
	Product     string           `json:"product"`
	Description string           `json:"description"`
	KeyPoints   system.KeyPoints `json:"keyPoints"`
	Notes       string           `json:"notes"`
	Priority    string           `json:"priority"`
}

type TaProductIdeaResponse struct {
	system.TaProductIdea
	CreatedAtStr string `json:"createdAt"`
	UpdatedAtStr string `json:"updatedAt"`
}
