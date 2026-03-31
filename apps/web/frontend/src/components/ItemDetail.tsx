import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { Item, EmissionsMetrics } from "../types/item";

const ItemDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pinInProgress, setPinInProgress] = useState(false);
  const [metrics, setMetrics] = useState<EmissionsMetrics | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchMetrics = useCallback(async (itemId: string) => {
    try {
      const response = await fetch(`/api/items/${itemId}/metrics`);
      if (response.ok) {
        const data = await response.json();
        setMetrics(data);
        return true;
      }
    } catch (err) {
      console.error("Error fetching metrics:", err);
    }
    return false;
  }, []);

  const startAnalysis = useCallback(async () => {
    if (!id) return;
    setAnalyzing(true);

    try {
      const response = await fetch(`/api/items/${id}/analyze`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to start analysis");

      pollRef.current = setInterval(async () => {
        const found = await fetchMetrics(id);
        if (found) {
          setAnalyzing(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      }, 2000);

      setTimeout(() => {
        if (pollRef.current) {
          clearInterval(pollRef.current);
          setAnalyzing(false);
        }
      }, 30000);
    } catch (err) {
      console.error("Error starting analysis:", err);
      setAnalyzing(false);
    }
  }, [id, fetchMetrics]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const togglePin = useCallback(async () => {
    if (!item) return;

    try {
      setPinInProgress(true);

      const endpoint = item.pinned_at
        ? `/api/items/${item.id}/unpin`
        : `/api/items/${item.id}/pin`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(
          `Failed to ${item.pinned_at ? "unpin" : "pin"} item`
        );
      }

      const updatedItem = await response.json();
      setItem(updatedItem);
    } catch (err) {
      console.error("Error toggling pin status:", err);
    } finally {
      setPinInProgress(false);
    }
  }, [item]);

  const fetchItem = useCallback(async (itemId: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/items/${itemId}`);
      if (!response.ok) {
        throw new Error("Item not found");
      }

      const data = await response.json();
      setItem(data);
    } catch (err) {
      setError("Failed to load item");
      console.error("Error fetching item:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchItem(id);
      fetchMetrics(id);
    }
  }, [id, fetchItem, fetchMetrics]);

  const getPriorityColor = useCallback((priority: string) => {
    switch (priority.toLowerCase()) {
      case "low":
        return "bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200 dark:bg-yellow-900/40 dark:text-yellow-300 dark:border-yellow-700";
      case "high":
        return "bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-300 dark:border-red-700";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600";
    }
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-center">
            Loading item...
          </p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="text-center py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-red-600 dark:text-red-400 mb-4">
            {error || "Item not found"}
          </p>
          <Link
            to="/"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold inline-block"
          >
            Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white mb-6 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm transition-all duration-300"
      >
        ← Back to Inventory
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="relative">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-64 md:h-80 object-cover"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=800";
            }}
          />
          {item.pinned_at && (
            <div className="absolute top-4 right-4 bg-amber-500 text-white text-sm font-bold px-3 py-1.5 rounded-lg shadow-lg">
              PINNED
            </div>
          )}
        </div>

        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {item.title}
            </h1>
            <div className="flex items-center gap-3">
              <button
                onClick={togglePin}
                disabled={pinInProgress}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200 ${
                  item.pinned_at
                    ? "bg-amber-100 text-amber-700 hover:bg-amber-200 dark:bg-amber-900/40 dark:text-amber-300 dark:hover:bg-amber-900/60"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
                aria-label={item.pinned_at ? "Unpin item" : "Pin item"}
              >
                {pinInProgress ? (
                  <span className="animate-pulse">
                    <PinIcon />
                  </span>
                ) : (
                  <PinIcon />
                )}
                {item.pinned_at ? "Unpin" : "Pin"}
              </button>
              <span
                className={`px-3 py-1 rounded-full text-sm font-bold ${getPriorityColor(
                  item.priority
                )}`}
              >
                {item.priority} Priority
              </span>
            </div>
          </div>

          <p className="text-gray-600 dark:text-gray-300 text-lg mb-6">
            {item.description}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                <ClockIcon className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Lead Time
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {item.lead_time} days
              </div>
            </div>
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="text-3xl font-bold text-green-600 mb-2">
                <BoxIcon className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Stock Quantity
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {item.stock_qty} units
              </div>
            </div>
            <div className="text-center p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600">
              <div className="text-3xl font-bold text-purple-600 mb-2">
                <CalendarIcon className="w-8 h-8 mx-auto" />
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Added
              </div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">
                {new Date(item.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          {metrics ? (
            <div className="mb-8 p-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Emissions per Unit
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {metrics.unit_co2} kg
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    CO₂
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {metrics.weight_kg}kg
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Weight
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {metrics.volume_l}L
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Volume
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                    {metrics.transport_co2} kg
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Shipping
                  </div>
                </div>
                <div className="text-center p-3 bg-white dark:bg-gray-800 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                    {metrics.handling_h}h
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Handling
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3 text-right">
                Analyzed {new Date(metrics.analyzed_at).toLocaleString()}
              </p>
            </div>
          ) : (
            <div className="mb-8 p-6 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
              <button
                onClick={startAnalysis}
                disabled={analyzing}
                className={`px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                  analyzing
                    ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
              >
                {analyzing ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Running emissions analysis...
                  </span>
                ) : (
                  "Run Emissions Analysis"
                )}
              </button>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Estimate CO₂ emissions, weight, and logistics metrics from components
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Components
              </h2>
              <ul className="space-y-3">
                {item.components.map((component, index) => (
                  <li key={index} className="flex items-start">
                    <span className="text-blue-600 dark:text-blue-400 mr-3 text-lg">
                      •
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {component}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Handling Procedures
              </h2>
              <ol className="space-y-4">
                {item.procedures.map((procedure, index) => (
                  <li key={index} className="flex">
                    <span className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                      {index + 1}
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">
                      {procedure}
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function PinIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className="w-4 h-4"
    >
      <path d="M16 2H8a1 1 0 0 0-1 1v3.586l-2.707 2.707a1 1 0 0 0-.293.707v2a1 1 0 0 0 1 1h4v6l1 2 1-2v-6h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-.293-.707L14 6.586V3a1 1 0 0 0-1-1z" />
    </svg>
  );
}

function ClockIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

function BoxIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5m8.25 3v6.75m0 0-3-3m3 3 3-3M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"
      />
    </svg>
  );
}

function CalendarIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className={className}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
      />
    </svg>
  );
}

export default ItemDetail;
