
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface CTASectionProps {
  title: string;
  description: string;
  buttonText: string;
  buttonLink: string;
  className?: string;
}

export function CTASection({
  title,
  description,
  buttonText,
  buttonLink,
  className,
}: CTASectionProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-primary text-primary-foreground", className)}>
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center text-center space-y-6 md:space-y-8">
          <h2 className="text-3xl md:text-5xl font-bold">{title}</h2>
          <p className="text-xl max-w-3xl opacity-90">{description}</p>
          <Button asChild size="lg" variant="secondary" className="mt-4 text-primary font-semibold px-8">
            <Link to={buttonLink}>{buttonText}</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
