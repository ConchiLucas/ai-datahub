package system

import (
	"errors"
	"mime/multipart"
	"path/filepath"
	"strconv"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"gorm.io/gorm"
)

type FilFileService struct{}

type EnrichedFilFile struct {
	system.FilFile
	ChildCount int64 `json:"childCount" gorm:"-"`
}

func (s *FilFileService) GetFileList(userId uint, parentId *uint, isDirectory *int) ([]EnrichedFilFile, error) {
	var files []system.FilFile
	db := global.GVA_DB.Where("user_id = ?", userId)
	if parentId != nil && *parentId != 0 {
		db = db.Where("parent_id = ?", parentId)
	} else {
		db = db.Where("parent_id IS NULL OR parent_id = 0")
	}
	if isDirectory != nil {
		db = db.Where("is_directory = ?", *isDirectory)
	}
	err := db.Order("is_directory desc, sort_num asc, id desc").Find(&files).Error
	if err != nil {
		return nil, err
	}

	var enrichedFiles []EnrichedFilFile
	for _, file := range files {
		ef := EnrichedFilFile{FilFile: file}
		if file.IsDirectory == 1 {
			var count int64
			global.GVA_DB.Model(&system.FilFile{}).Where("parent_id = ?", file.ID).Count(&count)
			ef.ChildCount = count
		}
		enrichedFiles = append(enrichedFiles, ef)
	}

	return enrichedFiles, nil
}

func (s *FilFileService) CreateDirectory(name string, userId uint, parentId *uint) (*system.FilFile, error) {
	var level int = 0
	if parentId != nil && *parentId != 0 {
		var parent system.FilFile
		if err := global.GVA_DB.First(&parent, *parentId).Error; err == nil {
			level = parent.Level + 1
		}
	}
	dir := system.FilFile{
		Name:        name,
		Type:        "directory",
		IsDirectory: 1,
		ParentId:    parentId,
		Level:       level,
		UserId:      userId,
	}
	err := global.GVA_DB.Create(&dir).Error
	return &dir, err
}

func (s *FilFileService) UploadFile(header *multipart.FileHeader, userId uint, parentId *uint) (*system.FilFile, error) {
	fileExt := filepath.Ext(header.Filename)
	baseNum := strconv.FormatInt(time.Now().UnixNano(), 10)
	minioName := baseNum + fileExt
	
	// Create a fast copy of the header with minioName as "filename" to trick minio
	headerCopy := *header
	headerCopy.Filename = minioName
	
	url, err := utils.UploadToMinio(&headerCopy, "file")
	if err != nil {
		return nil, err
	}

	// determine file type based on extension
	fileType := "other"
	ext := ""
	if len(fileExt) > 0 {
		ext = fileExt[1:]
		switch ext {
		case "jpg", "jpeg", "png", "gif", "webp", "svg":
			fileType = "image"
		case "pdf":
			fileType = "pdf"
		case "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "md":
			fileType = "document"
		case "mp4", "avi", "mov":
			fileType = "video"
		case "mp3", "wav":
			fileType = "audio"
		case "zip", "rar", "7z", "tar", "gz":
			fileType = "archive"
		case "go", "java", "py", "js", "ts", "html", "css", "json":
			fileType = "code"
		}
	}

	var level int = 0
	if parentId != nil && *parentId != 0 {
		var parent system.FilFile
		if err := global.GVA_DB.First(&parent, *parentId).Error; err == nil {
			level = parent.Level + 1
		}
	}

	sysFile := system.FilFile{
		Name:        header.Filename,
		IsDirectory: 0,
		Type:        fileType,
		Extension:   ext,
		Size:        header.Size,
		Url:         url,
		ParentId:    parentId,
		Level:       level,
		UserId:      userId,
	}

	err = global.GVA_DB.Create(&sysFile).Error
	return &sysFile, err
}

func (s *FilFileService) DeleteFile(id int, userId uint) error {
	return global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		var file system.FilFile
		if err := tx.Where("id = ? AND user_id = ?", id, userId).First(&file).Error; err != nil {
			return err
		}
		if file.IsDirectory == 1 {
			var count int64
			tx.Model(&system.FilFile{}).Where("parent_id = ?", file.ID).Count(&count)
			if count > 0 {
				return errors.New("cannot delete directory because it is not empty")
			}
		} else {
			// delete file on disk
			if file.Url != "" {
				_ = utils.DeleteFromMinio(file.Url)
			}
		}
		return tx.Delete(&file).Error
	})
}

func (s *FilFileService) RenameFile(id int, name string, userId uint) error {
	return global.GVA_DB.Model(&system.FilFile{}).Where("id = ? AND user_id = ?", id, userId).Update("name", name).Error
}

func (s *FilFileService) GetFileById(id int, userId uint) (system.FilFile, error) {
	var file system.FilFile
	err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&file).Error
	return file, err
}
