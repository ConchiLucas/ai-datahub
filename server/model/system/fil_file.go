package system

import (
	"github.com/conchi/ai-note/server/global"
)

type FilFile struct {
	global.GVA_MODEL
	Name        string `json:"name" gorm:"column:name;type:varchar(255);not null;comment:名称"`
	IsDirectory int    `json:"isDirectory" gorm:"column:is_directory;type:int;not null;default:0;comment:是否为目录: 1=目录, 0=文件"`
	Type        string `json:"type" gorm:"column:type;type:varchar(20);not null;default:'other';comment:文件类型: image=图片, pdf=PDF, doc=文档, other=其他, directory=目录"`
	Extension   string `json:"extension" gorm:"column:extension;type:varchar(20);comment:文件后缀(如: jpg, png, pdf, docx)"`
	Size        int64  `json:"size" gorm:"column:size;type:bigint;not null;default:0;comment:文件大小(字节)"`
	Url         string `json:"url" gorm:"column:url;type:text;comment:文件URL/路径"`
	ParentId    *uint  `json:"parentId" gorm:"column:parent_id;index;comment:父级ID(根目录为null)"`
	Level       int    `json:"level" gorm:"column:level;type:int;not null;default:0;comment:层级深度(根目录为0)"`
	SortNum     int    `json:"sortNum" gorm:"column:sort_num;type:int;not null;default:0;comment:排序号(同层级内排序)"`
	Icon        string `json:"icon" gorm:"column:icon;type:varchar(50);comment:图标"`
	UserId      uint   `json:"userId" gorm:"column:user_id;index;comment:所属用户ID"`
}

func (FilFile) TableName() string {
	return "fil_file"
}
