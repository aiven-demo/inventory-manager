const { Router } = require("express");

const CACHE_TTL = 60;

const itemRoutes = (pool, cache, queue) => {
  const router = Router();

  async function invalidateItemListCache() {
    if (!cache) return;
    try {
      const keys = await cache.keys("items:search:*");
      if (keys.length > 0) await cache.del(...keys);
    } catch (err) {
      console.warn("Cache invalidation failed:", err.message);
    }
  }

  router.get("/", async (req, res) => {
    try {
      const { search, limit = 20, offset = 0 } = req.query;

      const cacheKey = `items:search:${search || ""}:${limit}:${offset}`;
      if (cache) {
        try {
          const cached = await cache.get(cacheKey);
          if (cached) {
            return res.json(JSON.parse(cached));
          }
        } catch (err) {
          console.warn("Cache read failed:", err.message);
        }
      }

      let query = `
        SELECT id, title, description, lead_time, priority, stock_qty, image_url, created_at, pinned_at
        FROM items
      `;
      const params = [];

      if (search) {
        query += ` WHERE title ILIKE $1 OR description ILIKE $1`;
        params.push(`%${search}%`);
      }

      query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${
        params.length + 2
      }`;
      params.push(limit, offset);

      const result = await pool.query(query, params);

      if (cache) {
        try {
          await cache.set(cacheKey, JSON.stringify(result.rows), "EX", CACHE_TTL);
        } catch (err) {
          console.warn("Cache write failed:", err.message);
        }
      }

      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching items:", error);
      res.status(500).json({ error: "Failed to fetch items" });
    }
  });

  router.get("/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query("SELECT * FROM items WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching item:", error);
      res.status(500).json({ error: "Failed to fetch item" });
    }
  });

  router.post("/:id/pin", async (req, res) => {
    try {
      const { id } = req.params;

      const checkResult = await pool.query(
        "SELECT id FROM items WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      const query =
        "UPDATE items SET pinned_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      await invalidateItemListCache();

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error pinning item:", error);
      res.status(500).json({ error: "Failed to pin item" });
    }
  });

  router.post("/:id/unpin", async (req, res) => {
    try {
      const { id } = req.params;

      const checkResult = await pool.query(
        "SELECT id FROM items WHERE id = $1",
        [id]
      );

      if (checkResult.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      const query =
        "UPDATE items SET pinned_at = NULL WHERE id = $1 RETURNING *";
      const result = await pool.query(query, [id]);

      await invalidateItemListCache();

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error unpinning item:", error);
      res.status(500).json({ error: "Failed to unpin item" });
    }
  });

  router.get("/:id/metrics", async (req, res) => {
    try {
      const { id } = req.params;
      const result = await pool.query(
        "SELECT item_id, unit_co2, weight_kg, volume_l, transport_co2, handling_h, analyzed_at FROM item_metrics WHERE item_id = $1",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Emissions metrics not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ error: "Failed to fetch emissions metrics" });
    }
  });

  router.post("/:id/analyze", async (req, res) => {
    try {
      const { id } = req.params;

      const check = await pool.query("SELECT id FROM items WHERE id = $1", [id]);
      if (check.rows.length === 0) {
        return res.status(404).json({ error: "Item not found" });
      }

      if (!queue) {
        return res.status(503).json({ error: "Job queue unavailable" });
      }

      const job = JSON.stringify({ item_id: parseInt(id), attempt: 1 });
      await queue.lpush("jobs:emissions-analysis", job);

      res.json({ status: "queued", item_id: parseInt(id) });
    } catch (error) {
      console.error("Error enqueuing analysis:", error);
      res.status(500).json({ error: "Failed to enqueue analysis" });
    }
  });

  return router;
};

module.exports = { itemRoutes };
