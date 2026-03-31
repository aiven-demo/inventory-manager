package main

import (
	"context"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
)

func main() {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	dbURL := os.Getenv("DATABASE_URL")
	redisURL := getEnv("REDIS_URL", "redis://localhost:6379")
	port := getEnv("PORT", "8080")

	dbPool, err := pgxpool.New(ctx, dbURL)
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer dbPool.Close()

	if err := dbPool.Ping(ctx); err != nil {
		log.Fatalf("Failed to ping database: %v", err)
	}
	log.Println("Connected to database")

	var rdb *redis.Client
	redisOpts, err := redis.ParseURL(redisURL)
	if err == nil {
		rdb = redis.NewClient(redisOpts)
		if err := rdb.Ping(ctx).Err(); err != nil {
			log.Printf("Redis not available, running without queue: %v", err)
			rdb.Close()
			rdb = nil
		} else {
			log.Println("Connected to Redis")
			defer rdb.Close()
		}
	} else {
		log.Printf("Invalid REDIS_URL, running without queue: %v", err)
	}

	if err := waitForItemsTable(ctx, dbPool); err != nil {
		log.Fatalf("Failed waiting for items table: %v", err)
	}
	log.Println("Items table found")

	if err := ensureSchema(ctx, dbPool); err != nil {
		log.Fatalf("Failed to create schema: %v", err)
	}
	log.Println("Database schema ready")

	if rdb != nil {
		go workerLoop(ctx, rdb, dbPool)
	} else {
		log.Println("Worker loop disabled (no Redis connection)")
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /health", handleHealth(dbPool, rdb))

	server := &http.Server{Addr: ":" + port, Handler: mux}
	go func() {
		log.Printf("HTTP server listening on :%s", port)
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("HTTP server error: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Println("Shutting down...")
	cancel()

	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer shutdownCancel()
	server.Shutdown(shutdownCtx)
	log.Println("Shutdown complete")
}

func workerLoop(ctx context.Context, rdb *redis.Client, db *pgxpool.Pool) {
	log.Println("Worker loop started, waiting for jobs on 'jobs:emissions-analysis'")
	for {
		select {
		case <-ctx.Done():
			log.Println("Worker loop stopping")
			return
		default:
		}

		result, err := rdb.BRPop(ctx, 5*time.Second, "jobs:emissions-analysis").Result()
		if err != nil {
			if err == redis.Nil || strings.Contains(err.Error(), "context canceled") {
				continue
			}
			log.Printf("Redis BRPOP error: %v", err)
			time.Sleep(time.Second)
			continue
		}

		payload := result[1]
		var job EmissionsJob
		if err := json.Unmarshal([]byte(payload), &job); err != nil {
			log.Printf("Failed to unmarshal job: %v", err)
			continue
		}

		log.Printf("Processing emissions analysis for item %d (attempt %d)", job.ItemID, job.Attempt)

		if err := processEmissionsJob(ctx, db, &job); err != nil {
			log.Printf("Job failed for item %d: %v", job.ItemID, err)

			if job.Attempt < 3 {
				job.Attempt++
				retryPayload, _ := json.Marshal(job)
				rdb.LPush(ctx, "jobs:emissions-analysis", retryPayload)
				log.Printf("Requeued item %d (attempt %d)", job.ItemID, job.Attempt)
			} else {
				log.Printf("Job permanently failed for item %d after %d attempts", job.ItemID, job.Attempt)
			}
			continue
		}

		log.Printf("Emissions analysis complete for item %d", job.ItemID)
	}
}

func handleHealth(db *pgxpool.Pool, rdb *redis.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		dbOK := db.Ping(r.Context()) == nil
		redisOK := rdb != nil && rdb.Ping(r.Context()).Err() == nil

		status := "ok"
		if !dbOK {
			status = "degraded"
		}

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]any{
			"status":    status,
			"database":  dbOK,
			"redis":     redisOK,
			"timestamp": time.Now().Format(time.RFC3339),
		})
	}
}

func getEnv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
