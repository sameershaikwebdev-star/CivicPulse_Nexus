import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  XCircle,
  MapPin,
  Compass,
  Trash2,
  RefreshCw,
  Layers,
  LayoutGrid,
  List,
  User,
  Lock,
  Loader2,
  LogOut,
  Building2,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Inbox,
  Image as ImageIcon,
} from "lucide-react";
import { complaintApi, authApi } from "../api";
import GisMapModal from "./GisMapModal";

const CATEGORIES = [
  "All",
  "Roads",
  "Water Supply",
  "Electricity",
  "Garbage",
  "Drainage",
  "Street Lights",
  "Public Transport",
  "Other",
];

const STATUSES = ["All", "Pending", "In Progress", "Resolved", "Rejected"];
const PRIORITIES = ["All", "Emergency", "High", "Medium", "Low"];

// Robust Helper to resolve photo URLs (handles relative uploads / static server URLs / full HTTP URLs)
function getPhotoUrl(photoPath) {
  if (!photoPath) return "";
  if (
    photoPath.startsWith("http://") ||
    photoPath.startsWith("https://") ||
    photoPath.startsWith("data:")
  ) {
    return photoPath;
  }

  const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
  const origin = apiBase.replace(/\/api\/?$/, "");
  const path = photoPath.startsWith("/") ? photoPath : `/${photoPath}`;
  return `${origin}${path}`;
}

