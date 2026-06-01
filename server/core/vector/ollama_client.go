package vector

import (
	"bytes"
	"encoding/json"
	"errors"
	"net/http"
	"time"
)

const (
	OllamaBaseUrl = "http://localhost:11434"
	OllamaModel   = "bge-m3"
)

type EmbeddingRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
}

type EmbeddingResponse struct {
	Embedding []float32 `json:"embedding"`
}

// GenerateEmbedding calls Ollama to generate context embedding
func GenerateEmbedding(text string) ([]float32, error) {
	if text == "" {
		return nil, errors.New("empty text")
	}

	reqBody := EmbeddingRequest{
		Model:  OllamaModel,
		Prompt: text,
	}
	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	client := &http.Client{Timeout: 60 * time.Second}
	resp, err := client.Post(OllamaBaseUrl+"/api/embeddings", "application/json", bytes.NewBuffer(jsonData))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var result EmbeddingResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	return result.Embedding, nil
}
