import { motion } from "framer-motion";
import CountUp from "react-countup";

const stats = [
  {
    number: 15000,
    suffix: "+",
    title: "Complaints",
    color: "#3b82f6",
  },
  {
    number: 98,
    suffix: "%",
    title: "Resolved",
    color: "#22c55e",
  },
  {
    number: 500,
    suffix: "+",
    title: "Cities",
    color: "#8b5cf6",
  },
  {
    number: 24,
    suffix: "/7",
    title: "Monitoring",
    color: "#06b6d4",
  },
];

export default function Stats() {
  return (
    <section
      id="statistics"
      style={{
        padding: "120px 8%",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          textAlign: "center",
          fontSize: "54px",
          marginBottom: "70px",
          fontWeight: "800",
          background:
            "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Live Platform Statistics
      </motion.h2>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
          gap: "30px",
        }}
      >
        {stats.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.7 }}
            whileInView={{ opacity: 1, scale: 1 }}
            whileHover={{
              y: -15,
              scale: 1.05,
              boxShadow: `0 0 45px ${item.color}`,
            }}
            transition={{
              duration: 0.5,
            }}
            viewport={{ once: true }}
            style={{
              background: "rgba(255,255,255,.05)",
              backdropFilter: "blur(18px)",
              border: "1px solid rgba(255,255,255,.08)",
              borderRadius: "22px",
              padding: "45px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "60px",
                fontWeight: "bold",
                color: item.color,
                marginBottom: "15px",
              }}
            >
              
                {item.number}
                
              {item.suffix}
            </div>

            <h3
              style={{
                fontSize: "24px",
                color: "#fff",
              }}
            >
              {item.title}
            </h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
}