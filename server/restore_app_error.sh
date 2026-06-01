#!/bin/bash
# Function to extract and replace Error -> AppError
extract() {
  local src=$1
  local dest=$2
  git show 06f8b40:server/$src | \
  sed 's/TaError/TaAppError/g' | \
  sed 's/ta_error/ta_app_error/g' | \
  sed 's/errorRecord/appErrorRecord/g' | \
  sed 's/ErrorApi/AppErrorApi/g' | \
  sed 's/errorService/appErrorService/g' | \
  sed 's/ErrorService/AppErrorService/g' | \
  sed 's/ErrorRouter/AppErrorRouter/g' | \
  sed 's/Error 报错管理/AppError 报错管理/g' | \
  sed 's/报错管理API/报错管理API/g' > $dest
}

extract model/system/ta_error.go model/system/ta_app_error.go
extract model/system/request/ta_error.go model/system/request/ta_app_error.go
extract service/system/ta_error.go service/system/ta_app_error.go
extract api/v1/system/ta_error.go api/v1/system/ta_app_error.go
extract router/system/ta_error.go router/system/ta_app_error.go

echo "Extraction complete."
