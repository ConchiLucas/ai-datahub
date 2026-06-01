package system

import (
	"github.com/conchi/ai-note/server/global"
)

// TaLearningItem 学习记录主表
type TaLearningItem struct {
	global.GVA_MODEL
	UserId      uint                `json:"userId" gorm:"column:user_id;comment:归属用户;index"`
	Title       string              `json:"title" gorm:"column:title;comment:标题;type:varchar(255)"`
	Description string              `json:"description" gorm:"column:description;comment:描述;type:text"`
	Url         string              `json:"url" gorm:"column:url;comment:学习资源外链;type:varchar(1024)"`
	Category    string              `json:"category" gorm:"column:category;comment:分类(video/article/course/book/other);type:varchar(50)"`
	Tag         string              `json:"tag" gorm:"column:tag;comment:自定义标签;type:varchar(100)"`
	Status      string              `json:"status" gorm:"column:status;comment:状态(todo/in_progress/done);type:varchar(50)"`
	Chapters    []TaLearningChapter `json:"chapters" gorm:"foreignKey:ItemId;references:ID"`
	Notes       []TaLearningNote    `json:"notes" gorm:"foreignKey:ItemId;references:ID"`
}

func (TaLearningItem) TableName() string {
	return "ta_learning_item"
}

// TaLearningChapter 学习记录的章节
type TaLearningChapter struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;comment:归属用户;index"`
	ItemId    uint   `json:"itemId" gorm:"column:item_id;comment:归属学习项;index"`
	Title     string `json:"title" gorm:"column:title;comment:章节标题;type:varchar(255)"`
	SortOrder int    `json:"order" gorm:"column:sort_order;comment:排序序数"`
	Completed bool   `json:"completed" gorm:"column:completed;comment:是否已完成"`
}

func (TaLearningChapter) TableName() string {
	return "ta_learning_chapter"
}

// TaLearningNote 学习记录的笔记
type TaLearningNote struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;comment:归属用户;index"`
	ItemId    uint   `json:"itemId" gorm:"column:item_id;comment:归属学习项;index"`
	ChapterId uint   `json:"chapterId" gorm:"column:chapter_id;comment:该笔记对应的章节ID(可选);index"`
	Content   string `json:"content" gorm:"column:content;comment:笔记内容;type:text"`
}

func (TaLearningNote) TableName() string {
	return "ta_learning_note"
}
