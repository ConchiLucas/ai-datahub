package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type AccountApi struct{}

// CreateAccount 创建账号
func (a *AccountApi) CreateAccount(c *gin.Context) {
	userId := utils.GetUserID(c)
	var account system.TaAccount
	if err := c.ShouldBindJSON(&account); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	account.UserId = userId

	if err := accountService.CreateAccount(&account); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
		return
	}
	response.OkWithMessage("创建成功", c)
}

// UpdateAccount 更新账号
func (a *AccountApi) UpdateAccount(c *gin.Context) {
	userId := utils.GetUserID(c)
	var account system.TaAccount
	if err := c.ShouldBindJSON(&account); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	account.UserId = userId

	if account.ID == 0 {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := accountService.UpdateAccount(account); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// DeleteAccount 删除账号
func (a *AccountApi) DeleteAccount(c *gin.Context) {
	userId := utils.GetUserID(c)

	type reqPath struct {
		Id uint `json:"id"`
	}
	var req reqPath
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	if err := accountService.DeleteAccount(userId, req.Id); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// GetAccountList 获取个人账号列表
func (a *AccountApi) GetAccountList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := accountService.GetAccountList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(list, c)
}
