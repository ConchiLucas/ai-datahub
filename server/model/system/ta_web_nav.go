package system

import (
	"github.com/conchi/ai-note/server/global"
)

type TaWebNavCategory struct {
	global.GVA_MODEL
	UserId   uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	Name     string `json:"name" gorm:"column:name;type:varchar(50);not null;index;comment:分类名称"`
	Sort     int    `json:"sort" gorm:"column:sort;type:int;not null;default:0;comment:排序权重"`
}

func (TaWebNavCategory) TableName() string { return "ta_web_nav_category" }

type TaWebNavSite struct {
	global.GVA_MODEL
	UserId     uint   `json:"userId" gorm:"column:user_id;not null;default:1;index;comment:用户ID"`
	CategoryId uint   `json:"categoryId" gorm:"column:category_id;index;comment:所属分类ID"`
	Title      string `json:"title" gorm:"column:title;type:varchar(100);not null;comment:网站名称"`
	Desc       string `json:"desc" gorm:"column:desc;type:varchar(255);comment:网站描述"`
	Url        string `json:"url" gorm:"column:url;type:varchar(500);not null;comment:网址"`
	IconPath   string `json:"iconPath" gorm:"column:icon_path;type:text;comment:上传的logo图或者系统默认图标代号(例如openai,github)"`
	IsNew      bool   `json:"isNew" gorm:"column:is_new;default:false;comment:是否带有New标识"`
	Stars      int    `json:"stars" gorm:"column:stars;type:int;default:0;comment:星标数量(暂未使用)"`
	Views      int    `json:"views" gorm:"column:views;type:int;default:0;comment:浏览量(暂未使用)"`
	Accounts   string `json:"accounts" gorm:"column:accounts;type:text;comment:账号信息的JSON数组"`
}

func (TaWebNavSite) TableName() string { return "ta_web_nav_site" }