export default function AdminDashboard() {
  // Independent Admin Authentication State
  const [adminToken, setAdminToken] = useState(() => localStorage.getItem("civicpulse_admin_token") || "");
  const [adminUser, setAdminUser] = useState(() => {
    const saved = localStorage.getItem("civicpulse_admin_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Admin Login Inputs
  const [adminUsername, setAdminUsername] = useState("sameerShaik");
  const [adminPassword, setAdminPassword] = useState("Sameer@123");
  const [authStatus, setAuthStatus] = useState({ state: "idle", message: "" });

  // Filters & Views
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid");

  // Custom Toast Notification State
  const [toastNotice, setToastNotice] = useState(null);

  // Custom Delete Confirm Modal State
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // GIS Map View Modal State
  const [selectedMapCoords, setSelectedMapCoords] = useState(null);
  const [isMapModalOpen, setIsMapModalOpen] = useState(false);

  // Lightbox Photo Modal State
  const [activePhoto, setActivePhoto] = useState(null);

  const isAdminAuthorized = Boolean(adminToken && adminUser);

  // Show toast notification
  const showToast = (message, type = "success") => {
    setToastNotice({ message, type });
    setTimeout(() => setToastNotice(null), 4000);
  };

  // Fetch REAL complaints from database
  const fetchComplaints = async (showRefreshSpinner = false) => {
    if (!adminToken) return;
    if (showRefreshSpinner) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await complaintApi.list(adminToken);
      const list = data?.complaints || [];
      setComplaints(list);
    } catch (err) {
      console.error("Failed to load live database complaints:", err);
      setComplaints([]);
      showToast("Failed to fetch real database complaints: " + err.message, "error");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isAdminAuthorized) {
      fetchComplaints();
    }
  }, [adminToken, isAdminAuthorized]);

  // Handle Admin Login Submit
  const handleAdminLogin = async (e, customUser, customPass) => {
    if (e) e.preventDefault();

    const usernameToUse = customUser || adminUsername;
    const passwordToUse = customPass || adminPassword;

    if (!usernameToUse || !passwordToUse) {
      setAuthStatus({ state: "error", message: "Please enter Admin Username and Password." });
      return;
    }

    setAuthStatus({ state: "loading", message: "" });

    try {
      const data = await authApi.login({
        email: usernameToUse,
        password: passwordToUse,
      });

      if (
        data.user.role !== "Admin" &&
        data.user.role !== "Government Officer" &&
        data.user.role !== "Department Staff" &&
        data.user.fullName !== "sameerShaik"
      ) {
        setAuthStatus({
          state: "error",
          message: "Access Denied. Account does not have Admin/Officer authorization.",
        });
        return;
      }

      setAdminToken(data.token);
      setAdminUser(data.user);
      localStorage.setItem("civicpulse_admin_token", data.token);
      localStorage.setItem("civicpulse_admin_user", JSON.stringify(data.user));

      setAuthStatus({ state: "success", message: "Authenticated as Infosys Super Admin!" });
      showToast(`Welcome back, ${data.user.fullName || "Admin"}! Authorized for Infosys Command Center.`);
    } catch (err) {
      console.error("Admin login error:", err);
      setAuthStatus({
        state: "error",
        message: err.message || "Invalid Admin Credentials. Only authorized personnel may log in.",
      });
    }
  };

  // Quick Executive Login Helper
  const handleQuickExecutiveLogin = () => {
    setAdminUsername("sameerShaik");
    setAdminPassword("Sameer@123");
    handleAdminLogin(null, "sameerShaik", "Sameer@123");
  };

  // Admin Logout
  const handleAdminLogout = () => {
    setAdminToken("");
    setAdminUser(null);
    localStorage.removeItem("civicpulse_admin_token");
    localStorage.removeItem("civicpulse_admin_user");
    showToast("Logged out of Infosys Admin Portal.");
  };

  // Handle Real Status Update in Database
  const handleUpdateStatus = async (id, newStatus) => {
    setComplaints((prev) =>
      prev.map((c) => (c._id === id ? { ...c, status: newStatus } : c))
    );

    try {
      await complaintApi.updateStatus(id, newStatus, adminToken);
      showToast(`Complaint status updated to "${newStatus}" in database.`);
    } catch (err) {
      console.error("Status update error:", err);
      showToast("Server update error: " + err.message, "error");
      fetchComplaints(true);
    }
  };

  // Confirm & Delete Complaint from Database
  const confirmDelete = async () => {
    if (!deleteTargetId) return;

    const id = deleteTargetId;
    setDeleteTargetId(null);

    setComplaints((prev) => prev.filter((c) => c._id !== id));

    try {
      await complaintApi.remove(id, adminToken);
      showToast("Complaint record permanently deleted from database.");
    } catch (err) {
      console.error("Delete error:", err);
      showToast("Failed to delete complaint: " + err.message, "error");
      fetchComplaints(true);
    }
  };

  // Open Map for Complaint
  const handleOpenMap = (lat, lng) => {
    if (lat && lng) {
      setSelectedMapCoords({ lat, lng });
    } else {
      setSelectedMapCoords({ lat: 20.5937, lng: 78.9629 });
    }
    setIsMapModalOpen(true);
  };

  // Filtered Complaints Logic
  const filteredComplaints = complaints.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.submittedBy?.fullName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "All" || item.status === statusFilter;
    const matchesPriority = priorityFilter === "All" || item.priority === priorityFilter;
    const matchesCategory = categoryFilter === "All" || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Calculate Metrics
  const totalCount = complaints.length;
  const pendingCount = complaints.filter((c) => c.status === "Pending").length;
  const inProgressCount = complaints.filter((c) => c.status === "In Progress").length;
  const resolvedCount = complaints.filter((c) => c.status === "Resolved").length;
  const emergencyCount = complaints.filter((c) => c.priority === "Emergency").length;

  return (
    <section
      id="admin"
      style={{
        minHeight: "100vh",
        padding: "110px 6% 80px",
        background: "linear-gradient(135deg, #020617 0%, #081126 50%, #030816 100%)",
        color: "#f8fafc",
        position: "relative",
      }}
    >
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastNotice && (
          <motion.div
            initial={{ opacity: 0, y: -40, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: -40, x: "-50%" }}
            style={{
              position: "fixed",
              top: "90px",
              left: "50%",
              zIndex: 999999,
              padding: "12px 24px",
              borderRadius: "30px",
              background:
                toastNotice.type === "error"
                  ? "rgba(239, 68, 68, 0.95)"
                  : "linear-gradient(90deg, #0284c7, #3b82f6)",
              backdropFilter: "blur(12px)",
              color: "white",
              fontSize: "14px",
              fontWeight: 700,
              boxShadow: "0 15px 35px rgba(0,0,0,0.5)",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <Sparkles size={18} />
            <span>{toastNotice.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        {!isAdminAuthorized ? (
          <div style={{ maxWidth: "560px", margin: "40px auto 0" }}>
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={adminAuthCardStyle}
            >
              {/* Infosys Header Badge */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={infosysBadgeStyle}>
                  <Building2 size={16} style={{ color: "#38bdf8" }} />
                  <span>INFOSYS SMART GOVERNANCE PORTAL</span>
                </div>

                <h2 style={infosysTitleStyle}>Infosys Admin Access</h2>
                <p style={{ color: "#94a3b8", fontSize: "14px", marginTop: "8px" }}>
                  Dedicated Portal for Authorized Government Officials & Administrators
                </p>
              </div>

              {/* Login Form */}
              <form onSubmit={handleAdminLogin}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={labelStyle}>Admin Username / Email</label>
                  <div style={inputBoxStyle}>
                    <User size={18} style={{ color: "#38bdf8" }} />
                    <input
                      type="text"
                      placeholder="Username (e.g. sameerShaik)"
                      value={adminUsername}
                      onChange={(e) => setAdminUsername(e.target.value)}
                      style={authInputStyle}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: "22px" }}>
                  <label style={labelStyle}>Admin Password</label>
                  <div style={inputBoxStyle}>
                    <Lock size={18} style={{ color: "#38bdf8" }} />
                    <input
                      type="password"
                      placeholder="Password (e.g. Sameer@123)"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      style={authInputStyle}
                    />
                  </div>
                </div>

                {authStatus.message && (
                  <div
                    style={{
                      padding: "12px 16px",
                      borderRadius: "12px",
                      marginBottom: "18px",
                      fontSize: "13px",
                      background:
                        authStatus.state === "error"
                          ? "rgba(239,68,68,0.15)"
                          : "rgba(34,197,94,0.15)",
                      border: `1px solid ${
                        authStatus.state === "error"
                          ? "rgba(239,68,68,0.3)"
                          : "rgba(34,197,94,0.3)"
                      }`,
                      color: authStatus.state === "error" ? "#f87171" : "#4ade80",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {authStatus.state === "error" ? <ShieldAlert size={16} /> : <CheckCircle2 size={16} />}
                    {authStatus.message}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authStatus.state === "loading"}
                  style={infosysPrimaryBtnStyle}
                >
                  {authStatus.state === "loading" ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      <span>Sign In to Infosys Admin Portal</span>
                      <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>

              {/* Quick One-Click Executive Login Box */}
              <div style={quickLoginBoxStyle}>
                <div style={{ fontSize: "12px", color: "#38bdf8", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Authorized Admin Credentials
                </div>
                <div style={{ color: "#e2e8f0", fontSize: "13px", margin: "6px 0 10px" }}>
                  Username: <strong style={{ color: "white" }}>sameerShaik</strong> | Password: <strong style={{ color: "white" }}>Sameer@123</strong>
                </div>
                <button
                  type="button"
                  onClick={handleQuickExecutiveLogin}
                  style={quickLoginBtnStyle}
                >
                  <Sparkles size={14} />
                  <span>One-Click Executive Admin Login (sameerShaik)</span>
                </button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* When Logged In as Admin -> Full Infosys Admin Dashboard */
          <>
            {/* Top Header Banner */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              style={headerContainerStyle}
            >
              <div>
                <div style={badgePillStyle}>
                  <Building2 size={16} style={{ color: "#38bdf8" }} />
                  <span>INFOSYS SMART GOVERNANCE CONTROL CENTER</span>
                </div>
                <h1 style={titleStyle}>Admin Command Portal</h1>
                <p style={{ color: "#94a3b8", margin: "6px 0 0", fontSize: "15px" }}>
                  Real-time civic monitoring, GIS triage, and status management (Database Live Feed)
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                <button
                  onClick={() => fetchComplaints(true)}
                  disabled={refreshing}
                  style={refreshButtonStyle}
                >
                  <RefreshCw
                    size={16}
                    style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }}
                  />
                  <span>{refreshing ? "Syncing..." : "Refresh Feed"}</span>
                </button>

                <div style={userBadgeStyle}>
                  <ShieldCheck size={18} style={{ color: "#38bdf8" }} />
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 700, color: "white" }}>
                      {adminUser?.fullName || "sameerShaik"}
                    </div>
                    <div style={{ fontSize: "11px", color: "#38bdf8", fontWeight: 600 }}>
                      Infosys Super Admin
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAdminLogout}
                  style={logoutBtnStyle}
                  title="Logout from Admin Portal"
                >
                  <LogOut size={16} />
                  <span>Logout</span>
                </button>
              </div>
            </motion.div>

            {/* Metrics Grid */}
            <div style={metricsGridStyle}>
              <MetricCard
                title="Total Complaints"
                value={totalCount}
                subtitle="Real DB registered cases"
                icon={<Layers size={22} style={{ color: "#3b82f6" }} />}
                glowColor="rgba(59, 130, 246, 0.2)"
                borderColor="rgba(59, 130, 246, 0.3)"
              />
              <MetricCard
                title="Pending Review"
                value={pendingCount}
                subtitle="Awaiting dispatch"
                icon={<Clock size={22} style={{ color: "#f59e0b" }} />}
                glowColor="rgba(245, 158, 11, 0.2)"
                borderColor="rgba(245, 158, 11, 0.3)"
              />
              <MetricCard
                title="In Progress"
                value={inProgressCount}
                subtitle="Active field work"
                icon={<RefreshCw size={22} style={{ color: "#a855f7" }} />}
                glowColor="rgba(168, 85, 247, 0.2)"
                borderColor="rgba(168, 85, 247, 0.3)"
              />
              <MetricCard
                title="Resolved Issues"
                value={resolvedCount}
                subtitle="Successfully closed"
                icon={<CheckCircle2 size={22} style={{ color: "#10b981" }} />}
                glowColor="rgba(16, 185, 129, 0.2)"
                borderColor="rgba(16, 185, 129, 0.3)"
              />
              <MetricCard
                title="Emergency Alerts"
                value={emergencyCount}
                subtitle="Critical priority"
                icon={<AlertTriangle size={22} style={{ color: "#ef4444" }} />}
                glowColor="rgba(239, 68, 68, 0.25)"
                borderColor="rgba(239, 68, 68, 0.4)"
              />
            </div>

            {/* Control Toolbar: Search + Filter Tabs + View Switcher */}
            <div style={toolbarCardStyle}>
              {/* Search Box */}
              <div style={searchWrapperStyle}>
                <Search size={18} style={{ color: "#64748b" }} />
                <input
                  type="text"
                  placeholder="Search by title, location, description, or submitter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={searchInputStyle}
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery("")} style={clearSearchBtnStyle}>
                    <XCircle size={16} />
                  </button>
                )}
              </div>

              {/* Filter Dropdowns & Pills */}
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                {/* Status Pills */}
                <div style={filterPillGroupStyle}>
                  {STATUSES.map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      style={{
                        ...filterPillStyle,
                        background:
                          statusFilter === st
                            ? "linear-gradient(90deg, #0284c7, #3b82f6)"
                            : "transparent",
                        color: statusFilter === st ? "white" : "#94a3b8",
                      }}
                    >
                      {st}
                    </button>
                  ))}
                </div>

                {/* Category Select */}
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  style={dropdownSelectStyle}
                >
                  <option value="All">All Categories</option>
                  {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                    <option key={cat} value={cat} style={{ background: "#0f172a", color: "white" }}>
                      {cat}
                    </option>
                  ))}
                </select>

                {/* Priority Select */}
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  style={dropdownSelectStyle}
                >
                  <option value="All">All Priorities</option>
                  {PRIORITIES.filter((p) => p !== "All").map((pr) => (
                    <option key={pr} value={pr} style={{ background: "#0f172a", color: "white" }}>
                      {pr} Priority
                    </option>
                  ))}
                </select>

                {/* View Switcher */}
                <div style={viewToggleGroupStyle}>
                  <button
                    onClick={() => setViewMode("grid")}
                    style={{
                      ...viewToggleBtnStyle,
                      background: viewMode === "grid" ? "rgba(59,130,246,0.3)" : "transparent",
                      color: viewMode === "grid" ? "#60a5fa" : "#64748b",
                    }}
                    title="Grid View"
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    style={{
                      ...viewToggleBtnStyle,
                      background: viewMode === "table" ? "rgba(59,130,246,0.3)" : "transparent",
                      color: viewMode === "table" ? "#60a5fa" : "#64748b",
                    }}
                    title="Table View"
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>
            </div>

            {/* Results Counter Bar */}
            <div style={resultsBarStyle}>
              <div>
                Showing <strong>{filteredComplaints.length}</strong> of <strong>{complaints.length}</strong> real database complaints
              </div>
              {(statusFilter !== "All" || priorityFilter !== "All" || categoryFilter !== "All" || searchQuery) && (
                <button
                  onClick={() => {
                    setStatusFilter("All");
                    setPriorityFilter("All");
                    setCategoryFilter("All");
                    setSearchQuery("");
                  }}
                  style={{ background: "none", border: "none", color: "#60a5fa", cursor: "pointer", fontSize: "13px" }}
                >
                  Clear all filters
                </button>
              )}
            </div>

            {/* Main Complaints List / Grid */}
            {loading ? (
              <div style={loadingBoxStyle}>
                <Loader2 size={36} className="animate-spin" style={{ color: "#38bdf8", marginBottom: "12px" }} />
                <p style={{ color: "#94a3b8" }}>Fetching real complaints from database...</p>
              </div>
            ) : filteredComplaints.length === 0 ? (
              <div style={emptyBoxStyle}>
                <Inbox size={48} style={{ color: "#38bdf8", marginBottom: "12px" }} />
                <h3 style={{ color: "white", fontSize: "20px", marginBottom: "6px" }}>No complaints in database</h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "420px", margin: "0 auto" }}>
                  {complaints.length === 0
                    ? "There are currently no real complaints registered in the database. When citizens submit complaints above, they will appear here in real-time."
                    : "No complaints match your current filter selections. Try clearing your search query or filters."}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View Cards */
              <div style={gridContainerStyle}>
                {filteredComplaints.map((item) => (
                  <ComplaintCard
                    key={item._id}
                    item={item}
                    onUpdateStatus={handleUpdateStatus}
                    onDelete={(id) => setDeleteTargetId(id)}
                    onOpenMap={handleOpenMap}
                    onOpenPhoto={setActivePhoto}
                  />
                ))}
              </div>
            ) : (
              /* Table View */
              <div style={tableWrapperStyle}>
                <table style={tableStyle}>
                  <thead>
                    <tr style={tableHeaderRowStyle}>
                      <th style={thStyle}>Issue Details</th>
                      <th style={thStyle}>Category</th>
                      <th style={thStyle}>Priority</th>
                      <th style={thStyle}>Photos</th>
                      <th style={thStyle}>Location & GIS</th>
                      <th style={thStyle}>Submitted By</th>
                      <th style={thStyle}>Status Action</th>
                      <th style={thStyle}>Manage</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComplaints.map((item) => (
                      <tr key={item._id} style={tableRowStyle}>
                        <td style={tdStyle}>
                          <div style={{ fontWeight: 700, color: "white", fontSize: "14px" }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "4px" }}>
                            {item.description.length > 80
                              ? item.description.substring(0, 80) + "..."
                              : item.description}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <span style={categoryBadgeStyle}>{item.category}</span>
                        </td>
                        <td style={tdStyle}>
                          <PriorityBadge priority={item.priority} />
                        </td>
                        <td style={tdStyle}>
                          {item.photos && item.photos.length > 0 ? (
                            <div style={{ display: "flex", gap: "4px" }}>
                              {item.photos.map((p, idx) => (
                                <img
                                  key={idx}
                                  src={getPhotoUrl(p)}
                                  alt="attachment"
                                  onClick={() => setActivePhoto(p)}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    objectFit: "cover",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    border: "1px solid rgba(255, 255, 255, 0.2)",
                                  }}
                                />
                              ))}
                            </div>
                          ) : (
                            <span style={{ fontSize: "11px", color: "#64748b" }}>No Photo</span>
                          )}
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "13px", color: "#cbd5e1" }}>{item.location}</div>
                          <button
                            onClick={() => handleOpenMap(item.latitude, item.longitude)}
                            style={miniMapBtnStyle}
                          >
                            <Compass size={13} />
                            <span>Map Pin</span>
                          </button>
                        </td>
                        <td style={tdStyle}>
                          <div style={{ fontSize: "13px", fontWeight: 600 }}>
                            {item.submittedBy?.fullName || "Anonymous"}
                          </div>
                          <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                            {new Date(item.createdAt).toLocaleDateString()}
                          </div>
                        </td>
                        <td style={tdStyle}>
                          <StatusSelector
                            status={item.status}
                            onChange={(ns) => handleUpdateStatus(item._id, ns)}
                          />
                        </td>
                        <td style={tdStyle}>
                          <button
                            onClick={() => setDeleteTargetId(item._id)}
                            style={deleteIconBtnStyle}
                            title="Delete complaint"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* GIS Location Viewer Modal */}
      <GisMapModal
        isOpen={isMapModalOpen}
        onClose={() => setIsMapModalOpen(false)}
        initialCoords={selectedMapCoords}
        onSelectLocation={() => {}}
      />

      {/* Lightbox Photo Modal */}
      <AnimatePresence>
        {activePhoto && (
          <div style={photoLightboxBackdrop} onClick={() => setActivePhoto(null)}>
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              style={photoLightboxCard}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={getPhotoUrl(activePhoto)}
                alt="Complaint attachment"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=800&auto=format&fit=crop&q=80";
                }}
                style={{ width: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "12px" }}
              />
              <button onClick={() => setActivePhoto(null)} style={closePhotoBtnStyle}>
                Close Image
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Glassmorphic Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteTargetId && (
          <div style={modalBackdropStyle}>
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              style={confirmModalCardStyle}
            >
              <div style={{ textAlign: "center", marginBottom: "16px" }}>
                <div style={deleteWarningIconStyle}>
                  <Trash2 size={24} style={{ color: "#ef4444" }} />
                </div>
                <h3 style={{ color: "white", fontSize: "20px", fontWeight: 700, margin: "12px 0 6px" }}>
                  Confirm Removal
                </h3>
                <p style={{ color: "#94a3b8", fontSize: "14px", margin: 0 }}>
                  Are you sure you want to permanently delete this civic complaint record from MongoDB?
                </p>
              </div>

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  onClick={() => setDeleteTargetId(null)}
                  style={cancelModalBtnStyle}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  style={confirmDeleteModalBtnStyle}
                >
                  Confirm Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

/* ---------------- Sub-Components ---------------- */

function MetricCard({ title, value, subtitle, icon, glowColor, borderColor }) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      style={{
        ...metricCardStyle,
        borderColor: borderColor,
        boxShadow: `0 10px 30px -10px ${glowColor}`,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: "13px", color: "#94a3b8", fontWeight: 600 }}>{title}</div>
          <div style={{ fontSize: "32px", fontWeight: 800, color: "white", margin: "4px 0" }}>
            {value}
          </div>
          <div style={{ fontSize: "12px", color: "#64748b" }}>{subtitle}</div>
        </div>
        <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(255,255,255,0.05)" }}>
          {icon}
        </div>
      </div>
    </motion.div>
  );
}

