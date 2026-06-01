package system

import (
	"mime/multipart"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/utils"
	"github.com/dhowden/tag"
)

type MusicService struct{}

func (s *MusicService) GetMusicList(userId uint) ([]system.TaMusic, error) {
	var list []system.TaMusic
	err := global.GVA_DB.Where("user_id = ?", userId).Order("id desc").Find(&list).Error
	return list, err
}

func (s *MusicService) ToggleFavorite(userId uint, id uint) error {
	return global.GVA_DB.Exec("UPDATE ta_music SET is_favorite = NOT is_favorite WHERE id = ? AND user_id = ?", id, userId).Error
}

func (s *MusicService) LogPlayback(userId uint, id uint) error {
	return global.GVA_DB.Model(&system.TaMusic{}).Where("id = ? AND user_id = ?", id, userId).Update("last_played_at", time.Now()).Error
}

func (s *MusicService) DeleteMusic(userId uint, id uint) error {
	var m system.TaMusic
	if err := global.GVA_DB.Where("id = ? AND user_id = ?", id, userId).First(&m).Error; err != nil {
		return err
	}
	_ = utils.DeleteFromMinio(m.AudioUrl)
	if m.CoverUrl != "" && !strings.HasPrefix(m.CoverUrl, "http") {
		_ = utils.DeleteFromMinio(m.CoverUrl)
	}
	return global.GVA_DB.Delete(&m).Error
}

func (s *MusicService) UploadMusic(header *multipart.FileHeader, userId uint, duration float64) (*system.TaMusic, error) {
	fileExt := filepath.Ext(header.Filename)
	baseNum := strconv.FormatInt(time.Now().UnixNano(), 10)
	minioName := baseNum + fileExt
	coverMinioName := baseNum + "_cover"

	src, err := header.Open()
	if err != nil {
		return nil, err
	}
	defer src.Close()

	// Parse ID3 Tags first
	title := strings.TrimSuffix(header.Filename, fileExt)
	artist := "未知艺术家"
	album := "本地上传"
	coverUrl := "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?q=80&w=400&auto=format&fit=crop"

	m, tagErr := tag.ReadFrom(src)
	if tagErr == nil && m != nil {
		if t := m.Title(); t != "" {
			title = t
		}
		if a := m.Artist(); a != "" {
			artist = a
		}
		if al := m.Album(); al != "" {
			album = al
		}
		if pic := m.Picture(); pic != nil {
			picExt := ".jpg"
			if pic.Ext != "" {
				picExt = "." + pic.Ext
			} else if pic.MIMEType == "image/png" {
				picExt = ".png"
			}
			coverUrlStr, errUpload := utils.UploadReaderToMinio(strings.NewReader(string(pic.Data)), int64(len(pic.Data)), coverMinioName+picExt, pic.MIMEType, "music_cover")
			if errUpload == nil {
				coverUrl = coverUrlStr
			}
		}
	}

	// Reset stream to start for Minio audio upload
	src.Seek(0, 0)
	headerCopy := *header
	headerCopy.Filename = minioName
	url, err := utils.UploadToMinio(&headerCopy, "music")
	if err != nil {
		return nil, err
	}

	music := system.TaMusic{
		UserId:   userId,
		Title:    title,
		Artist:   artist,
		Album:    album,
		CoverUrl: coverUrl,
		AudioUrl: url,
		Duration: duration,
		Size:     header.Size,
	}

	if err := global.GVA_DB.Create(&music).Error; err != nil {
		return nil, err
	}

	return &music, nil
}
