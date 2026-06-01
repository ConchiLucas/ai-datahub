package system

import (
	"strconv"
	"net/http"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
)

type TagApi struct{}

func formatTag(t system.TaTag) gin.H {
	return gin.H{
		"id":         t.ID,
		"userId":     t.UserId,
		"name":       t.Name,
		"color":      t.Color,
		"noteCount":  t.NoteCount,
		"createTime": t.CreatedAt,
		"updateTime": t.UpdatedAt,
	}
}

func (b *TagApi) GetTagList(c *gin.Context) {
	userId := utils.GetUserID(c)
	tags, err := tagService.GetTagList(userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取列表失败"})
		return
	}
	var data []gin.H
	for _, t := range tags {
		data = append(data, formatTag(t))
	}
	if data == nil {
		data = make([]gin.H, 0)
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": data})
}

func (b *TagApi) CreateTag(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req system.TaTag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	req.UserId = userId
	if err := tagService.CreateTag(&req); err != nil {
		global.GVA_LOG.Error("创建失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "创建失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": formatTag(req)})
}

func (b *TagApi) UpdateTag(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	var req system.TaTag
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	req.ID = uint(id)
	req.UserId = userId
	if err := tagService.UpdateTag(&req); err != nil {
		global.GVA_LOG.Error("更新失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *TagApi) DeleteTag(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	if err := tagService.DeleteTag(id, userId); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *TagApi) UpdateNoteTags(c *gin.Context) {
	userId := utils.GetUserID(c)
	noteIdStr := c.Param("noteId")
	noteId, err := strconv.Atoi(noteIdStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	var req map[string][]string
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	tags := req["tag_names"]
	if err := tagService.UpdateNoteTags(noteId, tags, userId); err != nil {
		global.GVA_LOG.Error("更新笔记标签失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "更新失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}
