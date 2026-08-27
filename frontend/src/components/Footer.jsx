import { motion } from "framer-motion";
import {
  Github,
  Linkedin,
  Twitter,
  Mail,
  ArrowUp,
} from "lucide-react";

export default function Footer() {
  return (
    <footer
      id="contact"
      style={{
        marginTop: "120px",
        background: "#0f172a",
        backdropFilter: "blur(18px)",
        borderTop: "1px solid rgba(255,255,255,.1)",
        padding: "70px 8%",
        color: "#ffffff",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          display: "flex",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "40px",
        }}
      >
        <div>
          <h2
            style={{
              fontSize: "38px",
              marginBottom: "20px",
              background:
                "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            CivicPulse
          </h2>

          <p
            style={{
              color: "#94a3b8",
              maxWidth: "420px",
              lineHeight: "30px",
            }}
          >
            AI-powered smart complaint management platform helping
            citizens and governments work together with transparency,
            speed and intelligent automation.
          </p>
        </div>

        <div>
          <h3
            style={{
              marginBottom: "20px",
              color: "#fff",
            }}
          >
            Quick Links
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <a href="#home" style={linkStyle}>Home</a>
            <a href="#features" style={linkStyle}>Features</a>
            <a href="#statistics" style={linkStyle}>Statistics</a>
            <a href="#timeline" style={linkStyle}>Timeline</a>
            <a href="#login" style={linkStyle}>Login</a>
          </div>
        </div>

        <div>
          <h3
            style={{
              marginBottom: "20px",
              color: "#fff",
            }}
          >
            Connect
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "15px",
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "18px",
              }}
            >
              <Icon href="https://github.com/sameershaikwebdev-star">
                <Github size={24} color="#ffffff" />
              </Icon>
              <Icon href="https://www.linkedin.com/in/sameer-shaik-7950a0377/">
                <Linkedin size={24} color="#ffffff" />
              </Icon>
              <Icon href="https://x.com/SameerShai46389">
                <Twitter size={24} color="#ffffff" />
              </Icon>
              <Icon href="mailto:sameershaik.wedev@gmail.com">
                <Mail size={24} color="#ffffff" />
              </Icon>
            </div>

            <a
              href="mailto:sameershaik.wedev@gmail.com"
              style={{
                ...linkStyle,
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                marginTop: "5px",
              }}
            >
              <Mail size={16} /> sameershaik.wedev@gmail.com
            </a>
          </div>
        </div>
      </div>

      <motion.div
        whileHover={{
          scale: 1.1,
          rotate: 360,
        }}
        transition={{
          duration: .6,
        }}
        style={{
          width: "55px",
          height: "55px",
          margin: "50px auto 25px",
          borderRadius: "50%",
          background:
            "linear-gradient(90deg,#8b5cf6,#3b82f6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 0 30px #3b82f6",
        }}
        onClick={() =>
          window.scrollTo({
            top: 0,
            behavior: "smooth",
          })
        }
      >
        <ArrowUp color="white" />
      </motion.div>

      <p
        style={{
          textAlign: "center",
          color: "#64748b",
        }}
      >
        © 2026 CivicPulse • AI Powered Smart Governance
      </p>
    </footer>
  );
}

const linkStyle = {
  textDecoration: "none",
  color: "#94a3b8",
};

function Icon({ children, href }) {
  return (
    <motion.a
      href={href}
      target={href.startsWith("http") ? "_blank" : undefined}
      rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
      whileHover={{
        scale: 1.2,
        y: -3,
        boxShadow: "0 0 25px rgba(59, 130, 246, 0.8)",
      }}
      style={{
        width: 52,
        height: 52,
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #3b82f6, #8b5cf6)",
        border: "1px solid rgba(255,255,255,0.2)",
        cursor: "pointer",
        color: "#ffffff",
        textDecoration: "none",
        boxShadow: "0 4px 15px rgba(59, 130, 246, 0.4)",
      }}
    >
      {children}
    </motion.a>
  );
}