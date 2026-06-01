package request

import (
	"github.com/conchi/ai-note/server/model/common/request"
)

type Register struct {
	Username    string `json:"userName" example:"用户名"`
	Password    string `json:"password" example:"密码"`
	NickName    string `json:"nickName" example:"昵称"`
	HeaderImg   string `json:"headerImg" example:"头像链接"`
	AuthorityId uint   `json:"authorityId" default:"111" example:"角色ID"`
	Enable      int    `json:"enable" example:"是否启用"`
	Phone       string `json:"phone" example:"电话号码"`
	Email       string `json:"email" example:"电子邮箱"`
}

type Login struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

type ChangePasswordReq struct {
	ID          uint   `json:"-"`
	Password    string `json:"password"`
	NewPassword string `json:"newPassword"`
}

type ChangeUserInfo struct {
	ID        uint   `gorm:"primarykey"`
	NickName  string `json:"nickName" gorm:"default:系统用户;comment:用户昵称"`
	Phone     string `json:"phone"  gorm:"comment:用户手机号"`
	Email     string `json:"email"  gorm:"comment:用户邮箱"`
	HeaderImg string `json:"headerImg" gorm:"default:https://qmplusimg.henrongyi.top/gva_header.jpg;comment:用户头像"`
	Enable    int    `json:"enable" gorm:"default:1;comment:用户是否被冻结 1正常 2冻结"`
}

type ResetPassword struct {
	ID       uint   `json:"id" form:"id"`
	Password string `json:"password" form:"password"`
}

type SetUserAuthority struct {
	ID          uint `json:"id" form:"id"`
	AuthorityId uint `json:"authorityId" form:"authorityId"`
}

type GetUserList struct {
	request.PageInfo
}
