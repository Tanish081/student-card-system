import Particles from "react-tsparticles";
import { loadFull } from "tsparticles";

export default function AnimatedBackground() {
  const particlesInit = async (main) => {
    await loadFull(main);
  };

  return (
    <Particles
      id="tsparticles"
      init={particlesInit}
      options={{
        fullScreen: { enable: false },
        particles: {
          number: { value: 40 },
          color: { value: "#ffffff" },
          opacity: { value: 0.3 },
          size: { value: 3 },
          move: {
            enable: true,
            speed: 0.6,
          },
        },
      }}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 0,
        pointerEvents: "none"
      }}
    />
  );
}