function ComplaintCard({ item, onUpdateStatus, onDelete, onOpenMap, onOpenPhoto }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      whileHover={{ y: -4 }}
      style={complaintCardStyle}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <span style={categoryBadgeStyle}>{item.category}</span>
        <PriorityBadge priority={item.priority} />
      </div>

      <h3 style={{ color: "white", fontSize: "18px", fontWeight: 700, margin: "0 0 8px", lineHeight: 1.3 }}>
        {item.title}
      </h3>

      <p style={{ color: "#94a3b8", fontSize: "14px", margin: "0 0 14px", lineHeight: 1.5 }}>
        {item.description}
      </p>

      {/* Render Photos using getPhotoUrl */}
      {item.photos && item.photos.length > 0 && (
        <div style={{ display: "flex", gap: "8px", marginBottom: "14px", flexWrap: "wrap" }}>
          {item.photos.map((url, i) => (
            <img
              key={i}
              src={getPhotoUrl(url)}
              alt="attachment"
              onClick={() => onOpenPhoto(url)}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = "https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=400&auto=format&fit=crop&q=80";
              }}
              style={thumbnailStyle}
            />
          ))}
        </div>
      )}

      <div style={locationBoxStyle}>
        <MapPin size={15} style={{ color: "#38bdf8", flexShrink: 0 }} />
        <span style={{ flex: 1, fontSize: "13px", color: "#e2e8f0" }}>{item.location}</span>
        <button
          onClick={() => onOpenMap(item.latitude, item.longitude)}
          style={gisBtnStyle}
          title="Open in Advanced GIS Map"
        >
          <Compass size={14} />
          <span>GIS</span>
        </button>
      </div>

      <div style={submitterBoxStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <User size={14} style={{ color: "#94a3b8" }} />
          <span style={{ fontSize: "13px", color: "#cbd5e1", fontWeight: 600 }}>
            {item.submittedBy?.fullName || "Citizen User"}
          </span>
        </div>
        <span style={{ fontSize: "12px", color: "#64748b" }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </span>
      </div>

      <div style={cardFooterStyle}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: "11px", color: "#94a3b8", textTransform: "uppercase", fontWeight: 700, marginBottom: "4px" }}>
            Update Status
          </div>
          <StatusSelector
            status={item.status}
            onChange={(ns) => onUpdateStatus(item._id, ns)}
          />
        </div>

        <button
          onClick={() => onDelete(item._id)}
          style={deleteBtnStyle}
          title="Delete Complaint"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </motion.div>
  );
}

