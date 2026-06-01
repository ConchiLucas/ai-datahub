package system

import (
	"bytes"
	"encoding/csv"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/conchi/ai-note/server/global"
	systemService "github.com/conchi/ai-note/server/service/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/gin-gonic/gin"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
)

type FileApi struct{}

func getMinioBaseURL() string {
	scheme := "http://"
	if global.GVA_CONFIG.Minio.UseSSL {
		scheme = "https://"
	}
	return scheme + global.GVA_CONFIG.Minio.Endpoint
}

type fileListRequest struct {
	ParentId    *uint `json:"parentId"`
	IsDirectory *int  `json:"isDirectory"`
}

func formatFile(f systemService.EnrichedFilFile) gin.H {
	return gin.H{
		"id":          f.ID,
		"name":        f.Name,
		"isDirectory": f.IsDirectory,
		"type":        f.Type,
		"extension":   f.Extension,
		"size":        f.Size,
		"url":         f.Url,
		"parentId":    f.ParentId,
		"level":       f.Level,
		"sortNum":     f.SortNum,
		"icon":        f.Icon,
		"userId":      f.UserId,
		"childCount":  f.ChildCount,
		"createTime":  f.CreatedAt,
		"updateTime":  f.UpdatedAt,
	}
}

func (b *FileApi) GetFileList(c *gin.Context) {
	userId := utils.GetUserID(c)
	var req fileListRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		// Log but don't fail immediately, they might just send empty json
		global.GVA_LOG.Warn("fileListRequest bind error", zap.Error(err))
	}
	
	files, err := filFileService.GetFileList(userId, req.ParentId, req.IsDirectory)
	if err != nil {
		global.GVA_LOG.Error("获取文件列表失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取列表失败"})
		return
	}
	

	if len(files) == 0 {
	    // Ensure it returns an empty array instead of null
		c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": []interface{}{}})
		return
	}

	var data []gin.H
	for _, f := range files {
		data = append(data, formatFile(f))
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": data})
}

func (b *FileApi) CreateDirectory(c *gin.Context) {
	userId := utils.GetUserID(c)
	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误，Name不能为空"})
		return
	}
	parentIdStr := c.PostForm("parent_id")
	var parentId *uint
	if parentIdStr != "" {
		pid, err := strconv.Atoi(parentIdStr)
		if err == nil {
			pid32 := uint(pid)
			parentId = &pid32
		}
	}

	dir, err := filFileService.CreateDirectory(name, userId, parentId)
	if err != nil {
		global.GVA_LOG.Error("创建目录失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "创建目录失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": formatFile(systemService.EnrichedFilFile{FilFile: *dir, ChildCount: 0})})
}

func (b *FileApi) UploadFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	fileHeader, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "接收文件失败"})
		return
	}

	parentIdStr := c.PostForm("parent_id")
	var parentId *uint
	if parentIdStr != "" {
		pid, err := strconv.Atoi(parentIdStr)
		if err == nil {
			pid32 := uint(pid)
			parentId = &pid32
		}
	}

	savedFile, err := filFileService.UploadFile(fileHeader, userId, parentId)
	if err != nil {
		global.GVA_LOG.Error("上传文件失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "上传文件失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok", "data": formatFile(systemService.EnrichedFilFile{FilFile: *savedFile, ChildCount: 0})})
}

func (b *FileApi) DeleteFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	if err := filFileService.DeleteFile(id, userId); err != nil {
		global.GVA_LOG.Error("删除失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *FileApi) RenameFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	name := c.PostForm("name")
	if name == "" {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	if err := filFileService.RenameFile(id, name, userId); err != nil {
		global.GVA_LOG.Error("重命名失败!", zap.Error(err))
		c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "重命名失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"code": 200, "msg": "ok"})
}

func (b *FileApi) DownloadFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	fileInfo, err := filFileService.GetFileById(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 404, "msg": "文件不存在"})
		return
	}
	
	if fileInfo.IsDirectory == 1 {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "无法下载目录"})
		return
	}

	if fileInfo.Url == "" {
		c.JSON(http.StatusOK, gin.H{"code": 404, "msg": "文件物理路径不存在"})
		return
	}

	// 如果是本地 MinIO 的相对路径，临时补全本地访问地址以便服务器内部拉取
	if strings.HasPrefix(fileInfo.Url, "/"+global.GVA_CONFIG.Minio.BucketName+"/") {
		fileInfo.Url = getMinioBaseURL() + fileInfo.Url
	}

	if strings.HasPrefix(fileInfo.Url, "http://") || strings.HasPrefix(fileInfo.Url, "https://") {
		// Download from URL directly
		resp, err := http.Get(fileInfo.Url)
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "下载外部文件失败"})
			return
		}
		defer resp.Body.Close()

		c.Header("Content-Disposition", "attachment; filename="+fileInfo.Name)
		c.Header("Content-Type", "application/octet-stream")
		// Copy response body to client
		c.DataFromReader(http.StatusOK, resp.ContentLength, resp.Header.Get("Content-Type"), resp.Body, nil)
		return
	}

	// fileInfo.Url starts with "/", e.g. "/uploads/...", strip the leading slash
	filePath := fileInfo.Url
	if len(filePath) > 0 && filePath[0] == '/' {
		filePath = filePath[1:]
	}

	c.Header("Content-Disposition", "attachment; filename="+fileInfo.Name)
	c.Header("Content-Type", "application/octet-stream")
	c.File(filepath.Clean(filePath))
}

