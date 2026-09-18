import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X } from "lucide-react";

const links = [
  { name: "Home", href: "#home" },
  { name: "Features", href: "#features" },
  { name: "Statistics", href: "#statistics" },
  { name: "Timeline", href: "#timeline" },
  { name: "Login", href: "#login" },
  { name: "Contact", href: "#contact" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [scroll, setScroll] = useState(false);

  useEffect(() => {
    const handle = () => {
      setScroll(window.scrollY > 30);
    };

    window.addEventListener("scroll", handle);

    return () => window.removeEventListener("scroll", handle);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.7 }}
        style={{
  position: "fixed",
  top: 20,
  left: "50%",
  transform: "translateX(-50%)",
  width: "90%",
  maxWidth: "1200px",
  zIndex: 999,
  borderRadius: "18px",
  backdropFilter: "blur(20px)",
  background: scroll
    ? "rgba(8,15,32,.88)"
    : "rgba(8,15,32,.45)",
  border: "1px solid rgba(255,255,255,.08)",
}}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "18px 35px",
          }}
        >
          <motion.h2
            whileHover={{ scale: 1.08 }}
            style={{
              fontSize: "30px",
              fontWeight: "800",
              background:
                "linear-gradient(90deg,#8b5cf6,#3b82f6,#06b6d4)",
              WebkitBackgroundClip: "text",
              color: "transparent",
            }}
          >
            CivicPulse
          </motion.h2>

          {/* Desktop */}

          <div
            className="desktop-menu"
            style={{
              display: "flex",
              gap: "35px",
              alignItems: "center",
            }}
          >
            {links.map((item) => (
              <motion.a
                key={item.name}
                href={item.href}
                whileHover={{ y: -3 }}
                style={{
                  color: "#fff",
                  textDecoration: "none",
                  position: "relative",
                  fontWeight: "500",
                }}
              >
                {item.name}

                <motion.div
                  whileHover={{
                    width: "100%",
                  }}
                  style={{
                    position: "absolute",
                    bottom: -8,
                    left: 0,
                    width: 0,
                    height: 2,
                    background:
                      "linear-gradient(90deg,#8b5cf6,#3b82f6)",
                  }}
                />
              </motion.a>
            ))}

            <motion.button
              onClick={() => {
                const el = document.getElementById("login");
                if (el) el.scrollIntoView({ behavior: "smooth" });
              }}
              whileHover={{
                scale: 1.08,
                boxShadow: "0 0 35px #3b82f6",
              }}
              whileTap={{ scale: 0.95 }}
              style={{
                padding: "14px 32px",
                borderRadius: "40px",
                border: "none",
                color: "white",
                fontWeight: "bold",
                cursor: "pointer",
                background:
                  "linear-gradient(90deg,#8b5cf6,#2563eb)",
              }}
            >
              Get Started
            </motion.button>
          </div>

          {/* Mobile */}

          <div
            className="mobile-menu"
            onClick={() => setOpen(!open)}
            style={{
              display: "none",
              color: "white",
              cursor: "pointer",
            }}
          >
            {open ? <X /> : <Menu />}
          </div>
        </div>

        <AnimatePresence>
          {open && (
            <motion.div
              initial={{
                opacity: 0,
                height: 0,
              }}
              animate={{
                opacity: 1,
                height: "auto",
              }}
              exit={{
                opacity: 0,
                height: 0,
              }}
              style={{
                overflow: "hidden",
              }}
            >
              {links.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  style={{
                    display: "block",
                    padding: "18px 30px",
                    color: "white",
                    textDecoration: "none",
                  }}
                >
                  {item.name}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.nav>
    </>
  );
}
