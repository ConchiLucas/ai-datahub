package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaAiNote struct {
	global.GVA_MODEL
	Title      string `json:"title" gorm:"column:title;type:varchar(200);not null;comment:笔记标题"`
	Content    string `json:"content" gorm:"column:content;type:text;not null;comment:笔记内容"`
	WordCount  int    `json:"wordCount" gorm:"column:word_count;type:int;not null;default:0;comment:笔记字数"`
	Tags       string `json:"tags" gorm:"column:tags;type:varchar(500);comment:笔记标签（逗号分隔）"`
	NotebookId uint   `json:"notebookId" gorm:"column:notebook_id;index;comment:笔记本 ID（外键）"`
	IsFavorite int    `json:"isFavorite" gorm:"column:is_favorite;type:int;not null;default:0;comment:是否收藏（0-否，1-是）"`
	ClientId   string `json:"clientId" gorm:"column:client_id;type:varchar(100);index;comment:客户端唯一标识（用于防止重复创建）"`
	Version    int    `json:"version" gorm:"column:version;type:int;not null;default:1;comment:版本号（每次更新+1）"`
}

func (TaAiNote) TableName() string {
	return "ta_ai_note"
}