function PriorityBadge({ priority }) {
  let bg = "rgba(100, 116, 139, 0.2)";
  let border = "rgba(100, 116, 139, 0.4)";
  let color = "#94a3b8";

  if (priority === "Emergency") {
    bg = "rgba(239, 68, 68, 0.2)";
    border = "rgba(239, 68, 68, 0.5)";
    color = "#f87171";
  } else if (priority === "High") {
    bg = "rgba(249, 115, 22, 0.2)";
    border = "rgba(249, 115, 22, 0.5)";
    color = "#fb923c";
  } else if (priority === "Medium") {
    bg = "rgba(59, 130, 246, 0.2)";
    border = "rgba(59, 130, 246, 0.4)";
    color = "#60a5fa";
  }

  return (
    <span
      style={{
        padding: "4px 10px",
        borderRadius: "20px",
        fontSize: "11px",
        fontWeight: 700,
        textTransform: "uppercase",
        letterSpacing: "0.5px",
        background: bg,
        border: `1px solid ${border}`,
        color: color,
      }}
    >
      {priority}
    </span>
  );
}

function StatusSelector({ status, onChange }) {
  let accent = "#f59e0b";
  if (status === "In Progress") accent = "#a855f7";
  if (status === "Resolved") accent = "#10b981";
  if (status === "Rejected") accent = "#ef4444";

  return (
    <select
      value={status}
      onChange={(e) => onChange(e.target.value)}
      style={{
        padding: "8px 12px",
        borderRadius: "10px",
        border: `1px solid ${accent}66`,
        background: `${accent}18`,
        color: accent,
        fontSize: "13px",
        fontWeight: 700,
        cursor: "pointer",
        outline: "none",
      }}
    >
      <option value="Pending" style={optionItemStyle}>
        ⏳ Pending
      </option>
      <option value="In Progress" style={optionItemStyle}>
        🔄 In Progress
      </option>
      <option value="Resolved" style={optionItemStyle}>
        ✅ Resolved
      </option>
      <option value="Rejected" style={optionItemStyle}>
        ❌ Rejected
      </option>
    </select>
  );
}

