import { useState } from "react";
import { motion } from "framer-motion";
import {
  FileText,
  MapPin,
  ImagePlus,
  User,
  Mail,
  Phone,
  Home,
  Lock,
  CheckCircle2,
  XCircle,
  Compass,
  Navigation,
  Globe,
  Loader2,
} from "lucide-react";

import { authApi, complaintApi } from "./api";
import { useAuth } from "./AuthContext";
import GisMapModal from "./components/GisMapModal";

/* =========================================================
   CONSTANTS
========================================================= */

const CATEGORIES = [
  "Roads",
  "Water Supply",
  "Electricity",
  "Garbage",
  "Drainage",
  "Street Lights",
  "Public Transport",
  "Other",
];

const PRIORITIES = [
  "Low",
  "Medium",
  "High",
  "Emergency",
];

const ROLES = [
  "Citizen",
  "Government Officer",
  "Department Staff",
  "Admin",
];

/* =========================================================
   VALIDATION REGEX
========================================================= */

// Example:
// user@gmail.com
// sameer@yahoo.com
// person@outlook.com
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Password requirements:
// Minimum 8 characters
// At least 1 uppercase letter
// At least 1 number
// At least 1 special character
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function RegisterComplaint() {
  const {
    user,
    token,
    login,
    logout,
  } = useAuth();

  return (
    <section
      id="login"
      style={{
        minHeight: "100vh",
        padding: "120px 8%",
        background:
          "linear-gradient(135deg,#020617,#0f172a,#111827)",
      }}
    >
      {!user ? (
        <div
          style={{
            maxWidth: "520px",
            margin: "0 auto",
          }}
        >
          <motion.h1
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            style={{
              textAlign: "center",
              fontSize: "48px",
              marginBottom: "12px",
              fontWeight: 800,
              background:
                "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Login to CivicPulse
          </motion.h1>

          <motion.p
            initial={{
              opacity: 0,
              y: 20,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            style={{
              textAlign: "center",
              color: "#94a3b8",
              marginBottom: "40px",
              fontSize: "16px",
            }}
          >
            Please log in or create an account to register and submit your complaint.
          </motion.p>

          <AuthCard onAuthed={login} />
        </div>
      ) : (
        <>
          <motion.h1
            initial={{
              opacity: 0,
              y: 40,
            }}
            animate={{
              opacity: 1,
              y: 0,
            }}
            style={{
              textAlign: "center",
              fontSize: "54px",
              marginBottom: "60px",
              fontWeight: 800,
              background:
                "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            Register & Submit Complaint
          </motion.h1>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit,minmax(420px,1fr))",
              gap: "40px",
            }}
          >
            <ComplaintForm
              token={token}
              user={user}
            />

            <LoggedInCard
              user={user}
              onLogout={logout}
            />
          </div>
        </>
      )}
    </section>
  );
}

/* =========================================================
   COMPLAINT FORM
========================================================= */

function ComplaintForm({ token, user }) {
  const [form, setForm] = useState({
    title: "",
    category: "",
    priority: "",
    location: "",
    description: "",
  });

  const [coords, setCoords] = useState(null);

  const [isGisModalOpen, setIsGisModalOpen] =
    useState(false);

  const [isLocatingGps, setIsLocatingGps] =
    useState(false);

  const [photos, setPhotos] = useState([]);

  const [status, setStatus] = useState({
    state: "idle",
    message: "",
  });

  /* -------------------------------------------------------
     UPDATE FORM
  ------------------------------------------------------- */

  function update(field, value) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  /* -------------------------------------------------------
     GPS LOCATION
  ------------------------------------------------------- */

  const handleQuickGps = () => {
    if (!navigator.geolocation) {
      setStatus({
        state: "error",
        message:
          "Geolocation is not supported by your browser.",
      });

      return;
    }

    setIsLocatingGps(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const {
          latitude,
          longitude,
        } = pos.coords;

        setCoords({
          lat: latitude,
          lng: longitude,
        });

        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );

          const data = await res.json();

          if (
            data &&
            data.display_name
          ) {
            update(
              "location",
              data.display_name
            );
          } else {
            update(
              "location",
              `Lat: ${latitude.toFixed(
                5
              )}, Lng: ${longitude.toFixed(
                5
              )}`
            );
          }
        } catch {
          update(
            "location",
            `Lat: ${latitude.toFixed(
              5
            )}, Lng: ${longitude.toFixed(
              5
            )}`
          );
        } finally {
          setIsLocatingGps(false);
        }
      },

      (err) => {
        console.error(err);

        setStatus({
          state: "error",
          message:
            "Unable to retrieve GPS position. Please check permissions.",
        });

        setIsLocatingGps(false);
      },

      {
        enableHighAccuracy: true,
        timeout: 10000,
      }
    );
  };

  /* -------------------------------------------------------
     IMAGE SELECTION
  ------------------------------------------------------- */

  const handlePhotoChange = (e) => {
    const selectedFiles = Array.from(
      e.target.files || []
    );

    // Maximum 5 images
    if (selectedFiles.length > 5) {
      setStatus({
        state: "error",
        message:
          "You can upload a maximum of 5 images.",
      });

      setPhotos(selectedFiles.slice(0, 5));

      return;
    }

    // Only image files
    const imageFiles =
      selectedFiles.filter((file) =>
        file.type.startsWith("image/")
      );

    if (
      imageFiles.length !==
      selectedFiles.length
    ) {
      setStatus({
        state: "error",
        message:
          "Only image files are allowed.",
      });

      setPhotos(imageFiles.slice(0, 5));

      return;
    }

    // Maximum 5 MB per image
    const oversizedFiles =
      imageFiles.filter(
        (file) =>
          file.size >
          5 * 1024 * 1024
      );

    if (oversizedFiles.length > 0) {
      setStatus({
        state: "error",
        message:
          "Each image must be 5 MB or smaller.",
      });

      setPhotos(
        imageFiles
          .filter(
            (file) =>
              file.size <=
              5 * 1024 * 1024
          )
          .slice(0, 5)
      );

      return;
    }

    setStatus({
      state: "idle",
      message: "",
    });

    setPhotos(
      imageFiles.slice(0, 5)
    );
  };

  /* -------------------------------------------------------
     COMPLAINT SUBMIT
  ------------------------------------------------------- */

  async function handleSubmit(e) {
    e.preventDefault();

    /*
      Complaint validation

      DO NOT check:
      fullName
      email
      phone
      password

      Those belong to RegisterForm.
    */

    if (
      !form.title.trim() ||
      !form.category ||
      !form.priority ||
      !form.location.trim() ||
      !form.description.trim()
    ) {
      setStatus({
        state: "error",
        message:
          "Please fill in all required fields.",
      });

      return;
    }

    /* Description maximum */
    if (
      form.description.length > 356
    ) {
      setStatus({
        state: "error",
        message:
          "Description cannot exceed 356 characters.",
      });

      return;
    }

    /* Maximum images */
    if (photos.length > 5) {
      setStatus({
        state: "error",
        message:
          "You can upload a maximum of 5 images.",
      });

      return;
    }

    setStatus({
      state: "loading",
      message: "",
    });

    try {
      const formData =
        new FormData();

      formData.append(
        "title",
        form.title.trim()
      );

      formData.append(
        "category",
        form.category
      );

      formData.append(
        "priority",
        form.priority
      );

      formData.append(
        "location",
        form.location.trim()
      );

      formData.append(
        "description",
        form.description.trim()
      );

      if (coords) {
        formData.append(
          "latitude",
          String(coords.lat)
        );

        formData.append(
          "longitude",
          String(coords.lng)
        );
      }

      /* Add all selected images */

      photos.forEach((photo) => {
        formData.append(
          "photos",
          photo
        );
      });

      await complaintApi.create(
        formData,
        token
      );

      setStatus({
        state: "success",
        message:
          "Complaint submitted successfully!",
      });

      /* Reset form */

      setForm({
        title: "",
        category: "",
        priority: "",
        location: "",
        description: "",
      });

      setCoords(null);
      setPhotos([]);
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err.message ||
          "Failed to submit complaint.",
      });
    }
  }

  return (
    <>
      <motion.form
        onSubmit={handleSubmit}
        initial={{
          opacity: 0,
          x: -80,
        }}
        animate={{
          opacity: 1,
          x: 0,
        }}
        style={card}
      >
        <h2 style={heading}>
          Complaint Details
        </h2>

        {/* TITLE */}

        <Input
          icon={<FileText />}
          placeholder="Issue Title"
          value={form.title}
          onChange={(e) =>
            update(
              "title",
              e.target.value
            )
          }
        />

        {/* CATEGORY */}

        <select
          style={select}
          value={form.category}
          onChange={(e) =>
            update(
              "category",
              e.target.value
            )
          }
        >
          <option
            value=""
            style={optionStyle}
          >
            Select Category
          </option>

          {CATEGORIES.map(
            (category) => (
              <option
                key={category}
                value={category}
                style={optionStyle}
              >
                {category}
              </option>
            )
          )}
        </select>

        {/* PRIORITY */}

        <select
          style={select}
          value={form.priority}
          onChange={(e) =>
            update(
              "priority",
              e.target.value
            )
          }
        >
          <option
            value=""
            style={optionStyle}
          >
            Select Priority
          </option>

          {PRIORITIES.map(
            (priority) => (
              <option
                key={priority}
                value={priority}
                style={optionStyle}
              >
                {priority}
              </option>
            )
          )}
        </select>

        {/* LOCATION */}

        <div
          style={{
            marginBottom: "18px",
          }}
        >
          <Input
            icon={<MapPin />}
            placeholder="Location address or landmark"
            value={form.location}
            onChange={(e) =>
              update(
                "location",
                e.target.value
              )
            }
          />

          <div
            style={{
              display: "flex",
              gap: "10px",
              marginTop: "-8px",
              marginBottom: "10px",
              flexWrap: "wrap",
            }}
          >
            {/* GPS */}

            <button
              type="button"
              onClick={
                handleQuickGps
              }
              disabled={
                isLocatingGps
              }
              style={
                locationActionButton
              }
            >
              {isLocatingGps ? (
                <Loader2
                  size={15}
                  style={{
                    animation:
                      "spin 1s linear infinite",
                  }}
                />
              ) : (
                <Navigation
                  size={15}
                />
              )}

              <span>
                {isLocatingGps
                  ? "Locating..."
                  : "GPS Location"}
              </span>
            </button>

            {/* GIS */}

            <button
              type="button"
              onClick={() =>
                setIsGisModalOpen(
                  true
                )
              }
              style={{
                ...locationActionButton,
                background:
                  "linear-gradient(90deg, rgba(139, 92, 246, 0.25), rgba(59, 130, 246, 0.25))",
                border:
                  "1px solid rgba(139, 92, 246, 0.5)",
                color: "#c084fc",
              }}
            >
              <Compass
                size={15}
              />

              <span>
                Advanced Location / GIS
              </span>
            </button>
          </div>

          {/* GIS BADGE */}

          {coords && (
            <div
              style={
                gisBadgeStyle
              }
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: "6px",
                }}
              >
                <Globe
                  size={14}
                  style={{
                    color:
                      "#38bdf8",
                  }}
                />

                <span>
                  GIS Pin:{" "}
                  <strong>
                    {coords.lat.toFixed(
                      5
                    )}
                    ° N,{" "}
                    {coords.lng.toFixed(
                      5
                    )}
                    ° E
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setIsGisModalOpen(
                    true
                  )
                }
                style={{
                  background:
                    "none",
                  border: "none",
                  color:
                    "#38bdf8",
                  cursor:
                    "pointer",
                  fontSize:
                    "12px",
                  textDecoration:
                    "underline",
                }}
              >
                View on Map
              </button>
            </div>
          )}
        </div>

        {/* DESCRIPTION */}

        <textarea
          placeholder="Describe your complaint..."
          style={textarea}
          value={
            form.description
          }
          maxLength={356}
          onChange={(e) =>
            update(
              "description",
              e.target.value
            )
          }
        />

        {/* CHARACTER COUNTER */}

        <div
          style={{
            textAlign: "right",
            color:
              form.description
                .length >= 356
                ? "#f87171"
                : "#94a3b8",
            fontSize: "12px",
            marginTop: "-12px",
            marginBottom:
              "12px",
          }}
        >
          {form.description.length}
          /356 characters
        </div>

        {/* PHOTOS */}

        <label style={upload}>
          <ImagePlus />

          {photos.length > 0
            ? `${photos.length} photo(s) selected`
            : "Upload Supporting Photos (Optional)"}

          <input
            type="file"
            multiple
            accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
            hidden
            onChange={
              handlePhotoChange
            }
          />
        </label>

        {/* SUBMIT */}

        <button
          type="submit"
          style={button}
          disabled={
            status.state ===
            "loading"
          }
        >
          {status.state === "loading"
            ? "Submitting..."
            : "Submit Complaint"}
        </button>

        {/* STATUS */}

        <StatusMessage
          status={status}
        />
      </motion.form>

      {/* GIS MODAL */}

      <GisMapModal
        isOpen={
          isGisModalOpen
        }
        onClose={() =>
          setIsGisModalOpen(
            false
          )
        }
        initialCoords={
          coords
        }
        onSelectLocation={(
          data
        ) => {
          update(
            "location",
            data.locationText
          );

          if (
            data.latitude &&
            data.longitude
          ) {
            setCoords({
              lat: data.latitude,
              lng: data.longitude,
            });
          }
        }}
      />
    </>
  );
}

