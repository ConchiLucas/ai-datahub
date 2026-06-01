package system

import (
	"github.com/conchi/ai-note/server/global"
	"time"
)

type TaMusic struct {
	global.GVA_MODEL
	UserId    uint    `json:"userId" gorm:"column:user_id;comment:归属用户;index"`
	Title     string  `json:"title" gorm:"column:title;comment:歌曲标题;type:varchar(255)"`
	Artist    string  `json:"artist" gorm:"column:artist;comment:艺术家;type:varchar(255)"`
	Album     string  `json:"album" gorm:"column:album;comment:专辑名;type:varchar(255)"`
	CoverUrl  string  `json:"coverUrl" gorm:"column:cover_url;comment:提取出的封面图片地址或者默认封面"`
	AudioUrl  string  `json:"audioUrl" gorm:"column:audio_url;comment:音频文件存储路径"`
	Duration     float64    `json:"duration" gorm:"column:duration;comment:时长(秒)"`
	Size         int64      `json:"size" gorm:"column:size;comment:文件大小"`
	IsFavorite   bool       `json:"isFavorite" gorm:"column:is_favorite;comment:是否喜欢"`
	LastPlayedAt *time.Time `json:"lastPlayedAt" gorm:"column:last_played_at;comment:最近播放时间"`
}

func (TaMusic) TableName() string {
	return "ta_music"
}
