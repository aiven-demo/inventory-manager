import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { ItemSummary } from "../types/item";

interface DashboardProps {
  items: ItemSummary[];
}

const PIE_COLORS = ["#22c55e", "#eab308", "#ef4444"];

const Dashboard = ({ items }: DashboardProps) => {
  if (items.length === 0) return null;

  const totalItems = items.length;
  const pinnedItems = items.filter((i) => i.pinned_at).length;
  const avgLeadTime =
    items.reduce((sum, i) => sum + i.lead_time, 0) / totalItems;
  const highPriority = items.filter((i) => i.priority === "High").length;

  const priorityData = [
    {
      name: "Low",
      count: items.filter((i) => i.priority === "Low").length,
    },
    {
      name: "Medium",
      count: items.filter((i) => i.priority === "Medium").length,
    },
    {
      name: "High",
      count: items.filter((i) => i.priority === "High").length,
    },
  ];

  const leadTimeBuckets = [
    {
      range: "0–7d",
      count: items.filter((i) => i.lead_time <= 7).length,
    },
    {
      range: "8–14d",
      count: items.filter(
        (i) => i.lead_time > 7 && i.lead_time <= 14
      ).length,
    },
    {
      range: "15–30d",
      count: items.filter(
        (i) => i.lead_time > 14 && i.lead_time <= 30
      ).length,
    },
    {
      range: "30+d",
      count: items.filter((i) => i.lead_time > 30).length,
    },
  ];

  const topStock = [...items]
    .sort((a, b) => b.stock_qty - a.stock_qty)
    .slice(0, 8)
    .map((i) => ({
      name: i.title.length > 18 ? i.title.substring(0, 18) + "…" : i.title,
      qty: i.stock_qty,
    }));

  return (
    <div className="mb-10">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPICard label="Total Items" value={totalItems} accent="blue" />
        <KPICard label="Pinned" value={pinnedItems} accent="amber" />
        <KPICard
          label="Avg Lead Time"
          value={`${avgLeadTime.toFixed(0)}d`}
          accent="emerald"
        />
        <KPICard label="High Priority" value={highPriority} accent="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartCard title="Priority Distribution">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={4}
                dataKey="count"
                nameKey="name"
              >
                {priorityData.map((_, idx) => (
                  <Cell key={idx} fill={PIE_COLORS[idx]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30,30,30,0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
            {priorityData.map((d, i) => (
              <span key={d.name} className="flex items-center gap-1">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: PIE_COLORS[i] }}
                />
                {d.name} ({d.count})
              </span>
            ))}
          </div>
        </ChartCard>

        <ChartCard title="Lead Time Distribution">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={leadTimeBuckets}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                dataKey="range"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30,30,30,0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Stock Levels">
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topStock} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.3} />
              <XAxis
                type="number"
                tick={{ fill: "#9ca3af", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={110}
                tick={{ fill: "#9ca3af", fontSize: 11 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(30,30,30,0.9)",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Bar dataKey="qty" fill="#14b8a6" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

function KPICard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  const colors: Record<string, string> = {
    blue: "border-blue-500/40 bg-blue-50 dark:bg-blue-950/30",
    amber: "border-amber-500/40 bg-amber-50 dark:bg-amber-950/30",
    emerald: "border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/30",
    red: "border-red-500/40 bg-red-50 dark:bg-red-950/30",
  };
  const textColors: Record<string, string> = {
    blue: "text-blue-700 dark:text-blue-300",
    amber: "text-amber-700 dark:text-amber-300",
    emerald: "text-emerald-700 dark:text-emerald-300",
    red: "text-red-700 dark:text-red-300",
  };

  return (
    <div
      className={`rounded-xl border p-4 ${colors[accent]} transition-colors duration-300`}
    >
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {label}
      </div>
      <div className={`text-2xl font-bold mt-1 ${textColors[accent]}`}>
        {value}
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl p-5 border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
        {title}
      </h3>
      {children}
    </div>
  );
}

export default Dashboard;
