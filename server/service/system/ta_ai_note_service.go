package system

import (
	"errors"
	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/conchi/ai-note/server/core/vector"
	"github.com/pgvector/pgvector-go"
)

type TaAiNoteService struct{}

// getUserNotebookIds 获取用户拥有的所有笔记本 ID（用于数据隔离）
func (s *TaAiNoteService) getUserNotebookIds(userId uint) ([]uint, error) {
	var ids []uint
	err := global.GVA_DB.Model(&system.TaDirectory{}).
		Where("user_id = ? AND type = ?", userId, "note").
		Pluck("id", &ids).Error
	return ids, err
}

func (s *TaAiNoteService) CreateNote(note *system.TaAiNote, userId uint) error {
	// 验证 NotebookId 属于当前用户
	if note.NotebookId != 0 {
		var count int64
		global.GVA_DB.Model(&system.TaDirectory{}).Where("id = ? AND user_id = ?", note.NotebookId, userId).Count(&count)
		if count == 0 {
			return errors.New("无权向该笔记本创建笔记")
		}
	}

	// Calculate word count
	note.WordCount = len([]rune(note.Content))

	err := global.GVA_DB.Create(note).Error
	if err == nil && note.Content != "" {
		// Push to delay queue for vector chunking
		if vector.GlobalDelayQueue != nil {
			vector.GlobalDelayQueue.Push(vector.NoteTask{
				NoteId:  note.ID,
				Title:   note.Title,
				Content: note.Content,
				Version: note.Version,
			})
		}
	}
	return err
}

func (s *TaAiNoteService) DeleteNote(ids []int, userId uint) error {
	// 只删除属于当前用户笔记本下的笔记
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return err
	}
	if len(userNotebookIds) == 0 {
		return nil
	}
	return global.GVA_DB.Where("id IN ? AND notebook_id IN ?", ids, userNotebookIds).Delete(&system.TaAiNote{}).Error
}

func (s *TaAiNoteService) UpdateNote(note *system.TaAiNote, userId uint) error {
	// 校验笔记归属
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return err
	}
	var existing system.TaAiNote
	if err := global.GVA_DB.Where("id = ? AND notebook_id IN ?", note.ID, userNotebookIds).First(&existing).Error; err != nil {
		return err
	}

	note.WordCount = len([]rune(note.Content))
	note.Version = existing.Version + 1

	// 使用 Select 明确指定需要更新的字段，避免 GORM 跳过零值（如空字符串、0）
	err = global.GVA_DB.Model(note).Select(
		"title", "content", "word_count", "tags", "notebook_id", "is_favorite", "client_id", "version",
	).Updates(note).Error
	if err == nil && note.Content != "" {
		if vector.GlobalDelayQueue != nil {
			vector.GlobalDelayQueue.Push(vector.NoteTask{
				NoteId:  note.ID,
				Title:   note.Title,
				Content: note.Content,
				Version: note.Version,
			})
		}
	}
	return err
}

func (s *TaAiNoteService) GetNoteById(id int, userId uint) (system.TaAiNote, error) {
	var note system.TaAiNote
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return note, err
	}
	if len(userNotebookIds) == 0 {
		return note, global.GVA_DB.First(&note, "1=0").Error // 返回空结果
	}
	err = global.GVA_DB.Where("id = ? AND notebook_id IN ?", id, userNotebookIds).First(&note).Error
	return note, err
}

func (s *TaAiNoteService) GetNoteList(userId uint, notebookIds []int, tagName string) ([]system.TaAiNote, error) {
	var notes []system.TaAiNote

	// 先获取当前用户的所有笔记本 ID
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return nil, err
	}
	if len(userNotebookIds) == 0 {
		return []system.TaAiNote{}, nil
	}

	db := global.GVA_DB.Model(&system.TaAiNote{}).Where("notebook_id IN ?", userNotebookIds)

	if len(notebookIds) > 0 {
		// 进一步过滤到用户指定的笔记本
		db = db.Where("notebook_id IN ?", notebookIds)
	}
	if tagName != "" {
		db = db.Where("tags LIKE ?", "%"+tagName+"%")
	}
	err = db.Order("updated_at desc").Find(&notes).Error
	return notes, err
}

