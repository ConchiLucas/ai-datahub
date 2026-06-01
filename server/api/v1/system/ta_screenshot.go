package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type ScreenshotApi struct{}

// CreateScreenshot
func (a *ScreenshotApi) CreateScreenshot(c *gin.Context) {
	userId := utils.GetUserID(c)
	desc := c.PostForm("description")
	tag := c.PostForm("tag")

	fileHeader, err := c.FormFile("file")
	if err != nil {
		global.GVA_LOG.Error("接收截图文件失败!", zap.Error(err))
		response.FailWithMessage("参数错误：接收文件失败", c)
		return
	}

	screenshot, err := screenshotService.CreateScreenshot(fileHeader, desc, tag, userId)
	if err != nil {
		global.GVA_LOG.Error("上传截图失败!", zap.Error(err))
		response.FailWithMessage("上传失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(screenshot, "上传成功", c)
	}
}

// UpdateScreenshot
func (a *ScreenshotApi) UpdateScreenshot(c *gin.Context) {
	var req system.TaScreenshot
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数解析失败", c)
		return
	}
	userId := utils.GetUserID(c)

	err := screenshotService.UpdateScreenshot(userId, &req)
	if err != nil {
		global.GVA_LOG.Error("更新截图失败!", zap.Error(err))
		response.FailWithMessage("更新失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteScreenshot
func (a *ScreenshotApi) DeleteScreenshot(c *gin.Context) {
	var req struct {
		ID uint `json:"id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage("参数解析失败", c)
		return
	}
	userId := utils.GetUserID(c)

	err := screenshotService.DeleteScreenshot(userId, req.ID)
	if err != nil {
		global.GVA_LOG.Error("删除截图失败!", zap.Error(err))
		response.FailWithMessage("删除失败: "+err.Error(), c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetScreenshotList
func (a *ScreenshotApi) GetScreenshotList(c *gin.Context) {
	var pageInfo request.TaScreenshotSearch
	_ = c.ShouldBindJSON(&pageInfo)
	userId := utils.GetUserID(c)

	list, total, err := screenshotService.GetScreenshotList(userId, pageInfo)
	if err != nil {
		global.GVA_LOG.Error("获取截图列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败: "+err.Error(), c)
	} else {
		response.OkWithDetailed(response.PageResult{
			List:     list,
			Total:    total,
			Page:     pageInfo.Page,
			PageSize: pageInfo.PageSize,
		}, "获取成功", c)
	}
}
