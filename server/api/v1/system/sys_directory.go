package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"go.uber.org/zap"
	"net/http"
	"strconv"
	"strings"
)

type DirectoryApi struct{}

// get all directories and build tree recursively
func buildDirectoryTree(dirs []system.TaDirectory, parentId *uint) []gin.H {
	var tree []gin.H
	for _, dir := range dirs {
		if (parentId == nil && dir.ParentId == nil) || (parentId != nil && dir.ParentId != nil && *parentId == *dir.ParentId) {
			node := gin.H{
				"id": dir.ID,
				"name": dir.Name,
				"type": dir.Type,
				"parentId": dir.ParentId,
				"sortNum": dir.SortNum,
				"createTime": dir.CreatedAt,
				"updateTime": dir.UpdatedAt,
			}
			children := buildDirectoryTree(dirs, &dir.ID)
			if len(children) > 0 {
				node["children"] = children
			}
			tree = append(tree, node)
		}
	}
	return tree
}

func (b *DirectoryApi) GetDirectoryTree(c *gin.Context) {
	userId := utils.GetUserID(c)
	dirs, err := directoryService.GetDirectoryTree(userId)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取树失败"})
		return
	}
	tree := buildDirectoryTree(dirs, nil)
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": tree})
}

func (b *DirectoryApi) GetDirectoryList(c *gin.Context) {
	userId := utils.GetUserID(c)
	dirType := c.Query("directory_type")
	parentIdStr := c.Query("parent_id")
	var parentId *uint
	if parentIdStr != "" {
		pid, err := strconv.ParseUint(parentIdStr, 10, 32)
		if err == nil {
			pid32 := uint(pid)
			parentId = &pid32
		}
	}
	dirs, err := directoryService.GetDirectoryList(userId, dirType, parentId)
	if err != nil {
		global.GVA_LOG.Error("获取列表失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取列表失败"})
		return
	}
	
	var data []gin.H
	for _, dir := range dirs {
		data = append(data, gin.H{
			"id": dir.ID,
			"name": dir.Name,
			"type": dir.Type,
			"parentId": dir.ParentId,
			"sortNum": dir.SortNum,
			"createTime": dir.CreatedAt,
			"updateTime": dir.UpdatedAt,
		})
	}
	if data == nil {
		data = make([]gin.H, 0)
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": data})
}

func (b *DirectoryApi) GetDirectoryById(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	dir, err := directoryService.GetDirectoryById(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": gin.H{
		"id": dir.ID,
		"name": dir.Name,
		"type": dir.Type,
		"parentId": dir.ParentId,
		"sortNum": dir.SortNum,
	}})
}

type directoryRequest struct {
	ID         uint   `json:"id"`
	Name       string `json:"name"`
	Type       string `json:"type"`
	ParentId   *uint  `json:"parentId"`
	NotebookId *uint  `json:"notebookId"`
}

func (b *DirectoryApi) SaveOrUpdateDirectory(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req directoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	dir := system.TaDirectory{
		Name:     req.Name,
		Type:     req.Type,
		UserId:   userId,
		ParentId: req.ParentId,
	}
	dir.ID = req.ID

	err := directoryService.SaveOrUpdateDirectory(&dir, req.NotebookId)
	if err != nil {
		global.GVA_LOG.Error("保存失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "保存失败"})
		return
	}

	// 如果传了 NotebookId 可能是把现有的 notebook 放进 group，或者是把某个 note 绑定等等。
	// 根据业务逻辑，如果是新建 group 并传入 notebookId（笔记的 ID 吗？），由于缺乏详情此处先省略，只是打印
	if req.NotebookId != nil {
		global.GVA_LOG.Info("NotebookId found in SaveOrUpdate", zap.Uint("notebookId", *req.NotebookId))
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": gin.H{
		"id": dir.ID,
		"name": dir.Name,
		"type": dir.Type,
		"parentId": dir.ParentId,
	}})
}

func (b *DirectoryApi) DeleteDirectory(c *gin.Context) {
	userId := utils.GetUserID(c)
	idsStr := c.Param("ids")
	idStrs := strings.Split(idsStr, ",")
	var ids []int
	for _, id := range idStrs {
		i, err := strconv.Atoi(id)
		if err != nil {
			continue // 跳过无效 ID，避免将非法输入转为 0
		}
		ids = append(ids, i)
	}

	if len(ids) == 0 {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	err := directoryService.DeleteDirectory(ids, userId)
	if err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *DirectoryApi) MoveNoteToGroup(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req struct {
		NoteId  int `json:"noteId"`
		GroupId int `json:"groupId"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	err := directoryService.MoveNoteToGroup(req.NoteId, req.GroupId, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "移动失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}
