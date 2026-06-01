package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
)

type TaSearchErrorParams struct {
	request.PageInfo
	FilterSeverity string `json:"filterSeverity" form:"filterSeverity"` // 'critical' | 'major' | 'minor' | 'all'
	FilterModel    string `json:"filterModel" form:"filterModel"`       // 'chatgpt' | 'claude' | 'gemini' | 'copilot' | 'cursor' | 'other' | 'all'
	FilterProject  string `json:"filterProject" form:"filterProject"`   // project name or 'all'
	SearchQuery    string `json:"searchQuery" form:"searchQuery"`       // For fuzzy title, description search
}

type TaCreateErrorReq struct {
	Title         string `json:"title" binding:"required"`
	Project       string `json:"project"`
	Scenario      string `json:"scenario"`
	WrongOutput   string `json:"wrongOutput"`
	CorrectAnswer string `json:"correctAnswer"`
	Model         string `json:"model" binding:"required"`
	Severity      string `json:"severity" binding:"required"`
}

type TaUpdateErrorReq struct {
	ID            uint   `json:"id" binding:"required"`
	Title         string `json:"title"`
	Project       string `json:"project"`
	Scenario      string `json:"scenario"`
	WrongOutput   string `json:"wrongOutput"`
	CorrectAnswer string `json:"correctAnswer"`
	Model         string `json:"model"`
	Severity      string `json:"severity"`
}

type TaErrorResponse struct {
	system.TaError
	CreatedAtStr string `json:"createdAt"`
	UpdatedAtStr string `json:"updatedAt"`
}
