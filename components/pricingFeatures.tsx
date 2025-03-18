import { Check } from "lucide-react";

const features = [
  {
    title: "Unlimited PDF Operations",
    description: "Split, merge, and convert PDFs without limits",
  },
  {
    title: "High-Speed Processing",
    description: "Process large files with optimized performance",
  },
  {
    title: "Advanced Features",
    description: "Access to premium tools and features",
  },
  {
    title: "Secure File Handling",
    description: "Enterprise-grade security for your documents",
  },
  {
    title: "Priority Support",
    description: "Get help when you need it most",
  },
];

export default function PricingFeatures() {
  return (
    <ul className="mt-6 space-y-4 text-lg text-black">
      {features.map((feature) => (
        <li key={feature.title} className="flex items-start gap-3">
          <span className="mt-1">
            <Check className="h-5 w-5 text-red-700" />
          </span>
          <div className="text-left">
            <p className="font-medium">{feature.title}</p>
            <p className="text-sm text-red-700">{feature.description}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}