/* =========================================================
   AUTH CARD
========================================================= */

function AuthCard({
  onAuthed,
}) {
  const [mode, setMode] =
    useState("login");

  return (
    <motion.div
      initial={{
        opacity: 0,
        y: 30,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      style={card}
    >
      <h2 style={heading}>
        {mode === "login"
          ? "Login"
          : "Create Account"}
      </h2>

      {mode === "login" ? (
        <LoginForm
          onAuthed={onAuthed}
        />
      ) : (
        <RegisterForm
          onAuthed={onAuthed}
        />
      )}

      <p
        style={{
          textAlign: "center",
          color: "#94a3b8",
          marginTop: 25,
        }}
      >
        {mode === "login"
          ? "Need an account?"
          : "Already have an account?"}

        <span
          onClick={() =>
            setMode(
              mode === "login"
                ? "register"
                : "login"
            )
          }
          style={{
            color: "#3b82f6",
            marginLeft: 6,
            cursor: "pointer",
            fontWeight: 700,
          }}
        >
          {mode === "login"
            ? "Create Account"
            : "Login"}
        </span>
      </p>
    </motion.div>
  );
}

/* =========================================================
   REGISTER FORM
========================================================= */

function RegisterForm({
  onAuthed,
}) {
  const [form, setForm] =
    useState({
      fullName: "",
      email: "",
      phone: "",
      address: "",
      role: "",
      password: "",
      confirmPassword: "",
    });

  const [status, setStatus] =
    useState({
      state: "idle",
      message: "",
    });

  function update(
    field,
    value
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    /* Required fields */

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.password
    ) {
      setStatus({
        state: "error",
        message:
          "Please fill in all required fields.",
      });

      return;
    }

    /* Email */

    if (
      !EMAIL_REGEX.test(
        form.email.trim()
      )
    ) {
      setStatus({
        state: "error",
        message:
          "Please enter a valid email address, for example user@gmail.com.",
      });

      return;
    }

    /* Password */

    if (
      !PASSWORD_REGEX.test(
        form.password
      )
    ) {
      setStatus({
        state: "error",
        message:
          "Password must be at least 8 characters and contain 1 uppercase letter, 1 number, and 1 special character such as @.",
      });

      return;
    }

    /* Confirm password */

    if (
      form.password !==
      form.confirmPassword
    ) {
      setStatus({
        state: "error",
        message:
          "Passwords do not match.",
      });

      return;
    }

    setStatus({
      state: "loading",
      message: "",
    });

    try {
      const data =
        await authApi.register(
          form
        );

      onAuthed(
        data.user,
        data.token
      );

      setStatus({
        state: "success",
        message:
          "Account created!",
      });
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err.message ||
          "Registration failed.",
      });
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      {/* FULL NAME */}

      <Input
        icon={<User />}
        placeholder="Full Name"
        value={form.fullName}
        onChange={(e) =>
          update(
            "fullName",
            e.target.value
          )
        }
      />

      {/* EMAIL */}

      <Input
        icon={<Mail />}
        type="email"
        placeholder="Email Address"
        title="Enter a valid email address such as user@gmail.com"
        value={form.email}
        onChange={(e) =>
          update(
            "email",
            e.target.value
          )
        }
      />

      {/* PHONE */}

      <Input
        icon={<Phone />}
        placeholder="Phone Number"
        value={form.phone}
        onChange={(e) =>
          update(
            "phone",
            e.target.value
          )
        }
      />

      {/* ADDRESS */}

      <Input
        icon={<Home />}
        placeholder="Address"
        value={form.address}
        onChange={(e) =>
          update(
            "address",
            e.target.value
          )
        }
      />

      {/* ROLE */}

      <select
        style={select}
        value={form.role}
        onChange={(e) =>
          update(
            "role",
            e.target.value
          )
        }
      >
        <option
          value=""
          style={optionStyle}
        >
          Select Role
        </option>

        {ROLES.map(
          (role) => (
            <option
              key={role}
              value={role}
              style={optionStyle}
            >
              {role}
            </option>
          )
        )}
      </select>

      {/* PASSWORD */}

      <Input
        icon={<Lock />}
        type="password"
        placeholder="Password"
        title="Password must be at least 8 characters and contain 1 uppercase letter, 1 number, and 1 special character such as @."
        value={form.password}
        onChange={(e) =>
          update(
            "password",
            e.target.value
          )
        }
      />

      {/* CONFIRM PASSWORD */}

      <Input
        icon={<Lock />}
        type="password"
        placeholder="Confirm Password"
        title="Confirm password must exactly match your password."
        value={
          form.confirmPassword
        }
        onChange={(e) =>
          update(
            "confirmPassword",
            e.target.value
          )
        }
      />

      {/* CREATE ACCOUNT */}

      <button
        type="submit"
        style={button}
        disabled={
          status.state ===
          "loading"
        }
      >
        {status.state ===
        "loading"
          ? "Creating..."
          : "Create Account"}
      </button>

      <StatusMessage
        status={status}
      />
    </form>
  );
}

