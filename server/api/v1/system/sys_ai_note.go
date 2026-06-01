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

type AiNoteApi struct{}

// 辅助方法：将 TaAiNote 转成前端需要的平铺 JSON
func formatNote(note system.TaAiNote) gin.H {
	return gin.H{
		"id":           note.ID,
		"title":        note.Title,
		"content":      note.Content,
		"wordCount":    note.WordCount,
		"tags":         note.Tags,
		"notebook_id":  note.NotebookId,
		"isFavorite":   note.IsFavorite,
		"createTime":   note.CreatedAt,
		"updateTime":   note.UpdatedAt,
	}
}

func (b *AiNoteApi) GetNoteList(c *gin.Context) {
	userId := utils.GetUserID(c)

	notebookIdsStr := c.Query("notebookIds")
	tagName := c.Query("tags")

	var notebookIds []int
	if notebookIdsStr != "" {
		for _, s := range strings.Split(notebookIdsStr, ",") {
			if id, err := strconv.Atoi(s); err == nil {
				notebookIds = append(notebookIds, id)
			}
		}
	}

	notes, err := taAiNoteService.GetNoteList(userId, notebookIds, tagName)
	if err != nil {
		global.GVA_LOG.Error("获取失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取列表失败"})
		return
	}

	var data []gin.H
	for _, n := range notes {
		data = append(data, formatNote(n))
	}
	if data == nil {
		data = make([]gin.H, 0)
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": data})
}

func (b *AiNoteApi) GetNoteById(c *gin.Context) {
	userId := utils.GetUserID(c)

	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}
	note, err := taAiNoteService.GetNoteById(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": formatNote(note)})
}

func (b *AiNoteApi) SaveOrUpdateNote(c *gin.Context) {
	userId := utils.GetUserID(c)

	var req struct {
		ID         int    `json:"id"`
		Title      string `json:"title"`
		Content    string `json:"content"`
		Tags       string `json:"tags"`
		NotebookId uint   `json:"notebook_id"`
		IsFavorite int    `json:"is_favorite"`
		ClientId   string `json:"client_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	note := system.TaAiNote{
		Title:      req.Title,
		Content:    req.Content,
		Tags:       req.Tags,
		NotebookId: req.NotebookId,
		IsFavorite: req.IsFavorite,
		ClientId:   req.ClientId,
	}
	note.ID = uint(req.ID)

	var err error
	if note.ID != 0 {
		err = taAiNoteService.UpdateNote(&note, userId)
	} else {
		err = taAiNoteService.CreateNote(&note, userId)
	}

	if err != nil {
		global.GVA_LOG.Error("保存失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "保存失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": formatNote(note)})
}

func (b *AiNoteApi) DeleteNote(c *gin.Context) {
	userId := utils.GetUserID(c)

	idsStr := c.Param("ids")
	var ids []int
	for _, s := range strings.Split(idsStr, ",") {
		if id, err := strconv.Atoi(s); err == nil {
			ids = append(ids, id)
		}
	}
	if len(ids) == 0 {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	err := taAiNoteService.DeleteNote(ids, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "删除失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *AiNoteApi) MoveNote(c *gin.Context) {
	userId := utils.GetUserID(c)

	var req struct {
		NoteId     int `json:"note_id"`
		NotebookId int `json:"notebook_id"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	err := taAiNoteService.MoveNote(req.NoteId, req.NotebookId, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "移动失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *AiNoteApi) ToggleFavorite(c *gin.Context) {
	userId := utils.GetUserID(c)

	var req struct {
		NoteId     int `json:"note_id"`
		IsFavorite int `json:"is_favorite"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	err := taAiNoteService.ToggleFavorite(req.NoteId, req.IsFavorite, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "操作失败"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *AiNoteApi) SearchNotes(c *gin.Context) {
	userId := utils.GetUserID(c)

	keyword := c.Query("keyword")
	notebookIdsStr := c.Query("notebookIds")

	var notebookIds []int
	if notebookIdsStr != "" {
		for _, s := range strings.Split(notebookIdsStr, ",") {
			if id, err := strconv.Atoi(s); err == nil {
				notebookIds = append(notebookIds, id)
			}
		}
	}

	notes, err := taAiNoteService.SearchNotes(keyword, userId, notebookIds)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "搜索失败"})
		return
	}

	var data []gin.H
	for _, n := range notes {
		data = append(data, formatNote(n))
	}
	if data == nil {
		data = make([]gin.H, 0)
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": data})
}

// 模拟分页和向量搜索
func (b *AiNoteApi) GetNotePage(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg": "ok",
		"pageNum": 1,
		"pageSize": 10,
		"total": 0,
		"pages": 0,
		"data": make([]gin.H, 0),
	})
}

type VectorSearchRequest struct {
	QueryText     string  `json:"queryText"`
	Limit         int     `json:"limit"`
	MinSimilarity float32 `json:"minSimilarity"`
	NotebookIds   []int   `json:"notebookIds"`
	ReturnContent bool    `json:"returnContent"`
}

func (b *AiNoteApi) VectorSearchNotes(c *gin.Context) {
	userId := utils.GetUserID(c)

	var req VectorSearchRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	if req.Limit == 0 {
		req.Limit = 5
	}
	if req.MinSimilarity == 0 {
		req.MinSimilarity = 0.5
	}

	results, err := taAiNoteService.VectorSearchNotes(
		req.QueryText,
		req.Limit,
		req.MinSimilarity,
		req.NotebookIds,
		req.ReturnContent,
		userId,
	)

	if err != nil {
		global.GVA_LOG.Error("向量搜索失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "搜索失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg": "ok",
		"data": gin.H{"results": results},
	})
}
