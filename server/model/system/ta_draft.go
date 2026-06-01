package system

import "github.com/conchi/ai-note/server/global"

// TaDraft 草稿便签模型
type TaDraft struct {
	global.GVA_MODEL
	UserId  uint   `json:"userId" gorm:"column:user_id;comment:归属用户ID"`
	Title   string `json:"title" gorm:"column:title;comment:标题"`
	Content string `json:"content" gorm:"column:content;type:text;comment:内容"`
	Pinned  bool   `json:"pinned" gorm:"column:pinned;comment:是否置顶"`
	Starred bool   `json:"starred" gorm:"column:starred;comment:是否收藏"`
	Color   string `json:"color" gorm:"column:color;comment:卡片颜色"`
}

// TableName 表名
func (TaDraft) TableName() string {
	return "ta_draft"
}
