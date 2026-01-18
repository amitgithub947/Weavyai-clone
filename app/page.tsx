import Header from "@/components/Header";
import HeroSection from "@/components/landing/HeroSection";
import WorkflowsSection from "@/components/landing/WorkflowsSection";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>
        <HeroSection />
        <WorkflowsSection />
        <FeaturesSection />
      </main>
      <Footer />
    </div>
  );
}
