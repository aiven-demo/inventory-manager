FROM golang:1.23-alpine AS builder

WORKDIR /app
COPY . .
RUN go mod tidy
RUN CGO_ENABLED=0 GOOS=linux go build -o /emissions-tracker .

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=builder /emissions-tracker /usr/local/bin/emissions-tracker

EXPOSE 8080
CMD ["emissions-tracker"]
