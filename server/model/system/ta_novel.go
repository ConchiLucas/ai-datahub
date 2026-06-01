package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaNovel struct {
	global.GVA_MODEL
	UserId      uint             `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Title       string           `json:"title" gorm:"column:title;type:varchar(255);not null;comment:小说标题"`
	Author      string           `json:"author" gorm:"column:author;type:varchar(255);comment:作者"`
	Cover       string           `json:"cover" gorm:"column:cover;type:varchar(255);comment:封面配置"`
	Description string           `json:"description" gorm:"column:description;type:text;comment:简介"`
	Chapters    []TaNovelChapter `json:"chapters" gorm:"foreignKey:NovelId;references:ID"`
}

func (TaNovel) TableName() string { return "ta_novel" }
