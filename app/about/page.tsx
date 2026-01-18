import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-8">About Weavy</h1>
          <div className="space-y-6 text-lg text-gray-700 leading-relaxed">
            <p>
              Weavy is a new way to create. We&apos;re bridging the gap between AI capabilities and human creativity, 
              to continue the tradition of craft in artistic expression.
            </p>
            <p>
              Our platform combines the power of artificial intelligence with professional editing tools, 
              giving creators the ability to build complex workflows in an intuitive, visual interface.
            </p>
            <p>
              We call it Artistic Intelligence - where technology meets human creativity to unlock new 
              possibilities in digital art and content creation.
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
