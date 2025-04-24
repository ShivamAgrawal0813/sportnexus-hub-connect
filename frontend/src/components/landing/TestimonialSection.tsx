
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Testimonial {
  content: string;
  author: {
    name: string;
    role: string;
    avatarUrl?: string;
  };
}

interface TestimonialSectionProps {
  title: string;
  description?: string;
  testimonials: Testimonial[];
  className?: string;
}

export function TestimonialSection({
  title,
  description,
  testimonials,
  className,
}: TestimonialSectionProps) {
  return (
    <section className={cn("py-16 md:py-24 bg-secondary/30", className)}>
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
          {testimonials.map((testimonial, index) => (
            <div 
              key={index} 
              className="p-6 bg-background rounded-lg border border-border shadow-sm"
            >
              <div className="flex flex-col h-full">
                <div className="flex-1 mb-6">
                  <p className="italic text-muted-foreground">&ldquo;{testimonial.content}&rdquo;</p>
                </div>
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarImage src={testimonial.author.avatarUrl} alt={testimonial.author.name} />
                    <AvatarFallback>{testimonial.author.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{testimonial.author.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.author.role}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