func (s *TaAiNoteService) SearchNotes(keyword string, userId uint, notebookIds []int) ([]system.TaAiNote, error) {
	var notes []system.TaAiNote

	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return nil, err
	}
	if len(userNotebookIds) == 0 {
		return []system.TaAiNote{}, nil
	}

	db := global.GVA_DB.Where("(title LIKE ? OR content LIKE ?) AND notebook_id IN ?", "%"+keyword+"%", "%"+keyword+"%", userNotebookIds)
	if len(notebookIds) > 0 {
		db = db.Where("notebook_id IN ?", notebookIds)
	}
	err = db.Order("updated_at desc").Find(&notes).Error
	return notes, err
}

func (s *TaAiNoteService) MoveNote(noteId int, notebookId int, userId uint) error {
	// 验证笔记属于当前用户
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return err
	}
	var note system.TaAiNote
	if err := global.GVA_DB.Where("id = ? AND notebook_id IN ?", noteId, userNotebookIds).First(&note).Error; err != nil {
		return err
	}

	note.NotebookId = uint(notebookId)
	return global.GVA_DB.Save(&note).Error
}

func (s *TaAiNoteService) ToggleFavorite(noteId int, isFavorite int, userId uint) error {
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return err
	}
	return global.GVA_DB.Model(&system.TaAiNote{}).Where("id = ? AND notebook_id IN ?", noteId, userNotebookIds).Update("is_favorite", isFavorite).Error
}

type VectorSearchResult struct {
	NoteId            int     `json:"noteId"`
	NoteTitle         string  `json:"noteTitle"`
	Similarity        float32 `json:"similarity"`
	MatchedChunk      string  `json:"matchedChunk"`
	MatchedChunkIndex int     `json:"matchedChunkIndex"`
	NoteContent       string  `json:"noteContent,omitempty"`
	NoteTags          string  `json:"noteTags,omitempty"`
	NotebookId        uint    `json:"notebookId"`
}

func (s *TaAiNoteService) VectorSearchNotes(queryText string, limit int, minSimilarity float32, notebookIds []int, returnContent bool, userId uint) ([]VectorSearchResult, error) {
	if queryText == "" {
		return []VectorSearchResult{}, nil
	}

	if limit <= 0 {
		limit = 5
	} else if limit > 50 {
		limit = 50
	}

	// 获取用户的笔记本 ID 列表
	userNotebookIds, err := s.getUserNotebookIds(userId)
	if err != nil {
		return nil, err
	}
	if len(userNotebookIds) == 0 {
		return []VectorSearchResult{}, nil
	}

	queryVector, err := vector.GenerateEmbedding(queryText)
	if err != nil {
		return nil, err
	}

	vectorParam := pgvector.NewVector(queryVector)

	sql := `
SELECT
    sub.note_id,
    sub.max_similarity AS similarity,
    sub.best_chunk AS matched_chunk,
    sub.best_chunk_index AS matched_chunk_index,
    n.title AS note_title,
    n.content AS note_content,
    n.tags AS note_tags,
    n.notebook_id AS notebook_id
FROM (
    SELECT
        note_id,
        MAX(similarity) as max_similarity,
        MAX(CASE WHEN rn = 1 THEN chunk_content END) as best_chunk,
        MAX(CASE WHEN rn = 1 THEN chunk_index END) as best_chunk_index
    FROM (
        SELECT
            note_id,
            chunk_content,
            chunk_index,
            1 - (chunk_embedding <=> ?) as similarity,
            DENSE_RANK() OVER (
                PARTITION BY note_id
                ORDER BY 1 - (chunk_embedding <=> ?) DESC
            ) as rn
        FROM ta_note_chunk
        WHERE chunk_embedding IS NOT NULL AND 1 - (chunk_embedding <=> ?) >= ?
    ) ranked
    GROUP BY note_id
) sub
JOIN ta_ai_note n ON n.id = sub.note_id
WHERE n.notebook_id IN ?
`
	args := []interface{}{vectorParam, vectorParam, vectorParam, minSimilarity, userNotebookIds}

	if len(notebookIds) > 0 {
		sql += " AND n.notebook_id IN ?"
		args = append(args, notebookIds)
	}

	sql += " ORDER BY sub.max_similarity DESC LIMIT ?"
	args = append(args, limit)

	var results []VectorSearchResult
	err = global.GVA_DB.Raw(sql, args...).Scan(&results).Error
	if err != nil {
		return nil, err
	}
	
	if !returnContent {
		for i := range results {
			results[i].NoteContent = ""
			results[i].NoteTags = ""
		}
	}

	if results == nil {
		results = []VectorSearchResult{}
	}

	return results, nil
}
