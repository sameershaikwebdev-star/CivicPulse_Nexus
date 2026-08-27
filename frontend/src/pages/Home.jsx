import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Stats from "../components/Stats";
import Timeline from "../components/Timeline";
import RegisterComplaint from "../RegisterComplaint";
import AdminDashboard from "../components/AdminDashboard";
import Footer from "../components/Footer";
import Particles from "../components/Particles";

export default function Home() {
  return (
    <>
      <Particles />

      <Navbar />

      <Hero />
      <Features />
      <Stats />
      <Timeline />

      <RegisterComplaint />

      <AdminDashboard />

      <Footer />
    </>
  );
}