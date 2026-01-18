import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WorkflowsSection from "@/components/landing/WorkflowsSection";

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>
        <WorkflowsSection />
      </main>
      <Footer />
    </div>
  );
}
