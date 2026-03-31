export interface Item {
  id: number;
  title: string;
  description: string;
  components: string[];
  procedures: string[];
  lead_time: number;
  priority: string;
  stock_qty: number;
  image_url: string;
  created_at: string;
  pinned_at: string | null;
}

export interface ItemSummary {
  id: number;
  title: string;
  description: string;
  lead_time: number;
  priority: string;
  stock_qty: number;
  image_url: string;
  created_at: string;
  pinned_at: string | null;
}

export interface CostMetrics {
  item_id: number;
  unit_cost: number;
  weight_kg: number;
  volume_l: number;
  ship_cost: number;
  handling_h: number;
  analyzed_at: string;
}
