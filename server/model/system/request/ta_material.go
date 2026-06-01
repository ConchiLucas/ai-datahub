package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaSearchMaterialParams struct {
	request.PageInfo
	FilterType  string `json:"filterType" form:"filterType"`   // 'image' | 'prompt' | 'video' | 'copywriting' | 'all'
	FilterTag   string `json:"filterTag" form:"filterTag"`     // 具体标签名 or empty
	SearchQuery string `json:"searchQuery" form:"searchQuery"` // 模糊搜索
}

type TaCreateMaterialReq struct {
	Title       string              `json:"title" binding:"required"`
	Type        string              `json:"type" binding:"required"`
	Content     string              `json:"content" binding:"required"`
	Tags        system.MaterialTags `json:"tags"`
	Description string              `json:"description"`
}

type TaUpdateMaterialReq struct {
	ID          uint                `json:"id" binding:"required"`
	Title       string              `json:"title"`
	Type        string              `json:"type"`
	Content     string              `json:"content"`
	Tags        system.MaterialTags `json:"tags"`
	Description string              `json:"description"`
}

type TaMaterialResponse struct {
	system.TaMaterial
	CreatedAtStr string `json:"createdAt"`
	UpdatedAtStr string `json:"updatedAt"`
}
