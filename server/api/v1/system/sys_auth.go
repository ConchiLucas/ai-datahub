package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	systemReq "github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"net/http"
)

type AuthApi struct{}

// Login 适配新前端直接解构的登录
func (b *AuthApi) Login(c *gin.Context) {
	var l systemReq.Login
	err := c.ShouldBindJSON(&l)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	err = utils.Verify(l, utils.LoginVerify)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	u := &system.SysUser{Username: l.Username, Password: l.Password}
	user, err := userService.Login(u)
	if err != nil {
		global.GVA_LOG.Error("登陆失败! 用户名不存在或者密码错误!", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "用户名不存在或者密码错误"})
		return
	}
	if user.Enable != 1 {
		global.GVA_LOG.Error("登陆失败! 用户被禁止登录!")
		c.JSON(http.StatusForbidden, gin.H{"error": "用户被禁止登录"})
		return
	}

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
		c.JSON(http.StatusInternalServerError, gin.H{"error": "获取token失败"})
		return
	}

	if global.GVA_CONFIG.System.UseMultipoint {
		err = utils.SetRedisJWT(token, user.Username)
		if err != nil {
			global.GVA_LOG.Error("设置登录状态失败!", zap.Error(err))
			c.JSON(http.StatusInternalServerError, gin.H{"error": "设置登录状态失败"})
			return
		}
	}

	utils.SetToken(c, token, int(claims.RegisteredClaims.ExpiresAt.Unix()-claims.RegisteredClaims.NotBefore.Unix()))
	
	// 返回前端期待的平铺结构
	userInfo := gin.H{
		"id": user.ID,
		"username": user.Username,
		"origin_setting": user.OriginSetting,
	}

	c.JSON(http.StatusOK, gin.H{
		"token": token,
		"expires_in": claims.RegisteredClaims.ExpiresAt.Unix() * 1000,
		"token_type": "Bearer",
		"user_info": userInfo,   // 为了兼容 api/auth.ts
		"code": 200,             // 为了兼容其它可能的封装
	})
}

// GetUserInfo 适配前端初始化
func (b *AuthApi) GetUserInfo(c *gin.Context) {
	uuidStr := utils.GetUserUuid(c)
	reqUser, err := userService.GetUserInfo(uuidStr)
	if err != nil {
		global.GVA_LOG.Error("获取用户信息失败!", zap.Error(err))
		c.JSON(http.StatusUnauthorized, gin.H{"error": "获取用户信息失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{
		"id": reqUser.ID,
		"username": reqUser.Username,
		"origin_setting": reqUser.OriginSetting,
		"code": 200,
	})
}

// Logout 适配登出
func (b *AuthApi) Logout(c *gin.Context) {
    utils.ClearToken(c) 
	c.JSON(http.StatusOK, gin.H{"code": 200, "message": "Success"})
}
