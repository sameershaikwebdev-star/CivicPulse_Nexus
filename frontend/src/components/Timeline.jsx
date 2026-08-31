import { motion } from "framer-motion";
import {
  FileText,
  Brain,
  Building2,
  CheckCircle2,
} from "lucide-react";

const steps = [
  {
    icon: <FileText size={36} />,
    title: "Report",
    desc: "Citizen submits complaint",
    color: "#3b82f6",
  },
  {
    icon: <Brain size={36} />,
    title: "AI Analysis",
    desc: "AI classifies and prioritizes",
    color: "#8b5cf6",
  },
  {
    icon: <Building2 size={36} />,
    title: "Government",
    desc: "Department receives ticket",
    color: "#06b6d4",
  },
  {
    icon: <CheckCircle2 size={36} />,
    title: "Resolved",
    desc: "Issue completed successfully",
    color: "#22c55e",
  },
];

export default function Timeline() {
  return (
    <section
      id="timeline"
      style={{
        padding: "120px 8%",
      }}
    >
      <motion.h2
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        style={{
          textAlign: "center",
          fontSize: "56px",
          fontWeight: "800",
          marginBottom: "80px",
          background:
            "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
          WebkitBackgroundClip: "text",
          color: "transparent",
        }}
      >
        Complaint Workflow
      </motion.h2>

      <div
        style={{
          position: "relative",
          maxWidth: "900px",
          margin: "auto",
        }}
      >
        {/* Center Line */}
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: 0,
            width: "4px",
            height: "100%",
            background:
              "linear-gradient(#3b82f6,#8b5cf6,#06b6d4)",
            transform: "translateX(-50%)",
            borderRadius: "20px",
          }}
        />

        {steps.map((step, index) => {
          const left = index % 2 === 0;

          return (
            <motion.div
              key={index}
              initial={{
                opacity: 0,
                x: left ? -120 : 120,
              }}
              whileInView={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                duration: 0.7,
              }}
              viewport={{ once: true }}
              style={{
                display: "flex",
                justifyContent: left
                  ? "flex-start"
                  : "flex-end",
                marginBottom: "80px",
                position: "relative",
              }}
            >
              <div
                style={{
                  width: "42%",
                  background: "rgba(255,255,255,.05)",
                  backdropFilter: "blur(20px)",
                  border:
                    "1px solid rgba(255,255,255,.08)",
                  borderRadius: "22px",
                  padding: "35px",
                  boxShadow: `0 0 35px ${step.color}40`,
                }}
              >
                <div
                  style={{
                    color: step.color,
                    marginBottom: "18px",
                  }}
                >
                  {step.icon}
                </div>

                <h3
                  style={{
                    fontSize: "30px",
                    marginBottom: "12px",
                  }}
                >
                  {step.title}
                </h3>

                <p
                  style={{
                    color: "#cbd5e1",
                    lineHeight: "28px",
                  }}
                >
                  {step.desc}
                </p>
              </div>

              {/* Circle */}
              <div
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform:
                    "translate(-50%,-50%)",
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  background: step.color,
                  boxShadow: `0 0 30px ${step.color}`,
                  border: "4px solid #050816",
                }}
              />
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}