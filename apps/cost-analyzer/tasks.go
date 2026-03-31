package main

import (
	"context"
	"fmt"
	"log"
	"math"
	"math/rand"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

type CostAnalysisJob struct {
	ItemID  int `json:"item_id"`
	Attempt int `json:"attempt"`
}

type CostAnalysisResult struct {
	ItemID     int     `json:"item_id"`
	UnitCost   int     `json:"unit_cost"`
	WeightKg   float64 `json:"weight_kg"`
	VolumeL    float64 `json:"volume_l"`
	ShipCost   float64 `json:"ship_cost"`
	HandlingH  float64 `json:"handling_h"`
	AnalyzedAt string  `json:"analyzed_at"`
}

type componentCostInfo struct {
	unitCost  float64
	weightKg  float64
	volumeL   float64
	shipCost  float64
	handlingH float64
}

var costDB = map[string]componentCostInfo{
	"motor":        {8.0, 1.0, 3.0, 2.5, 0.5},
	"bearing":      {3.0, 1.0, 0.5, 0.8, 0.2},
	"encoder":      {12.0, 0.5, 1.0, 1.5, 0.3},
	"housing":      {2.5, 1.0, 4.0, 1.2, 0.3},
	"connector":    {1.5, 0.3, 0.3, 0.3, 0.1},
	"bolt":         {0.2, 1.0, 0.2, 0.5, 0.1},
	"switch":       {15.0, 0.8, 5.0, 3.0, 0.4},
	"chassis":      {6.0, 1.2, 8.0, 4.0, 0.6},
	"module":       {10.0, 0.4, 2.0, 1.8, 0.3},
	"cable":        {0.5, 0.6, 1.0, 0.4, 0.1},
	"bracket":      {1.0, 0.8, 1.5, 0.6, 0.1},
	"pump":         {12.0, 1.5, 5.0, 3.5, 0.7},
	"piston":       {5.0, 1.2, 1.5, 1.5, 0.4},
	"valve":        {4.0, 0.8, 2.0, 1.2, 0.3},
	"mount":        {1.5, 0.6, 2.5, 0.8, 0.2},
	"panel":        {8.0, 0.3, 6.0, 2.0, 0.3},
	"display":      {20.0, 0.4, 8.0, 4.5, 0.4},
	"board":        {15.0, 0.2, 1.0, 1.0, 0.3},
	"adapter":      {3.0, 0.3, 1.0, 0.5, 0.1},
	"wire":         {0.3, 0.8, 0.5, 0.3, 0.05},
	"spool":        {0.5, 1.0, 4.0, 1.5, 0.2},
	"insulation":   {0.2, 0.1, 0.5, 0.1, 0.05},
	"sensor":       {8.0, 0.2, 0.5, 0.8, 0.2},
	"filter":       {2.0, 0.5, 1.5, 0.5, 0.15},
	"capacitor":    {1.0, 0.1, 0.3, 0.2, 0.1},
	"transformer":  {6.0, 2.0, 4.0, 3.0, 0.5},
	"relay":        {2.5, 0.15, 0.3, 0.3, 0.1},
	"battery":      {5.0, 1.5, 3.0, 4.0, 0.6},
	"controller":   {18.0, 0.3, 1.5, 1.5, 0.4},
	"circuit":      {12.0, 0.1, 0.5, 0.8, 0.2},
	"power supply": {4.0, 1.0, 3.0, 2.0, 0.3},
	"steel":        {0.8, 7.8, 1.5, 2.0, 0.3},
	"aluminum":     {1.2, 2.7, 2.0, 1.5, 0.2},
	"copper":       {2.0, 8.9, 1.0, 2.5, 0.15},
	"rubber":       {0.5, 1.1, 1.5, 0.3, 0.1},
	"glass":        {1.5, 2.5, 2.0, 3.0, 0.3},
	"plastic":      {0.3, 0.9, 1.5, 0.2, 0.05},
	"seal":         {1.0, 0.1, 0.2, 0.1, 0.05},
	"gasket":       {0.8, 0.1, 0.2, 0.1, 0.05},
	"spring":       {0.5, 0.3, 0.3, 0.2, 0.05},
	"gear":         {3.0, 1.0, 1.0, 0.8, 0.3},
	"shaft":        {4.0, 2.0, 1.5, 1.5, 0.3},
	"belt":         {1.5, 0.5, 2.0, 0.4, 0.1},
	"lens":         {25.0, 0.1, 0.5, 2.0, 0.4},
	"heatsink":     {2.0, 0.5, 2.0, 0.5, 0.1},
	"fan":          {1.5, 0.3, 1.5, 0.4, 0.1},
	"roller":       {2.0, 1.5, 2.5, 1.0, 0.2},
	"hose":         {0.8, 0.5, 1.5, 0.3, 0.1},
	"clamp":        {0.3, 0.2, 0.3, 0.1, 0.05},
	"pipe":         {1.0, 2.0, 3.0, 1.0, 0.2},
	"foam":         {0.4, 0.1, 3.0, 0.2, 0.05},
	"rail":         {1.0, 1.5, 2.0, 0.8, 0.15},
	"door":         {3.0, 1.8, 6.0, 2.5, 0.4},
	"caster":       {1.0, 0.5, 0.8, 0.3, 0.1},
	"harness":      {2.0, 0.4, 1.0, 0.5, 0.15},
	"card":         {8.0, 0.1, 0.3, 0.5, 0.1},
	"tray":         {1.5, 1.2, 3.0, 1.0, 0.15},
}

var amountRegex = regexp.MustCompile(`(\d+)\s*(g|kg|ml|l|oz)\b`)

func processCostAnalysisJob(ctx context.Context, db *pgxpool.Pool, job *CostAnalysisJob) error {
	var components []string
	var batchSize int
	err := db.QueryRow(ctx,
		"SELECT components, stock_qty FROM items WHERE id = $1",
		job.ItemID,
	).Scan(&components, &batchSize)
	if err != nil {
		return fmt.Errorf("item %d not found: %w", job.ItemID, err)
	}

	if batchSize <= 0 {
		batchSize = 1
	}

	time.Sleep(2 * time.Second)

	result := analyzeComponents(job.ItemID, components, batchSize)

	_, err = db.Exec(ctx, `
		INSERT INTO item_metrics (item_id, unit_cost, weight_kg, volume_l, ship_cost, handling_h, analyzed_at)
		VALUES ($1, $2, $3, $4, $5, $6, NOW())
		ON CONFLICT (item_id)
		DO UPDATE SET unit_cost = $2, weight_kg = $3, volume_l = $4, ship_cost = $5, handling_h = $6, analyzed_at = NOW()
	`, result.ItemID, result.UnitCost, result.WeightKg, result.VolumeL, result.ShipCost, result.HandlingH)
	if err != nil {
		return fmt.Errorf("failed to save cost metrics: %w", err)
	}

	log.Printf("Item %d: $%d cost, %.1fkg weight, %.1fL volume, $%.1f shipping per unit",
		result.ItemID, result.UnitCost, result.WeightKg, result.VolumeL, result.ShipCost)
	return nil
}

func analyzeComponents(itemID int, components []string, batchSize int) CostAnalysisResult {
	var totalCost, totalWeight, totalVolume, totalShip, totalHandling float64

	for _, comp := range components {
		lower := strings.ToLower(comp)
		amount := 100.0

		if matches := amountRegex.FindStringSubmatch(lower); len(matches) > 0 {
			if v, err := strconv.ParseFloat(matches[1], 64); err == nil {
				amount = v
				switch matches[2] {
				case "kg", "l":
					amount *= 1000
				case "oz":
					amount *= 28.35
				}
			}
		}

		for keyword, info := range costDB {
			if strings.Contains(lower, keyword) {
				factor := amount / 100.0
				totalCost += info.unitCost * factor
				totalWeight += info.weightKg * factor
				totalVolume += info.volumeL * factor
				totalShip += info.shipCost * factor
				totalHandling += info.handlingH * factor
				break
			}
		}
	}

	jitter := 0.95 + rand.Float64()*0.1
	s := float64(batchSize)

	return CostAnalysisResult{
		ItemID:    itemID,
		UnitCost:  int(math.Round(totalCost * jitter / s)),
		WeightKg:  math.Round(totalWeight*jitter/s*10) / 10,
		VolumeL:   math.Round(totalVolume*jitter/s*10) / 10,
		ShipCost:  math.Round(totalShip*jitter/s*10) / 10,
		HandlingH: math.Round(totalHandling*jitter/s*10) / 10,
	}
}

func waitForItemsTable(ctx context.Context, db *pgxpool.Pool) error {
	backoff := 10 * time.Second
	const maxBackoff = 5 * time.Minute

	for {
		var exists bool
		err := db.QueryRow(ctx,
			"SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'items')",
		).Scan(&exists)
		if err != nil {
			return fmt.Errorf("failed to check for items table: %w", err)
		}
		if exists {
			return nil
		}

		log.Printf("Items table not found, retrying in %s...", backoff)
		select {
		case <-ctx.Done():
			return ctx.Err()
		case <-time.After(backoff):
		}

		backoff *= 2
		if backoff > maxBackoff {
			backoff = maxBackoff
		}
	}
}

func ensureSchema(ctx context.Context, db *pgxpool.Pool) error {
	_, err := db.Exec(ctx, `
		CREATE TABLE IF NOT EXISTS item_metrics (
			item_id INTEGER PRIMARY KEY REFERENCES items(id),
			unit_cost INTEGER NOT NULL,
			weight_kg NUMERIC(6,1) NOT NULL,
			volume_l NUMERIC(6,1) NOT NULL,
			ship_cost NUMERIC(6,1) NOT NULL,
			handling_h NUMERIC(6,1) NOT NULL,
			analyzed_at TIMESTAMP NOT NULL DEFAULT NOW()
		)
	`)
	return err
}
