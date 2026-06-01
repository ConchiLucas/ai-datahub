#!/bin/bash

# --- dev.sh ---
# 解决本地开发时 "Address already in use" 报错痛点。

PORT=8888

echo "🔍 正在检查 8888 端口是否被占用..."

# 找出占用该端口的 PID（如果有多个就多行返回）
PIDS=$(lsof -t -i :$PORT)

if [ -n "$PIDS" ]; then
    echo "🚨 发现端口 $PORT 正在被 PID: $PIDS 占用，正在结束相关进程..."
    # 强制杀死占用该端口的进程
    echo "$PIDS" | xargs kill -9
    echo "✅ 已释放端口 $PORT！"
else
    echo "✅ 端口 $PORT 可用！"
fi

echo "🚀 正在启动 Go 后端服务..."
go run main.go
