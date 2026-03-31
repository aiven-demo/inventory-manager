import { useState, useEffect, useCallback, useMemo } from "react";
import { Link } from "react-router-dom";
import { ItemSummary } from "../types/item";
import Dashboard from "./Dashboard";

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const ItemList = () => {
  const [items, setItems] = useState<ItemSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [pinInProgress, setPinInProgress] = useState<Record<number, boolean>>(
    {}
  );

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const togglePin = useCallback(
    async (item: ItemSummary, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      try {
        setPinInProgress((prev) => ({ ...prev, [item.id]: true }));

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

        setItems((prevItems) =>
          prevItems.map((i) =>
            i.id === updatedItem.id ? updatedItem : i
          )
        );
      } catch (err) {
        console.error("Error toggling pin status:", err);
      } finally {
        setPinInProgress((prev) => ({ ...prev, [item.id]: false }));
      }
    },
    []
  );

  const fetchItems = useCallback(
    async (search: string, isSearch: boolean = false) => {
      try {
        if (isSearch) {
          setSearching(true);
        } else {
          setLoading(true);
        }

        const params = new URLSearchParams();
        if (search) {
          params.append("search", search);
        }

        const response = await fetch(`/api/items?${params}`);
        if (!response.ok) {
          throw new Error("Failed to fetch items");
        }

        const data = await response.json();
        setItems(data);
      } catch (err) {
        setError("Failed to load inventory items");
        console.error("Error fetching items:", err);
      } finally {
        if (isSearch) {
          setSearching(false);
        } else {
          setLoading(false);
        }
      }
    },
    []
  );

  useEffect(() => {
    fetchItems("", false);
  }, []);

  useEffect(() => {
    if (debouncedSearchTerm !== "") {
      fetchItems(debouncedSearchTerm, true);
    } else if (debouncedSearchTerm === "") {
      fetchItems("", true);
    }
  }, [debouncedSearchTerm, fetchItems]);

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

  const itemCards = useMemo(() => {
    return items.map((item) => (
      <div
        key={item.id}
        className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group border border-gray-200/50 dark:border-gray-700/50"
      >
        <div className="relative overflow-hidden">
          <img
            src={item.image_url}
            alt={item.title}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              e.currentTarget.src =
                "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=400";
            }}
          />
          {item.pinned_at && (
            <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow">
              PINNED
            </div>
          )}
        </div>
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight pr-2">
              {item.title}
            </h2>
            <button
              onClick={(e) => togglePin(item, e)}
              disabled={pinInProgress[item.id]}
              className="flex-shrink-0 flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label={item.pinned_at ? "Unpin item" : "Pin item"}
            >
              {pinInProgress[item.id] ? (
                <span className="animate-pulse text-amber-500">
                  <PinIcon filled />
                </span>
              ) : (
                <span
                  className={
                    item.pinned_at
                      ? "text-amber-500"
                      : "text-gray-400 dark:text-gray-500"
                  }
                >
                  <PinIcon filled={!!item.pinned_at} />
                </span>
              )}
            </button>
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
            {item.description}
          </p>

          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <ClockIcon /> {item.lead_time}d lead
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${getPriorityColor(
                item.priority
              )}`}
            >
              {item.priority}
            </span>
          </div>

          <Link
            to={`/item/${item.id}`}
            className="block w-full text-center bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold text-sm"
          >
            View Details
          </Link>
        </div>
      </div>
    ));
  }, [items, getPriorityColor, pinInProgress, togglePin]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="text-gray-600 dark:text-gray-300 mt-4 text-center">
            Loading inventory...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700 shadow-sm">
          <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
          <button
            onClick={() => fetchItems(debouncedSearchTerm, false)}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-300 font-semibold"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Dashboard items={items} />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Inventory Items
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {items.length} items
          </span>
        </div>
        <div className="max-w-md relative">
          <input
            type="text"
            placeholder="Search inventory..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-300/50 dark:border-gray-600/50 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-12 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm"
          />
          {searching && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 max-w-md mx-auto border border-gray-200 dark:border-gray-700 shadow-sm">
            <p className="text-gray-600 dark:text-gray-300 text-lg">
              No items found.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {itemCards}
        </div>
      )}
    </div>
  );
};

function PinIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        className="w-5 h-5"
      >
        <path d="M16 2H8a1 1 0 0 0-1 1v3.586l-2.707 2.707a1 1 0 0 0-.293.707v2a1 1 0 0 0 1 1h4v6l1 2 1-2v-6h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-.293-.707L14 6.586V3a1 1 0 0 0-1-1z" />
      </svg>
    );
  }
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-5 h-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M16 2H8a1 1 0 0 0-1 1v3.586l-2.707 2.707a1 1 0 0 0-.293.707v2a1 1 0 0 0 1 1h4v6l1 2 1-2v-6h4a1 1 0 0 0 1-1v-2a1 1 0 0 0-.293-.707L14 6.586V3a1 1 0 0 0-1-1z"
      />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={1.5}
      stroke="currentColor"
      className="w-4 h-4"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
      />
    </svg>
  );
}

export default ItemList;
