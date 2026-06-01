package system

import "github.com/conchi/ai-note/server/global"

type TaProgressProject struct {
	global.GVA_MODEL
	UserId      uint                `json:"userId" gorm:"index;comment:用户ID"`
	Name        string              `json:"name" gorm:"comment:项目名称"`
	Description string              `json:"description" gorm:"type:text;comment:项目描述"`
	Sort        int                 `json:"sort" gorm:"default:0;comment:排序号"`
	Features    []TaProgressFeature `json:"features" gorm:"foreignKey:ProjectId;references:ID;constraint:OnDelete:CASCADE;"`
}

func (TaProgressProject) TableName() string {
	return "ta_progress_projects"
}

type TaProgressFeature struct {
	global.GVA_MODEL
	UserId      uint                 `json:"userId" gorm:"index;comment:用户ID"`
	ProjectId   uint                 `json:"projectId" gorm:"index;comment:项目ID"`
	ParentId    uint                 `json:"parentId" gorm:"default:0;index;comment:父功能ID，0表示顶级"`
	Name        string               `json:"name" gorm:"comment:功能名称"`
	Status      string               `json:"status" gorm:"type:varchar(50);comment:状态(todo, in_progress, done)"`
	Progress    int                  `json:"progress" gorm:"comment:进度 (0-100)"`
	Priority    string               `json:"priority" gorm:"type:varchar(50);comment:优先级 (high, medium, low)"`
	Description string               `json:"description" gorm:"type:text;comment:详细描述"`
	Sort        int                  `json:"sort" gorm:"default:0;comment:排序号"`
	Children    []TaProgressFeature  `json:"children" gorm:"-"`
}

func (TaProgressFeature) TableName() string {
	return "ta_progress_features"
}
