"use client";

import Image from "next/image";
import Link from "next/link";

const workflows = [
  {
    title: "Wan Lora - Rotate",
    image: "/images/refrence image4.png",
    description: "From multi-layer compositing to matte manipulation, Weavy keeps up with your creativity.",
    nodes: [
      { type: "PROMPT", position: "top-left" },
      { type: "PROMPT", position: "top-right" },
      { type: "IMAGEN 3", position: "middle-left" },
      { type: "IMAGEN 3", position: "middle-right" },
      { type: "TEXT", position: "bottom-left" },
      { type: "COMPOSITOR", position: "center" },
      { type: "WAN 2.1", position: "right" },
    ],
  },
  {
    title: "Multiple Models",
    image: "/images/refrence image5.png",
    description: "Run multiple AI models in parallel and combine their outputs for creative workflows.",
    nodes: [
      { type: "PROMPT", position: "center-top" },
      { type: "DALLE 3", position: "left" },
      { type: "STABLE DIFFUSION 3", position: "left-center" },
      { type: "FLUX FAST", position: "right-center" },
      { type: "RECRAFT V3", position: "right" },
      { type: "VIDEOGRAM", position: "bottom" },
    ],
  },
  {
    title: "Wan LoRa Inflate",
    image: "/images/refrence image6.png",
    description: "Create stunning 3D inflations with advanced LoRa models and video upscaling.",
    nodes: [
      { type: "PROMPT", position: "top-left" },
      { type: "PROMPT", position: "top-right" },
      { type: "TEXT", position: "middle-left" },
      { type: "GENERATE IMAGE", position: "center" },
      { type: "WAN 2.1 W. LORA", position: "right" },
      { type: "VIDEO UPSCALER", position: "bottom" },
    ],
  },
];

export default function WorkflowsSection() {
  return (
    <section className="py-20 px-6 bg-black text-white">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-6xl font-bold mb-6">Workflows</h2>
          <p className="text-xl text-gray-300 max-w-3xl">
            From multi-layer compositing to matte manipulation, Weavy keeps up with your creativity 
            with all the editing tools you recognize and rely on.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {workflows.map((workflow, idx) => (
            <div key={idx} className="relative group">
              <div className="relative aspect-[4/5] rounded-lg overflow-hidden bg-gray-900">
                <Image
                  src={workflow.image}
                  alt={workflow.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                
                {/* Overlay Workflow Diagram */}
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="text-yellow-400 font-bold text-lg mb-4">
                    {workflow.title}
                  </div>
                  
                  {/* Simplified node visualization */}
                  <div className="space-y-2">
                    {workflow.nodes.slice(0, 4).map((node, i) => (
                      <div
                        key={i}
                        className="bg-white/10 backdrop-blur-sm border border-white/20 rounded px-3 py-1.5 text-xs text-white"
                      >
                        {node.type}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <Link
                href="/workflow"
                className="absolute bottom-6 left-6 bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2.5 text-sm font-semibold uppercase tracking-wide transition-colors"
              >
                Try
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
