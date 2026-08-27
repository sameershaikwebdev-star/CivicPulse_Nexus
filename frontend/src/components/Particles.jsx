import { useCallback } from "react";
import Particles from "@tsparticles/react";
import { loadSlim } from "@tsparticles/slim";

export default function BackgroundParticles() {
  const particlesInit = useCallback(async (engine) => {
    await loadSlim(engine);
  }, []);

  return (
    <Particles
      id="particles"
      init={particlesInit}
      options={{
        fullScreen: {
          enable: true,
          zIndex: -10,
        },

        background: {
          color: {
            value: "transparent",
          },
        },

        fpsLimit: 120,

        particles: {
          number: {
            value: 80,
          },

          color: {
            value: [
              "#3b82f6",
              "#8b5cf6",
              "#06b6d4",
              "#ffffff",
            ],
          },

          links: {
            enable: true,
            distance: 150,
            opacity: 0.18,
            color: "#3b82f6",
          },

          move: {
            enable: true,
            speed: 1,
            outModes: {
              default: "bounce",
            },
          },

          opacity: {
            value: 0.6,
          },

          size: {
            value: {
              min: 1,
              max: 4,
            },
          },
        },

        interactivity: {
          events: {
            onHover: {
              enable: true,
              mode: "grab",
            },

            onClick: {
              enable: true,
              mode: "push",
            },
          },

          modes: {
            grab: {
              distance: 180,
            },

            push: {
              quantity: 4,
            },
          },
        },

        detectRetina: true,
      }}
    />
  );
}