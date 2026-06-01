package system

import (
	"errors"
	"fmt"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common"
	"github.com/conchi/ai-note/server/model/common/request"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type UserService struct{}

func (userService *UserService) Register(u system.SysUser) (userInter system.SysUser, err error) {
	var user system.SysUser
	if !errors.Is(global.GVA_DB.Where("username = ?", u.Username).First(&user).Error, gorm.ErrRecordNotFound) {
		return userInter, errors.New("用户名已注册")
	}
	u.Password = utils.BcryptHash(u.Password)
	u.UUID = uuid.New()
	err = global.GVA_DB.Create(&u).Error
	return u, err
}

func (userService *UserService) Login(u *system.SysUser) (userInter *system.SysUser, err error) {
	if nil == global.GVA_DB {
		return nil, fmt.Errorf("db not init")
	}

	var user system.SysUser
	err = global.GVA_DB.Where("username = ?", u.Username).First(&user).Error
	if err == nil {
		if ok := utils.BcryptCheck(u.Password, user.Password); !ok {
			return nil, errors.New("密码错误")
		}
	}
	return &user, err
}

func (userService *UserService) ChangePassword(u *system.SysUser, newPassword string) (err error) {
	var user system.SysUser
	if err = global.GVA_DB.Where("id = ?", u.ID).First(&user).Error; err != nil {
		return err
	}
	if ok := utils.BcryptCheck(u.Password, user.Password); !ok {
		return errors.New("原密码错误")
	}
	u.Password = utils.BcryptHash(newPassword)
	err = global.GVA_DB.Select("password").Where("id = ?", u.ID).Updates(u).Error
	return err
}

func (userService *UserService) GetUserInfoList(info request.PageInfo) (list interface{}, total int64, err error) {
	limit := info.PageSize
	offset := info.PageSize * (info.Page - 1)
	db := global.GVA_DB.Model(&system.SysUser{})
	var userList []system.SysUser
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	err = db.Limit(limit).Offset(offset).Find(&userList).Error
	return userList, total, err
}

func (userService *UserService) SetUserInfo(req system.SysUser) error {
	return global.GVA_DB.Model(&system.SysUser{}).
		Select("updated_at", "nick_name", "header_img", "phone", "email", "enable").
		Where("id=?", req.ID).
		Updates(map[string]interface{}{
			"updated_at": time.Now(),
			"nick_name":  req.NickName,
			"header_img": req.HeaderImg,
			"phone":      req.Phone,
			"email":      req.Email,
			"enable":     req.Enable,
		}).Error
}

func (userService *UserService) SetSelfInfo(req system.SysUser) error {
	return global.GVA_DB.Model(&system.SysUser{}).
		Select("updated_at", "nick_name", "header_img", "phone", "email", "enable").
		Where("id=?", req.ID).
		Updates(map[string]interface{}{
			"updated_at": time.Now(),
			"nick_name":  req.NickName,
			"header_img": req.HeaderImg,
			"phone":      req.Phone,
			"email":      req.Email,
			"enable":     req.Enable,
		}).Error
}

func (userService *UserService) SetSelfSetting(req map[string]interface{}, id uint) error {
	return global.GVA_DB.Model(&system.SysUser{}).Where("id = ?", id).Update("origin_setting", common.JSONMap(req)).Error
}

func (userService *UserService) GetUserInfo(uuid uuid.UUID) (user system.SysUser, err error) {
	var reqUser system.SysUser
	err = global.GVA_DB.First(&reqUser, "uuid = ?", uuid).Error
	if err != nil {
		return reqUser, err
	}
	return reqUser, err
}

func (userService *UserService) DeleteUser(id int) (err error) {
	err = global.GVA_DB.Where("id = ?", id).Delete(&system.SysUser{}).Error
	if err != nil {
		return err
	}
	return nil
}

func (userService *UserService) ResetPassword(ID uint, Password string) (err error) {
	err = global.GVA_DB.Model(&system.SysUser{}).Where("id = ?", ID).Update("password", utils.BcryptHash(Password)).Error
	return err
}
