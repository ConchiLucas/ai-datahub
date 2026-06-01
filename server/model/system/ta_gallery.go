package system

import "github.com/conchi/ai-note/server/global"

type TaGalleryMedia struct {
	global.GVA_MODEL
	UserId    uint   `json:"userId" gorm:"column:user_id;comment:归属用户"`
	Type      string `json:"type" gorm:"column:type;comment:类型 image/video"`
	Url       string `json:"url" gorm:"column:url;comment:真实存放路径"`
	Thumbnail string `json:"thumbnail" gorm:"column:thumbnail;comment:视频的缩略图占位"`
	Title     string `json:"title" gorm:"column:title;comment:原文件名"`
	Size      int64  `json:"size" gorm:"column:size;comment:文件大小"`
	Duration  string `json:"duration" gorm:"column:duration;comment:播放时长(如是视频)"`
}

func (TaGalleryMedia) TableName() string {
	return "ta_gallery_media"
}
