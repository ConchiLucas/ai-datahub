package system

import (
	"mime/multipart"
	"strconv"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/common/response"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type SoftwareApi struct{}

// GetList 获取软件列表
func (a *SoftwareApi) GetList(c *gin.Context) {
	userId := utils.GetUserID(c)
	list, err := softwareService.GetList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取软件列表失败!", zap.Error(err))
		response.FailWithMessage("获取失败", c)
		return
	}
	response.OkWithData(list, c)
}

// Upload 上传软件文件
func (a *SoftwareApi) Upload(c *gin.Context) {
	userId := utils.GetUserID(c)

	file, err := c.FormFile("file")
	if err != nil {
		response.FailWithMessage("请选择要上传的软件文件", c)
		return
	}

	name := c.PostForm("name")
	if name == "" {
		name = file.Filename
	}
	version := c.PostForm("version")
	category := c.PostForm("category")
	platform := c.PostForm("platform")
	description := c.PostForm("description")

	var iconHeader *multipart.FileHeader
	if icon, err2 := c.FormFile("icon"); err2 == nil {
		iconHeader = icon
	}

	sw, err := softwareService.Upload(file, iconHeader, userId, name, version, category, platform, description)
	if err != nil {
		global.GVA_LOG.Error("上传软件失败!", zap.Error(err))
		response.FailWithMessage("上传失败: "+err.Error(), c)
		return
	}
	response.OkWithDetailed(sw, "上传成功", c)
}

// Delete 删除软件
func (a *SoftwareApi) Delete(c *gin.Context) {
	userId := utils.GetUserID(c)
	type req struct {
		ID uint `json:"id"`
	}
	var r req
	if err := c.ShouldBindJSON(&r); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	if err := softwareService.Delete(userId, r.ID); err != nil {
		global.GVA_LOG.Error("删除软件失败!", zap.Error(err))
		response.FailWithMessage("删除失败", c)
		return
	}
	response.OkWithMessage("删除成功", c)
}

// Update 编辑软件信息（不替换文件）
func (a *SoftwareApi) Update(c *gin.Context) {
	userId := utils.GetUserID(c)
	type req struct {
		ID          uint   `json:"id"`
		Name        string `json:"name"`
		Version     string `json:"version"`
		Category    string `json:"category"`
		Platform    string `json:"platform"`
		Description string `json:"description"`
	}
	var r req
	if err := c.ShouldBindJSON(&r); err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}
	if err := softwareService.Update(userId, r.ID, r.Name, r.Version, r.Category, r.Platform, r.Description); err != nil {
		global.GVA_LOG.Error("更新软件失败!", zap.Error(err))
		response.FailWithMessage("更新失败", c)
		return
	}
	response.OkWithMessage("更新成功", c)
}

// Download 下载软件文件 — 重定向到 MinIO URL
func (a *SoftwareApi) Download(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		response.FailWithMessage("参数错误", c)
		return
	}

	list, err := softwareService.GetList(userId)
	if err != nil {
		response.FailWithMessage("获取失败", c)
		return
	}

	for _, sw := range list {
		if int(sw.ID) == id {
			if sw.FileUrl == "" {
				response.FailWithMessage("文件不存在", c)
				return
			}
			c.Header("Content-Disposition", "attachment; filename=\""+sw.FileName+"\"")
			c.Header("Content-Type", "application/octet-stream")
			c.Redirect(302, sw.FileUrl)
			return
		}
	}
	response.FailWithMessage("软件不存在", c)
}