/* =========================================================
   LOGIN FORM
========================================================= */

function LoginForm({
  onAuthed,
}) {
  const [form, setForm] =
    useState({
      email: "",
      password: "",
    });

  const [status, setStatus] =
    useState({
      state: "idle",
      message: "",
    });

  function update(
    field,
    value
  ) {
    setForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  }

  async function handleSubmit(
    e
  ) {
    e.preventDefault();

    if (
      !form.email.trim() ||
      !form.password
    ) {
      setStatus({
        state: "error",
        message:
          "Please enter email and password.",
      });

      return;
    }

    if (
      !EMAIL_REGEX.test(
        form.email.trim()
      )
    ) {
      setStatus({
        state: "error",
        message:
          "Please enter a valid email address.",
      });

      return;
    }

    setStatus({
      state: "loading",
      message: "",
    });

    try {
      const data =
        await authApi.login(
          form
        );

      onAuthed(
        data.user,
        data.token
      );

      setStatus({
        state: "success",
        message: "Logged in!",
      });
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err.message ||
          "Login failed.",
      });
    }
  }

  return (
    <form
      onSubmit={
        handleSubmit
      }
    >
      {/* EMAIL */}

      <Input
        icon={<Mail />}
        type="email"
        placeholder="Email Address"
        title="Enter a valid email address such as user@gmail.com"
        value={form.email}
        onChange={(e) =>
          update(
            "email",
            e.target.value
          )
        }
      />

      {/* PASSWORD */}

      <Input
        icon={<Lock />}
        type="password"
        placeholder="Password"
        value={
          form.password
        }
        onChange={(e) =>
          update(
            "password",
            e.target.value
          )
        }
      />

      <button
        type="submit"
        style={button}
        disabled={
          status.state ===
          "loading"
        }
      >
        {status.state ===
        "loading"
          ? "Logging in..."
          : "Login"}
      </button>

      <StatusMessage
        status={status}
      />
    </form>
  );
}

