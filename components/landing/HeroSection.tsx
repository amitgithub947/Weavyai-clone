"use client";

import Image from "next/image";

export default function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Main Headline */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 mb-16">
          <div className="text-center md:text-right">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold text-gray-900 leading-tight">
              Artificial
              <br />
              Intelligence
            </h1>
          </div>
          <div className="text-5xl sm:text-7xl md:text-9xl font-bold text-gray-900">+</div>
          <div className="text-center md:text-left">
            <h1 className="text-5xl sm:text-7xl md:text-9xl font-bold text-gray-900 leading-tight">
              Human
              <br />
              Creativity
            </h1>
          </div>
        </div>

        {/* Company Info */}
        <div className="max-w-4xl mx-auto mt-20">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex gap-1">
              <div className="w-1 h-8 bg-gray-900"></div>
              <div className="w-1 h-6 bg-gray-900 mt-1"></div>
              <div className="w-1 h-7 bg-gray-900 mt-0.5"></div>
              <div className="w-1 h-5 bg-gray-900 mt-2"></div>
            </div>
            <span className="text-2xl font-bold text-gray-900">WEAVY</span>
            <div className="w-px h-8 bg-gray-400"></div>
            <span className="text-lg font-medium text-gray-600 uppercase tracking-wider">
              ARTISTIC INTELLIGENCE
            </span>
          </div>
          <p className="text-xl text-gray-700 leading-relaxed">
            Weavy is a new way to create. We&apos;re bridging the gap between AI capabilities and human creativity, 
            to continue the tradition of craft in artistic expression. We call it Artistic Intelligence.
          </p>
        </div>

        {/* Workflow Preview */}
        <div className="mt-24 max-w-6xl mx-auto">
          <div className="relative bg-white rounded-lg p-8 shadow-xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {/* 3D Node */}
              <div className="bg-gray-50 rounded p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">3D</div>
                <div className="text-xs text-gray-500 mb-3">RODIN 2.0</div>
                <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                  <Image
                    src="/images/refrence image1.png"
                    alt="3D Model"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Image Node */}
              <div className="bg-gray-50 rounded p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">IMAGE</div>
                <div className="text-xs text-gray-500 mb-3">STABLE DIFFUSION</div>
                <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                  <Image
                    src="/images/refernce image2.png"
                    alt="Generated Image"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>

              {/* Text Node */}
              <div className="bg-gray-50 rounded p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">TEXT</div>
                <div className="text-xs text-gray-500 mb-3">PROMPT</div>
                <div className="aspect-square bg-gray-200 rounded p-3 text-xs text-gray-600">
                  a Great-Tailed Grackle bird is flying from the background and seating on the model&apos;s shoulder...
                </div>
              </div>

              {/* Video Node */}
              <div className="bg-gray-50 rounded p-4">
                <div className="text-xs font-semibold text-gray-600 mb-2">VIDEO</div>
                <div className="text-xs text-gray-500 mb-3">MINIMAX VIDEO</div>
                <div className="aspect-square bg-gray-200 rounded overflow-hidden">
                  <Image
                    src="/images/refrence image3.png"
                    alt="Generated Video"
                    width={200}
                    height={200}
                    className="w-full h-full object-cover"
                    unoptimized
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
