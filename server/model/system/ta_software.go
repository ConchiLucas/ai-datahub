package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaSoftware struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId"      gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name        string `json:"name"        gorm:"column:name;type:varchar(255);not null;comment:软件名称"`
	Version     string `json:"version"     gorm:"column:version;type:varchar(64);comment:版本号"`
	Category    string `json:"category"    gorm:"column:category;type:varchar(64);comment:分类"`
	Platform    string `json:"platform"    gorm:"column:platform;type:varchar(64);comment:平台"`
	Description string `json:"description" gorm:"column:description;type:text;comment:描述"`
	FileUrl     string `json:"fileUrl"     gorm:"column:file_url;type:varchar(512);comment:文件存储URL"`
	FileName    string `json:"fileName"    gorm:"column:file_name;type:varchar(255);comment:原始文件名"`
	FileSize    int64  `json:"fileSize"    gorm:"column:file_size;comment:文件大小(bytes)"`
	IconUrl     string `json:"iconUrl"     gorm:"column:icon_url;type:varchar(512);comment:图标URL"`
}

func (TaSoftware) TableName() string { return "ta_software" }
