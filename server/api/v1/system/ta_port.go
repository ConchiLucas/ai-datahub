package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type PortApi struct{}

// CreateHost 创建主机
func (p *PortApi) CreateHost(c *gin.Context) {
	var host system.TaHost
	err := c.ShouldBindJSON(&host)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	host.UserId = utils.GetUserID(c)
	if err := portService.CreateHost(host); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

// DeleteHost 删除主机
func (p *PortApi) DeleteHost(c *gin.Context) {
	var host system.TaHost
	err := c.ShouldBindJSON(&host)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := portService.DeleteHost(host.ID, userId); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateHost 更新主机
func (p *PortApi) UpdateHost(c *gin.Context) {
	var host system.TaHost
	err := c.ShouldBindJSON(&host)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	host.UserId = utils.GetUserID(c)
	if err := portService.UpdateHost(host); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetHostList 获取主机列表
func (p *PortApi) GetHostList(c *gin.Context) {
	userId := utils.GetUserID(c)
	if list, err := portService.GetHostList(userId); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(list, "获取成功", c)
	}
}


// CreatePort 创建端口记录
func (p *PortApi) CreatePort(c *gin.Context) {
	var port system.TaPort
	err := c.ShouldBindJSON(&port)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	port.UserId = utils.GetUserID(c)
	if err := portService.CreatePort(port); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		response.FailWithMessage("创建失败", c)
	} else {
		response.OkWithMessage("创建成功", c)
	}
}

// DeletePort 删除端口记录
func (p *PortApi) DeletePort(c *gin.Context) {
	var port system.TaPort
	err := c.ShouldBindJSON(&port)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := portService.DeletePort(port.ID, userId); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdatePort 更新端口记录
func (p *PortApi) UpdatePort(c *gin.Context) {
	var port system.TaPort
	err := c.ShouldBindJSON(&port)
	if err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	port.UserId = utils.GetUserID(c)
	if err := portService.UpdatePort(port); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// GetPortList 获取端口记录列表
func (p *PortApi) GetPortList(c *gin.Context) {
	userId := utils.GetUserID(c)
	if list, err := portService.GetPortList(userId); err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithDetailed(list, "获取成功", c)
	}
}
