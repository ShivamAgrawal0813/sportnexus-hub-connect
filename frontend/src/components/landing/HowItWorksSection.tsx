
import { cn } from "@/lib/utils";

interface Step {
  number: number;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface HowItWorksSectionProps {
  title: string;
  description?: string;
  steps: Step[];
  className?: string;
}

export function HowItWorksSection({
  title,
  description,
  steps,
  className,
}: HowItWorksSectionProps) {
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          {steps.map((step) => (
            <div key={step.number} className="flex flex-col items-center text-center">
              <div className="mb-6 relative">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground text-xl font-bold">
                  {step.number}
                </div>
                <div className="absolute top-1/2 left-full h-px w-full bg-border hidden md:block" 
                     style={{ display: step.number === steps.length ? 'none' : '' }} />
              </div>
              <div className="space-y-3">
                <div className="inline-flex items-center justify-center p-2 bg-muted rounded-full mb-2">
                  <step.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">{step.title}</h3>
                <p className="text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
