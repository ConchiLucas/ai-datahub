package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaDirectory struct {
	global.GVA_MODEL
	Name     string `json:"name" gorm:"column:name;type:varchar(100);not null;comment:目录名称"`
	Type     string `json:"type" gorm:"column:type;type:varchar(20);not null;index;comment:目录类型：note-笔记管理，file-文件管理"`
	UserId   uint   `json:"userId" gorm:"column:user_id;index;comment:所属用户 ID"`
	ParentId *uint  `json:"parentId" gorm:"column:parent_id;index;comment:父目录 ID，顶级目录为 NULL"`
	SortNum  int    `json:"sortNum" gorm:"column:sort_num;type:int;not null;default:0;index;comment:排序号，用于前端展示顺序"`
}

func (TaDirectory) TableName() string {
	return "ta_directory"
}
