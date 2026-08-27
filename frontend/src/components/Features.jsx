import { motion } from "framer-motion";
import Tilt from "react-parallax-tilt";
import {
  Brain,
  ShieldCheck,
  BellRing,
  BarChart3,
} from "lucide-react";

const features = [
  {
    icon: <Brain size={42} />,
    title: "AI Reports",
    desc: "AI automatically analyzes complaints and categorizes them with smart priority.",
    color: "#8b5cf6",
  },
  {
    icon: <ShieldCheck size={42} />,
    title: "Complaint Tracking",
    desc: "Track every complaint from submission until final resolution in real time.",
    color: "#3b82f6",
  },
  {
    icon: <BellRing size={42} />,
    title: "Emergency Alerts",
    desc: "Critical complaints are instantly routed to the responsible department.",
    color: "#06b6d4",
  },
  {
    icon: <BarChart3 size={42} />,
    title: "Analytics",
    desc: "Visual dashboards help governments understand city-wide complaint trends.",
    color: "#ec4899",
  },
];

export default function Features() {
  return (
    <section
      id="features"
      style={{
        padding: "120px 8%",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 60 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
        style={{
          textAlign: "center",
          fontSize: "54px",
          marginBottom: "20px",
          fontWeight: "800",
          background:
            "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Powerful Features
      </motion.h2>

      <p
        style={{
          textAlign: "center",
          color: "#94a3b8",
          maxWidth: "720px",
          margin: "auto",
          lineHeight: "32px",
          marginBottom: "70px",
        }}
      >
        CivicPulse combines AI, automation and real-time analytics to improve
        communication between citizens and government.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
          gap: "35px",
        }}
      >
        {features.map((item, index) => (
          <Tilt
  key={index}
  glareEnable={true}
  glareMaxOpacity={0.25}
  tiltMaxAngleX={12}
  tiltMaxAngleY={12}
  style={{
    borderRadius: "24px",
  }}
>
  <motion.div
  initial={{ opacity: 0, y: 80 }}
  whileInView={{ opacity: 1, y: 0 }}
  whileHover={{
    y: -18,
    scale: 1.03,
    rotateX: 5,
    rotateY: 5,
  }}
  transition={{ duration: 0.5 }}
  viewport={{ once: true }}
  style={{
    background: "rgba(255,255,255,.05)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255,255,255,.08)",
    borderRadius: "24px",
    padding: "40px",
    minHeight: "320px",
    cursor: "pointer",
    boxShadow: `0 0 35px ${item.color}30`,
  }}
>
  <div
    style={{
      color: item.color,
      marginBottom: "30px",
    }}
  >
    {item.icon}
  </div>

  <h3
    style={{
      fontSize: "28px",
      marginBottom: "18px",
    }}
  >
    {item.title}
  </h3>

  <p
    style={{
      color: "#cbd5e1",
      lineHeight: "30px",
    }}
  >
    {item.desc}
  </p>
</motion.div>
</Tilt>
        ))}
      </div>
    </section>
  );
}