/* ---------------- Styles ---------------- */

const adminAuthCardStyle = {
  background: "linear-gradient(145deg, rgba(15, 23, 42, 0.95), rgba(8, 17, 38, 0.95))",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(56, 189, 248, 0.25)",
  borderRadius: "28px",
  padding: "36px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 40px rgba(56, 189, 248, 0.15)",
};

const infosysBadgeStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(56, 189, 248, 0.12)",
  border: "1px solid rgba(56, 189, 248, 0.35)",
  color: "#38bdf8",
  padding: "6px 16px",
  borderRadius: "30px",
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "1px",
  marginBottom: "12px",
};

const infosysTitleStyle = {
  fontSize: "30px",
  fontWeight: 800,
  margin: 0,
  background: "linear-gradient(90deg, #38bdf8, #60a5fa, #c084fc)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const labelStyle = {
  display: "block",
  fontSize: "13px",
  fontWeight: 600,
  color: "#cbd5e1",
  marginBottom: "6px",
};

const inputBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background: "rgba(2, 6, 23, 0.7)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  padding: "14px 16px",
};

const authInputStyle = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "15px",
  outline: "none",
};

const infosysPrimaryBtnStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "50px",
  border: "none",
  background: "linear-gradient(90deg, #0284c7, #2563eb, #7c3aed)",
  color: "white",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "10px",
  boxShadow: "0 10px 25px -5px rgba(2, 132, 199, 0.5)",
  marginTop: "10px",
};

