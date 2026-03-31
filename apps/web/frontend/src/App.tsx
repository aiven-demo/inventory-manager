import { Routes, Route } from "react-router-dom";
import ItemList from "./components/ItemList";
import ItemDetail from "./components/ItemDetail";
import Header from "./components/Header";
import { useDarkMode } from "./hooks/useDarkMode";

function App() {
  const { isDark, toggle } = useDarkMode();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950 transition-colors duration-300">
      <Header isDark={isDark} onToggle={toggle} />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<ItemList />} />
          <Route path="/item/:id" element={<ItemDetail />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
