import Home from "./pages/Home";
import AdminDashboard from "./components/AdminDashboard";

export default function App() {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

  if (pathname === "/admin") {
    return <AdminDashboard />;
  }

  return <Home />;
}