func (b *FileApi) PreviewFile(c *gin.Context) {
	userId := utils.GetUserID(c)
	idStr := c.Param("id")
	id, err := strconv.Atoi(idStr)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "参数错误"})
		return
	}

	fileInfo, err := filFileService.GetFileById(id, userId)
	if err != nil {
		c.JSON(http.StatusOK, gin.H{"code": 404, "msg": "文件不存在"})
		return
	}

	if fileInfo.IsDirectory == 1 {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "目录不支持预览"})
		return
	}

	if fileInfo.Url == "" {
		c.JSON(http.StatusOK, gin.H{"code": 404, "msg": "文件物理路径不存在"})
		return
	}

	// 如果是本地 MinIO 的相对路径，临时补全本地访问地址以便服务器内部拉取内容
	if strings.HasPrefix(fileInfo.Url, "/"+global.GVA_CONFIG.Minio.BucketName+"/") {
		fileInfo.Url = getMinioBaseURL() + fileInfo.Url
	}

	filePath := fileInfo.Url
	if len(filePath) > 0 && filePath[0] == '/' {
		filePath = filePath[1:]
	}
	filePath = filepath.Clean(filePath)

	fileSize := fileInfo.Size
	maxSize := 2 * 1024 * 1024 // 2MB

	ext := strings.ToLower(fileInfo.Extension)

	// Check binary extensions
	binaryExts := map[string]bool{
		"png": true, "jpg": true, "jpeg": true, "gif": true, "bmp": true, "ico": true, "svg": true, "webp": true, "tiff": true, "tif": true, "psd": true, "raw": true,
		"mp4": true, "avi": true, "mov": true, "mkv": true, "flv": true, "wmv": true, "webm": true, "m4v": true, "3gp": true,
		"mp3": true, "wav": true, "flac": true, "aac": true, "ogg": true, "wma": true, "m4a": true, "opus": true,
		"zip": true, "rar": true, "7z": true, "tar": true, "gz": true, "bz2": true, "xz": true, "zst": true,
		"exe": true, "dll": true, "so": true, "dylib": true, "bin": true, "dmg": true, "iso": true, "msi": true, "apk": true, "ipa": true,
		"doc": true, "docx": true, "ppt": true, "pptx": true, "pdf": true,
		"ttf": true, "otf": true, "woff": true, "woff2": true, "eot": true,
		"db": true, "sqlite": true, "mdb": true,
	}
	if binaryExts[ext] {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "该文件类型不支持预览"})
		return
	}

	if fileSize > int64(maxSize) {
		c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "文件过大，超过预览限制"})
		return
	}

	var content []byte
	if strings.HasPrefix(fileInfo.Url, "http://") || strings.HasPrefix(fileInfo.Url, "https://") {
		resp, err := http.Get(fileInfo.Url)
		if err != nil || resp.StatusCode != http.StatusOK {
			global.GVA_LOG.Error("获取外部文件内容失败", zap.String("url", fileInfo.Url), zap.Error(err))
			c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "获取外部文件内容失败"})
			return
		}
		defer resp.Body.Close()

		// Wait, some OSS APIs might not populate fileInfo.Size correctly. Let's read at most maxSize + 1
		var rawContent bytes.Buffer
		_, _ = io.CopyN(&rawContent, resp.Body, int64(maxSize)+1)
		content = rawContent.Bytes()
		// it's fine if err == EOF Or we reached max bytes
		if int64(len(content)) > int64(maxSize) {
			c.JSON(http.StatusOK, gin.H{"code": 400, "msg": "外部文件过大，超过预览限制"})
			return
		}
	} else {
		content, err = os.ReadFile(filePath)
		if err != nil {
			global.GVA_LOG.Error("读取本地文件失败", zap.Error(err), zap.String("path", filePath))
			c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "读取文件失败"})
			return
		}
	}

	if ext == "xlsx" || ext == "xls" || ext == "xlsm" {
		f, err := excelize.OpenReader(bytes.NewReader(content))
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "Excel 解析失败"})
			return
		}
		defer f.Close()

		var sheets []gin.H

		for _, sheetName := range f.GetSheetMap() {
			rows, err := f.GetRows(sheetName)
			if err != nil {
				continue
			}

			total := len(rows)
			truncated := false
			if total > 500 {
				rows = rows[:500]
				truncated = true
			}

			sheets = append(sheets, gin.H{
				"name":      sheetName,
				"rows":      rows,
				"total":     total,
				"truncated": truncated,
			})
		}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"msg":  "ok",
			"data": gin.H{
				"type":   "excel",
				"sheets": sheets,
				"size":   len(content),
			},
		})
		return
	}

	if ext == "csv" {
		reader := csv.NewReader(bytes.NewReader(content))
		rows, err := reader.ReadAll()
		if err != nil {
			c.JSON(http.StatusOK, gin.H{"code": 500, "msg": "CSV 解析失败"})
			return
		}
		total := len(rows)
		truncated := false
		if total > 500 {
			rows = rows[:500]
			truncated = true
		}

		sheets := []gin.H{{
			"name":      "Sheet1",
			"rows":      rows,
			"total":     total,
			"truncated": truncated,
		}}

		c.JSON(http.StatusOK, gin.H{
			"code": 200,
			"msg":  "ok",
			"data": gin.H{
				"type":   "excel",
				"sheets": sheets,
				"size":   len(content),
			},
		})
		return
	}

	if !utf8.Valid(content) {
		content = bytes.ToValidUTF8(content, []byte("?"))
	}

	c.JSON(http.StatusOK, gin.H{
		"code": 200,
		"msg":  "ok",
		"data": gin.H{
			"type":     "text",
			"content":  string(content),
			"encoding": "utf-8",
			"size":     len(content),
		},
	})
}
