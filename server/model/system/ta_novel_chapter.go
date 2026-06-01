package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaNovelChapter struct {
	global.GVA_MODEL
	UserId       uint    `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	NovelId      uint    `json:"novelId" gorm:"column:novel_id;not null;index;comment:所属小说ID"`
	Title        string  `json:"title" gorm:"column:title;type:varchar(255);not null;comment:章节标题"`
	Order        int     `json:"order" gorm:"column:sort_order;not null;comment:章节排序"`
	WordCount    int     `json:"wordCount" gorm:"column:word_count;not null;default:0;comment:字数"`
	Content      string  `json:"content" gorm:"column:content;type:text;comment:章节内容"`
	QwenScore    float64 `json:"qwenScore" gorm:"column:qwen_score;type:decimal(10,2);default:0;comment:Qwen评分"`
	GlmScore     float64 `json:"glmScore" gorm:"column:glm_score;type:decimal(10,2);default:0;comment:GLM评分"`
	KimiScore    float64 `json:"kimiScore" gorm:"column:kimi_score;type:decimal(10,2);default:0;comment:Kimi评分"`
	MinimaxScore float64 `json:"minimaxScore" gorm:"column:minimax_score;type:decimal(10,2);default:0;comment:Minimax评分"`
	Summary      string  `json:"summary" gorm:"column:summary;type:text;comment:AI概要"`
	Diffs        string  `json:"diffs" gorm:"column:diffs;type:text;comment:AI魔改重构内容"`
}

func (TaNovelChapter) TableName() string { return "ta_novel_chapter" }
