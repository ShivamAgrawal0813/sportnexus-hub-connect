
import { cn } from "@/lib/utils";

interface Feature {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

interface FeatureSectionProps {
  title: string;
  description?: string;
  features: Feature[];
  className?: string;
}

export function FeatureSection({
  title,
  description,
  features,
  className,
}: FeatureSectionProps) {
  return (
    <section className={cn("py-16 md:py-24", className)}>
      <div className="container px-4 md:px-6">
        <div className="mb-10 md:mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
          {description && (
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {description}
            </p>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="flex flex-col items-center text-center p-6 bg-secondary/50 rounded-lg border border-border hover:border-primary/50 transition-colors"
            >
              <div className="p-3 mb-5 rounded-full bg-primary/10 text-primary">
                <feature.icon className="h-10 w-10" />
              </div>
              <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
