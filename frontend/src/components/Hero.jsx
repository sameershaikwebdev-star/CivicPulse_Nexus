import { motion } from "framer-motion";
import Earth from "./Earth";

export default function Hero() {
  return (
    <section
      id="home"
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "60px",
        padding: "120px 8%",
        flexWrap: "wrap",
      }}
    >
      {/* Left */}
      <motion.div
        initial={{ x: -80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={{ flex: 1, minWidth: "340px" }}
      >
        <motion.div
          animate={{
            opacity: [0.4, 1, 0.4],
          }}
          transition={{
            repeat: Infinity,
            duration: 2,
          }}
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: "30px",
            background: "rgba(59,130,246,.15)",
            border: "1px solid rgba(59,130,246,.4)",
            color: "#60a5fa",
            marginBottom: "25px",
          }}
        >
          🚀 AI Powered Smart Complaint Platform
        </motion.div>

        <h1
          style={{
            fontSize: "72px",
            lineHeight: 1,
            fontWeight: 800,
          }}
        >
          <span
            style={{
              background:
                "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            CivicPulse
          </span>
        </h1>

        <p
          style={{
            marginTop: "30px",
            color: "#cbd5e1",
            fontSize: "20px",
            lineHeight: 1.8,
            maxWidth: "650px",
          }}
        >
          Report civic problems instantly.
          AI automatically analyzes complaints,
          prioritizes emergencies,
          and forwards them to the correct government department.
        </p>

        <div
          style={{
            display: "flex",
            gap: "20px",
            marginTop: "40px",
            flexWrap: "wrap",
          }}
        >
          <motion.button
            whileHover={{
              scale: 1.08,
              boxShadow: "0 0 40px #3b82f6",
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "18px 40px",
              borderRadius: "40px",
              border: "none",
              cursor: "pointer",
              color: "white",
              fontWeight: "bold",
              background:
                "linear-gradient(90deg,#2563eb,#7c3aed)",
            }}
          >
            Get Started
          </motion.button>

          <motion.button
            whileHover={{
              scale: 1.08,
              borderColor: "#60a5fa",
            }}
            whileTap={{ scale: 0.95 }}
            style={{
              padding: "18px 40px",
              borderRadius: "40px",
              background: "transparent",
              color: "white",
              border: "1px solid rgba(255,255,255,.2)",
              cursor: "pointer",
            }}
          >
            Live Demo
          </motion.button>
        </div>
      </motion.div>

      {/* Right */}
      <motion.div
        initial={{ x: 80, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 1 }}
        style={{
          flex: 1,
          minWidth: "420px",
          height: "600px",
        }}
      >
        <Earth />
      </motion.div>
    </section>
  );
}