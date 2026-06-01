package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system/response"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
	commonReq "github.com/conchi/ai-note/server/model/common/request"
	commonRes "github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type BaseApi struct{}

func (b *BaseApi) Login(c *gin.Context) {
	var l systemReq.Login
	err := c.ShouldBindJSON(&l)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	err = utils.Verify(l, utils.LoginVerify)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}

	u := &system.SysUser{Username: l.Username, Password: l.Password}
	user, err := userService.Login(u)
	if err != nil {
		global.GVA_LOG.Error("登陆失败! 用户名不存在或者密码错误!", zap.Error(err))
		commonRes.FailWithMessage("用户名不存在或者密码错误", c)
		return
	}
	if user.Enable != 1 {
		global.GVA_LOG.Error("登陆失败! 用户被禁止登录!")
		commonRes.FailWithMessage("用户被禁止登录", c)
		return
	}
	b.TokenNext(c, *user)
}

func (b *BaseApi) TokenNext(c *gin.Context, user system.SysUser) {
	j := &utils.JWT{SigningKey: []byte(global.GVA_CONFIG.JWT.SigningKey)}
	claims := j.CreateClaims(systemReq.BaseClaims{
		UUID:        user.UUID,
		ID:          user.ID,
		NickName:    user.NickName,
		Username:    user.Username,
	})
	token, err := j.CreateToken(claims)
	if err != nil {
		global.GVA_LOG.Error("获取token失败!", zap.Error(err))
		commonRes.FailWithMessage("获取token失败", c)
		return
	}
	if !global.GVA_CONFIG.System.UseMultipoint {
		utils.SetToken(c, token, int(claims.RegisteredClaims.ExpiresAt.Unix()-claims.RegisteredClaims.NotBefore.Unix()))
		commonRes.OkWithDetailed(response.LoginResponse{
			User:      user,
			Token:     token,
			ExpiresAt: claims.RegisteredClaims.ExpiresAt.Unix() * 1000,
		}, "登录成功", c)
		return
	}

	err = utils.SetRedisJWT(token, user.Username)
	if err != nil {
		global.GVA_LOG.Error("设置登录状态失败!", zap.Error(err))
		commonRes.FailWithMessage("设置登录状态失败", c)
		return
	}

	utils.SetToken(c, token, int(claims.RegisteredClaims.ExpiresAt.Unix()-claims.RegisteredClaims.NotBefore.Unix()))
	commonRes.OkWithDetailed(response.LoginResponse{
		User:      user,
		Token:     token,
		ExpiresAt: claims.RegisteredClaims.ExpiresAt.Unix() * 1000,
	}, "登录成功", c)
}

type UserApi struct{}

func (b *UserApi) Register(c *gin.Context) {
	var r systemReq.Register
	err := c.ShouldBindJSON(&r)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	err = utils.Verify(r, utils.RegisterVerify)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	user := &system.SysUser{Username: r.Username, NickName: r.NickName, Password: r.Password, HeaderImg: r.HeaderImg, Enable: r.Enable, Phone: r.Phone, Email: r.Email}
	userReturn, err := userService.Register(*user)
	if err != nil {
		global.GVA_LOG.Error("注册失败!", zap.Error(err))
		commonRes.FailWithDetailed(response.SysUserResponse{User: userReturn}, "注册失败", c)
		return
	}
	commonRes.OkWithDetailed(response.SysUserResponse{User: userReturn}, "注册成功", c)
}

func (b *UserApi) ChangePassword(c *gin.Context) {
	var req systemReq.ChangePasswordReq
	err := c.ShouldBindJSON(&req)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	err = utils.Verify(req, utils.ChangePasswordVerify)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	uid := utils.GetUserID(c)
	u := &system.SysUser{
		GVA_MODEL: global.GVA_MODEL{ID: uid},
		Password:  req.Password,
	}
	err = userService.ChangePassword(u, req.NewPassword)
	if err != nil {
		global.GVA_LOG.Error("修改失败!", zap.Error(err))
		commonRes.FailWithMessage("修改失败，原密码与当前账户不符", c)
		return
	}
	commonRes.OkWithMessage("修改成功", c)
}

func (b *UserApi) GetUserList(c *gin.Context) {
	var pageInfo commonReq.PageInfo
	err := c.ShouldBindJSON(&pageInfo)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	err = utils.Verify(pageInfo, utils.PageInfoVerify)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	list, total, err := userService.GetUserInfoList(pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		commonRes.FailWithMessage("获取失败", c)
		return
	}
	commonRes.OkWithDetailed(commonRes.PageResult{
		List:     list,
		Total:    total,
		Page:     pageInfo.Page,
		PageSize: pageInfo.PageSize,
	}, "获取成功", c)
}

func (b *UserApi) SetSelfSetting(c *gin.Context) {
	var req map[string]interface{}
	err := c.ShouldBindJSON(&req)
	if err != nil {
		commonRes.FailWithMessage(err.Error(), c)
		return
	}
	
	uid := utils.GetUserID(c)
	err = userService.SetSelfSetting(req, uid)
	if err != nil {
		global.GVA_LOG.Error("设置用户设置失败!", zap.Error(err))
		commonRes.FailWithMessage("配置修改失败", c)
		return
	}
	commonRes.OkWithMessage("配置修改成功", c)
}
