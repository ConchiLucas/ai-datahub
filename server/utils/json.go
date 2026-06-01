package utils

import (
	"encoding/json"
)

func StructToJson(obj interface{}) string {
	b, _ := json.Marshal(obj)
	return string(b)
}

func JsonToStruct(str string, obj interface{}) {
	_ = json.Unmarshal([]byte(str), obj)
}
