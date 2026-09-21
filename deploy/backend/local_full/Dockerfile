FROM golang:1.26-alpine AS builder

WORKDIR /build
RUN apk add --no-cache git

COPY server/go.mod server/go.sum ./
RUN go mod download

COPY server/. .
RUN CGO_ENABLED=0 GOOS=linux go build -o server .

FROM alpine:latest

WORKDIR /app
RUN apk add --no-cache ca-certificates tzdata
ENV TZ=Asia/Shanghai

COPY --from=builder /build/server .
COPY server/config.docker.yaml config.yaml

EXPOSE 10001

CMD ["./server"]
