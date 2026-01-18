import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import Script from "next/script";
import HydrationFix from "@/components/HydrationFix";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Weavy Clone - LLM Workflow Builder",
  description: "Pixel-perfect clone of Weavy.ai workflow builder",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInUrl="/sign-in"
      signUpUrl="/sign-up"
      afterSignInUrl="/workflow"
      afterSignUpUrl="/workflow"
    >
      <html lang="en" suppressHydrationWarning>
        <body className={`${inter.variable} antialiased`} suppressHydrationWarning>
          <Script
            id="hydration-fix"
            strategy="beforeInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                (function() {
                  // Clean up extension-added attributes that cause hydration mismatches
                  function cleanupAttributes() {
                    // Remove contenteditable="false" added by extensions
                    document.querySelectorAll('[contenteditable="false"]').forEach(function(el) {
                      el.removeAttribute('contenteditable');
                    });
                    
                    // Clean up cursor:pointer styles added by extensions
                    document.querySelectorAll('[style*="cursor:pointer"]').forEach(function(el) {
                      const style = el.getAttribute('style');
                      if (style) {
                        const newStyle = style.replace(/cursor:\\s*pointer;?/g, '').trim();
                        if (newStyle) {
                          el.setAttribute('style', newStyle);
                        } else {
                          el.removeAttribute('style');
                        }
                      }
                    });
                  }
                  
                  // Run cleanup when DOM is ready
                  if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', cleanupAttributes);
                  } else {
                    cleanupAttributes();
                  }
                  
                  // Also observe for new elements added by extensions
                  if (typeof MutationObserver !== 'undefined') {
                    const observer = new MutationObserver(function(mutations) {
                      let shouldCleanup = false;
                      mutations.forEach(function(mutation) {
                        if (mutation.type === 'attributes' && 
                            (mutation.attributeName === 'contenteditable' || mutation.attributeName === 'style')) {
                          shouldCleanup = true;
                        }
                      });
                      if (shouldCleanup) {
                        setTimeout(cleanupAttributes, 0);
                      }
                    });
                    
                    if (document.body) {
                      observer.observe(document.body, { 
                        childList: true, 
                        subtree: true, 
                        attributes: true, 
                        attributeFilter: ['contenteditable', 'style'] 
                      });
                    }
                  }
                })();
              `,
            }}
          />
          <HydrationFix />
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