const quickLoginBoxStyle = {
  marginTop: "24px",
  padding: "18px",
  background: "rgba(56, 189, 248, 0.05)",
  border: "1px dashed rgba(56, 189, 248, 0.3)",
  borderRadius: "18px",
  textAlign: "center",
};

const quickLoginBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(56, 189, 248, 0.15)",
  border: "1px solid rgba(56, 189, 248, 0.4)",
  color: "#38bdf8",
  padding: "10px 18px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: 700,
  cursor: "pointer",
};

const logoutBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#f87171",
  padding: "10px 16px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const headerContainerStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "32px",
  flexWrap: "wrap",
  gap: "16px",
};

const badgePillStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(56, 189, 248, 0.1)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  color: "#38bdf8",
  padding: "5px 12px",
  borderRadius: "30px",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "1px",
  marginBottom: "8px",
};

const titleStyle = {
  fontSize: "38px",
  fontWeight: 800,
  margin: 0,
  background: "linear-gradient(90deg, #38bdf8, #60a5fa, #c084fc)",
  WebkitBackgroundClip: "text",
  color: "transparent",
};

const refreshButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(59, 130, 246, 0.15)",
  border: "1px solid rgba(59, 130, 246, 0.3)",
  color: "#60a5fa",
  padding: "10px 18px",
  borderRadius: "14px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
};

const userBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(15, 23, 42, 0.8)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  padding: "8px 16px",
  borderRadius: "14px",
};

const metricsGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: "18px",
  marginBottom: "28px",
};

const metricCardStyle = {
  background: "rgba(15, 23, 42, 0.75)",
  backdropFilter: "blur(12px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "20px",
  padding: "20px",
  transition: "all 0.2s ease",
};

const toolbarCardStyle = {
  background: "rgba(15, 23, 42, 0.85)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "20px",
  padding: "18px",
  marginBottom: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const searchWrapperStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "rgba(2, 6, 23, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  padding: "12px 16px",
};

const searchInputStyle = {
  flex: 1,
  background: "transparent",
  border: "none",
  color: "white",
  fontSize: "14px",
  outline: "none",
};

const clearSearchBtnStyle = {
  background: "none",
  border: "none",
  color: "#64748b",
  cursor: "pointer",
};

const filterPillGroupStyle = {
  display: "flex",
  gap: "6px",
  background: "rgba(2, 6, 23, 0.5)",
  padding: "4px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  flexWrap: "wrap",
};

const filterPillStyle = {
  padding: "6px 14px",
  borderRadius: "8px",
  border: "none",
  fontSize: "12px",
  fontWeight: 600,
  cursor: "pointer",
  transition: "all 0.2s",
};

const dropdownSelectStyle = {
  background: "rgba(15, 23, 42, 0.9)",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  color: "#e2e8f0",
  padding: "8px 14px",
  borderRadius: "12px",
  fontSize: "13px",
  outline: "none",
  cursor: "pointer",
};

const viewToggleGroupStyle = {
  display: "flex",
  gap: "4px",
  background: "rgba(2, 6, 23, 0.5)",
  padding: "4px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  marginLeft: "auto",
};

const viewToggleBtnStyle = {
  padding: "6px 10px",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const resultsBarStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "18px",
  color: "#94a3b8",
  fontSize: "13px",
};

const gridContainerStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))",
  gap: "20px",
};

const complaintCardStyle = {
  background: "rgba(15, 23, 42, 0.8)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "22px",
  padding: "22px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.5)",
};

const categoryBadgeStyle = {
  background: "rgba(139, 92, 246, 0.15)",
  border: "1px solid rgba(139, 92, 246, 0.3)",
  color: "#c084fc",
  padding: "4px 10px",
  borderRadius: "20px",
  fontSize: "11px",
  fontWeight: 700,
};

const thumbnailStyle = {
  width: "54px",
  height: "54px",
  objectFit: "cover",
  borderRadius: "10px",
  cursor: "pointer",
  border: "1px solid rgba(255, 255, 255, 0.2)",
};

const locationBoxStyle = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "rgba(2, 6, 23, 0.5)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  borderRadius: "12px",
  padding: "8px 12px",
  marginBottom: "12px",
};

const gisBtnStyle = {
  display: "flex",
  alignItems: "center",
  gap: "4px",
  background: "rgba(56, 189, 248, 0.15)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  color: "#38bdf8",
  padding: "4px 8px",
  borderRadius: "8px",
  fontSize: "11px",
  fontWeight: 700,
  cursor: "pointer",
};

const submitterBoxStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  paddingTop: "10px",
  borderTop: "1px solid rgba(255, 255, 255, 0.06)",
  marginBottom: "14px",
};

const cardFooterStyle = {
  display: "flex",
  alignItems: "flex-end",
  gap: "12px",
};

const deleteBtnStyle = {
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  color: "#f87171",
  width: "36px",
  height: "36px",
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};

const deleteIconBtnStyle = {
  ...deleteBtnStyle,
  width: "32px",
  height: "32px",
};

const optionItemStyle = {
  background: "#0f172a",
  color: "white",
  padding: "8px",
};

const tableWrapperStyle = {
  background: "rgba(15, 23, 42, 0.8)",
  backdropFilter: "blur(16px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "20px",
  overflow: "hidden",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left",
};

const tableHeaderRowStyle = {
  background: "rgba(2, 6, 23, 0.7)",
  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
};

const thStyle = {
  padding: "16px",
  fontSize: "12px",
  fontWeight: 700,
  color: "#94a3b8",
  textTransform: "uppercase",
  letterSpacing: "0.5px",
};

const tableRowStyle = {
  borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
};

const tdStyle = {
  padding: "16px",
  verticalAlign: "middle",
};

const miniMapBtnStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
  background: "rgba(56, 189, 248, 0.15)",
  border: "1px solid rgba(56, 189, 248, 0.3)",
  color: "#38bdf8",
  padding: "3px 8px",
  borderRadius: "6px",
  fontSize: "11px",
  fontWeight: 600,
  marginTop: "4px",
  cursor: "pointer",
};

const loadingBoxStyle = {
  textAlign: "center",
  padding: "60px 20px",
  background: "rgba(15, 23, 42, 0.5)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const emptyBoxStyle = {
  textAlign: "center",
  padding: "60px 20px",
  background: "rgba(15, 23, 42, 0.5)",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.08)",
};

const photoLightboxBackdrop = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(2, 6, 23, 0.9)",
  backdropFilter: "blur(12px)",
  zIndex: 999999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const photoLightboxCard = {
  maxWidth: "800px",
  width: "100%",
  background: "#0f172a",
  borderRadius: "20px",
  padding: "16px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "12px",
};

const closePhotoBtnStyle = {
  background: "rgba(255, 255, 255, 0.1)",
  border: "none",
  color: "white",
  padding: "8px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 600,
};

const modalBackdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  background: "rgba(2, 6, 23, 0.85)",
  backdropFilter: "blur(12px)",
  zIndex: 999999,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
};

const confirmModalCardStyle = {
  maxWidth: "440px",
  width: "100%",
  background: "linear-gradient(145deg, #0f172a, #1e293b)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  borderRadius: "24px",
  padding: "28px",
  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)",
};

const deleteWarningIconStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "16px",
  background: "rgba(239, 68, 68, 0.15)",
  border: "1px solid rgba(239, 68, 68, 0.3)",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const cancelModalBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  background: "rgba(255, 255, 255, 0.05)",
  color: "#cbd5e1",
  fontSize: "14px",
  fontWeight: 600,
  cursor: "pointer",
};

const confirmDeleteModalBtnStyle = {
  flex: 1,
  padding: "12px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #ef4444, #dc2626)",
  color: "white",
  fontSize: "14px",
  fontWeight: 700,
  cursor: "pointer",
  boxShadow: "0 8px 20px -4px rgba(239, 68, 68, 0.5)",
};
