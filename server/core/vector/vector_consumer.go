package vector

import (
	"time"

	"github.com/conchi/ai-note/server/global"
	"github.com/conchi/ai-note/server/model/system"
	"github.com/pgvector/pgvector-go"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

var GlobalDelayQueue *DelayQueue

// InitVectorConsumer initializes the singleton delay queue and sets the run consumer.
func InitVectorConsumer() {
	GlobalDelayQueue = NewDelayQueue(10*time.Second, ProcessTask)
	global.GVA_LOG.Info("Vector delay queue initialized")
}

// ProcessTask handles chunking, vector generation, and saving.
func ProcessTask(task NoteTask) {
	global.GVA_LOG.Info("Processing vector task for Note", zap.Uint("noteId", task.NoteId), zap.Int("version", task.Version))

	// 1. Split note content
	chunks := SplitWithTitle(task.Title, task.Content, 500)
	if len(chunks) == 0 {
		return
	}

	embeddings := make([][]float32, 0, len(chunks))

	// 2. Generate embeddings
	for _, chunkText := range chunks {
		emb, err := GenerateEmbedding(chunkText)
		if err != nil {
			global.GVA_LOG.Error("Failed to generate embedding", zap.Error(err))
			continue
		}
		embeddings = append(embeddings, emb)
	}

	if len(embeddings) == 0 {
		return
	}

	// 3. Delete old chunks
	// Using a transaction to delete old and insert new safely.
	err := global.GVA_DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("note_id = ?", task.NoteId).Delete(&system.TaNoteChunk{}).Error; err != nil {
			return err
		}

		// 4. Batch insert new chunks
		chunkRecords := make([]system.TaNoteChunk, 0, len(embeddings))
		for i, emb := range embeddings {
			chunkRecords = append(chunkRecords, system.TaNoteChunk{
				NoteId:         task.NoteId,
				ChunkContent:   chunks[i],
				ChunkEmbedding: pgvector.NewVector(emb),
				ChunkIndex:     i,
				Version:        task.Version,
			})
		}

		if err := tx.Create(&chunkRecords).Error; err != nil {
			return err
		}

		return nil
	})

	if err != nil {
		global.GVA_LOG.Error("Failed to save note chunks vectors to database", zap.Error(err))
	} else {
		global.GVA_LOG.Info("Successfully saved note chunks", zap.Uint("noteId", task.NoteId))
	}
}

// SplitWithTitle splits text roughly by chunkSize
func SplitWithTitle(title string, text string, chunkSize int) []string {
	if text == "" {
		return nil
	}
	runes := []rune(text)
	var chunks []string
	for i := 0; i < len(runes); i += chunkSize {
		end := i + chunkSize
		if end > len(runes) {
			end = len(runes)
		}
		chunks = append(chunks, title+"\n"+string(runes[i:end]))
	}
	return chunks
}
