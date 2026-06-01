package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/model/system/request"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type WebNavApi struct{}

// AddCategory
func (w *WebNavApi) AddCategory(c *gin.Context) {
	var req request.AddWebNavCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if category, err := webNavService.AddCategory(userId, req); err != nil {
		global.GVA_LOG.Error("添加分类失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(category, c)
	}
}

// UpdateCategory
func (w *WebNavApi) UpdateCategory(c *gin.Context) {
	var req request.UpdateWebNavCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := webNavService.UpdateCategory(userId, req); err != nil {
		global.GVA_LOG.Error("更新分类失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// DeleteCategory
func (w *WebNavApi) DeleteCategory(c *gin.Context) {
	var req request.DeleteWebNavCategoryReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := webNavService.DeleteCategory(userId, req); err != nil {
		global.GVA_LOG.Error("删除分类失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// UpdateSite
func (w *WebNavApi) UpdateSite(c *gin.Context) {
	var req request.UpdateWebNavSiteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := webNavService.UpdateSite(userId, req); err != nil {
		global.GVA_LOG.Error("更新网站失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
	} else {
		response.OkWithMessage("更新成功", c)
	}
}

// AddSite
func (w *WebNavApi) AddSite(c *gin.Context) {
	var req request.AddWebNavSiteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if site, err := webNavService.AddSite(userId, req); err != nil {
		global.GVA_LOG.Error("添加网站失败!", zap.Error(err))
		response.FailWithMessage("添加失败", c)
	} else {
		response.OkWithData(site, c)
	}
}

// DeleteSite
func (w *WebNavApi) DeleteSite(c *gin.Context) {
	var req request.DeleteWebNavSiteReq
	if err := c.ShouldBindJSON(&req); err != nil {
		response.FailWithMessage(err.Error(), c)
		return
	}
	userId := utils.GetUserID(c)
	if err := webNavService.DeleteSite(userId, req); err != nil {
		global.GVA_LOG.Error("删除网站失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
	} else {
		response.OkWithMessage("删除成功", c)
	}
}

// GetData
func (w *WebNavApi) GetData(c *gin.Context) {
	userId := utils.GetUserID(c)
	if data, err := webNavService.GetNavigationData(userId); err != nil {
		global.GVA_LOG.Error("获取导航数据失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
	} else {
		response.OkWithData(data, c)
	}
}

// UploadIcon
func (w *WebNavApi) UploadIcon(c *gin.Context) {
	_, header, err := c.Request.FormFile("file")
	if err != nil {
		global.GVA_LOG.Error("接收文件失败!", zap.Error(err))
		response.FailWithMessage("接收文件失败", c)
		return
	}
	url, err := webNavService.UploadIcon(header)
	if err != nil {
		global.GVA_LOG.Error("上传图标失败!", zap.Error(err))
		response.FailWithMessage("上传文件失败", c)
		return
	}
	response.OkWithData(gin.H{"url": url}, c)
}
