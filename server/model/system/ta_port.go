package system

import "github.com/conchi/ai-note/server/global"

// TaPort 端口记录模型
type TaPort struct {
	global.GVA_MODEL
	UserId      uint   `json:"userId" gorm:"column:user_id;index;comment:用户ID"`
	HostName    string `json:"hostName" gorm:"column:host_name;comment:冗余主机名"`
	HostType    string `json:"hostType" gorm:"column:host_type;comment:冗余主机类型"`
	Port        int    `json:"port" gorm:"column:port;comment:端口号"`
	Protocol    string `json:"protocol" gorm:"column:protocol;comment:协议"`
	Application string `json:"application" gorm:"column:application;comment:应用服务"`
	Status      string `json:"status" gorm:"column:status;comment:状态"`
	Description string `json:"description" gorm:"column:description;comment:描述"`
}

// TableName 表名
func (TaPort) TableName() string {
	return "ta_port"
}