/* =========================================================
   LOGGED IN CARD
========================================================= */

function LoggedInCard({
  user,
  onLogout,
}) {
  return (
    <motion.div
      initial={{
        opacity: 0,
        x: 80,
      }}
      animate={{
        opacity: 1,
        x: 0,
      }}
      style={card}
    >
      <h2 style={heading}>
        Welcome back
      </h2>

      <div
        style={{
          color: "#e2e8f0",
          marginBottom: 18,
          lineHeight: 1.8,
        }}
      >
        <p>
          <strong>
            Name:
          </strong>{" "}
          {user.fullName}
        </p>

        <p>
          <strong>
            Email:
          </strong>{" "}
          {user.email}
        </p>

        <p>
          <strong>
            Role:
          </strong>{" "}
          {user.role}
        </p>
      </div>

      <p
        style={{
          color: "#94a3b8",
          marginBottom: 25,
        }}
      >
        You're logged in. You can now submit complaints on the left — they'll be linked to your account.
      </p>

      <button
        type="button"
        style={{
          ...button,
          background:
            "rgba(255,255,255,.08)",
        }}
        onClick={onLogout}
      >
        Log Out
      </button>
    </motion.div>
  );
}

/* =========================================================
   STATUS MESSAGE
========================================================= */

function StatusMessage({
  status,
}) {
  if (
    status.state ===
      "idle" ||
    status.state ===
      "loading" ||
    !status.message
  ) {
    return null;
  }

  const isError =
    status.state ===
    "error";

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginTop: 16,
        padding:
          "12px 16px",
        borderRadius: 12,
        background: isError
          ? "rgba(239,68,68,.1)"
          : "rgba(34,197,94,.1)",
        border: `1px solid ${
          isError
            ? "rgba(239,68,68,.3)"
            : "rgba(34,197,94,.3)"
        }`,
        color: isError
          ? "#f87171"
          : "#4ade80",
        fontSize: 14,
      }}
    >
      {isError ? (
        <XCircle
          size={18}
        />
      ) : (
        <CheckCircle2
          size={18}
        />
      )}

      {status.message}
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  icon,
  ...props
}) {
  return (
    <div
      style={inputBox}
    >
      {icon}

      <input
        {...props}
        style={{
          flex: 1,
          background:
            "transparent",
          border: "none",
          color: "white",
          fontSize: "16px",
          outline: "none",
        }}
      />
    </div>
  );
}

