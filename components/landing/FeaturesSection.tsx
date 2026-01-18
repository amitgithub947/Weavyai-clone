"use client";

const features = [
  {
    title: "Node-Based Workflow",
    description: "Connect AI models and editing tools in a visual, intuitive interface.",
    icon: "🔗",
  },
  {
    title: "Multiple AI Models",
    description: "Access all major AI models including DALL-E, Stable Diffusion, Flux, and more.",
    icon: "🤖",
  },
  {
    title: "Professional Tools",
    description: "Full suite of editing tools for compositing, matte manipulation, and more.",
    icon: "🎨",
  },
  {
    title: "Real-Time Collaboration",
    description: "Work together with your team in real-time on creative projects.",
    icon: "👥",
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-20 px-6 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">
            Everything You Need to Create
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            A complete platform for AI-powered creative workflows
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg p-6 shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Workflow Example */}
        <div className="mt-20 bg-white rounded-xl p-8 shadow-xl">
          <h3 className="text-3xl font-bold text-gray-900 mb-8 text-center">
            See It In Action
          </h3>
          <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🎬</div>
                <p className="text-gray-600">Workflow Builder Preview</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
