package system

import (
	"github.com/conchi/ai-note/server/global"
	"github.com/pgvector/pgvector-go"
)

type TaNoteChunk struct {
	global.GVA_MODEL
	NoteId         uint            `json:"noteId" gorm:"column:note_id;not null;index;comment:笔记 ID，关联 ta_ai_note.id"`
	ChunkContent   string          `json:"chunkContent" gorm:"column:chunk_content;type:text;not null;comment:笔记片段内容"`
	ChunkEmbedding pgvector.Vector `json:"chunkEmbedding" gorm:"type:vector(1024);not null;comment:片段向量（BGE-M3 1024维）"`
	ChunkIndex     int             `json:"chunkIndex" gorm:"column:chunk_index;type:int;not null;comment:片段在原笔记中的位置序号（用于拼接）"`
	Version        int             `json:"version" gorm:"column:version;type:int;not null;default:1;index;comment:笔记版本号（对齐 ta_ai_note.version）"`
}

func (TaNoteChunk) TableName() string {
	return "ta_note_chunk"
}