/* =========================================================
   STYLES
========================================================= */

const card = {
  background:
    "rgba(255,255,255,.05)",
  backdropFilter:
    "blur(20px)",
  border:
    "1px solid rgba(255,255,255,.08)",
  borderRadius: "25px",
  padding: "40px",
};

const heading = {
  color: "white",
  marginBottom: "30px",
  fontSize: "30px",
};

const inputBox = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  background:
    "rgba(255,255,255,.05)",
  border:
    "1px solid rgba(255,255,255,.08)",
  borderRadius: "15px",
  padding: "16px",
  color: "#3b82f6",
  marginBottom: "18px",
};

const select = {
  width: "100%",
  padding: "16px",
  background:
    "rgba(255,255,255,.05)",
  border:
    "1px solid rgba(255,255,255,.08)",
  borderRadius: "15px",
  color: "white",
  marginBottom: "18px",
};

const optionStyle = {
  background: "#1e293b",
  color: "#ffffff",
  padding: "12px",
};

const textarea = {
  width: "100%",
  height: "140px",
  background:
    "rgba(255,255,255,.05)",
  border:
    "1px solid rgba(255,255,255,.08)",
  borderRadius: "15px",
  color: "white",
  padding: "16px",
  resize: "none",
  marginBottom: "18px",
  boxSizing: "border-box",
};

const upload = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "18px",
  border:
    "2px dashed #3b82f6",
  borderRadius: "15px",
  color: "#3b82f6",
  cursor: "pointer",
  marginBottom: "25px",
};

const button = {
  width: "100%",
  padding: "18px",
  border: "none",
  borderRadius: "50px",
  cursor: "pointer",
  color: "white",
  fontWeight: 700,
  fontSize: "16px",
  background:
    "linear-gradient(90deg,#8b5cf6,#2563eb)",
};

const locationActionButton = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background:
    "rgba(59, 130, 246, 0.15)",
  border:
    "1px solid rgba(59, 130, 246, 0.3)",
  color: "#60a5fa",
  padding:
    "8px 14px",
  borderRadius: "12px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  transition:
    "all 0.2s",
};

const gisBadgeStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent:
    "space-between",
  background:
    "rgba(56, 189, 248, 0.08)",
  border:
    "1px solid rgba(56, 189, 248, 0.25)",
  borderRadius: "12px",
  padding:
    "8px 14px",
  color: "#38bdf8",
  fontSize: "13px",
  marginTop: "6px",
};
