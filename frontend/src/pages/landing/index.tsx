import { Calendar, Search, CreditCard, User, MapPin, BookOpen, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HeroCarousel } from "@/components/ui/hero-carousel";
import { FeatureSection } from "@/components/landing/FeatureSection";
import { HowItWorksSection } from "@/components/landing/HowItWorksSection";
import { TestimonialSection } from "@/components/landing/TestimonialSection";
import { CTASection } from "@/components/landing/CTASection";
import { Link } from "react-router-dom";
import { Switch } from "@/components/ui/switch";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";

// Demo data
const heroItems = [
  {
    imageUrl: "https://images.unsplash.com/photo-1511067007398-7e4b90cfa4bc?q=80&w=1925&auto=format&fit=crop",
    title: "Book Premium Sports Venues",
    description: "Find and reserve top-quality courts, fields, and facilities for your favorite sports.",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?q=80&w=2070&auto=format&fit=crop",
    title: "Rent Quality Sports Equipment",
    description: "Access premium sports gear without the commitment of ownership.",
  },
  {
    imageUrl: "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?q=80&w=2070&auto=format&fit=crop",
    title: "Learn From Expert Tutorials",
    description: "Improve your skills with our library of professional training videos.",
  },
];

const features = [
  {
    icon: Calendar,
    title: "Easy Booking",
    description: "Book sports venues with just a few clicks. Our intuitive platform makes scheduling simple.",
  },
  {
    icon: ShoppingBag,
    title: "Equipment Rental",
    description: "Access high-quality sports equipment without the hassle of ownership or maintenance.",
  },
  {
    icon: BookOpen,
    title: "Video Tutorials",
    description: "Learn techniques and strategies from professionals through our comprehensive video library.",
  },
  {
    icon: MapPin,
    title: "Location Search",
    description: "Find venues and facilities near you with our advanced location-based search.",
  },
  {
    icon: User,
    title: "Personalized Profile",
    description: "Track your bookings, rentals, and favorite tutorials all in one place.",
  },
  {
    icon: CreditCard,
    title: "Secure Payments",
    description: "Make transactions with confidence using our secure payment processing system.",
  },
];

const howItWorks = [
  {
    number: 1,
    icon: Search,
    title: "Search & Browse",
    description: "Find sports venues, equipment, or tutorials that match your interests and needs.",
  },
  {
    number: 2,
    icon: Calendar,
    title: "Book & Reserve",
    description: "Select your preferred dates and times, then confirm your booking with secure payment.",
  },
  {
    number: 3,
    icon: User,
    title: "Play & Enjoy",
    description: "Show up at your booked venue, use your rented equipment, or watch tutorials to improve.",
  },
];

const testimonials = [
  {
    content: "SportNexus Hub has completely transformed how I book tennis courts. No more calling around - I can see availability in real-time and book instantly!",
    author: {
      name: "Sarah Johnson",
      role: "Tennis Enthusiast",
      avatarUrl: "https://i.pravatar.cc/150?img=1",
    },
  },
  {
    content: "As a traveling sports enthusiast, being able to rent equipment through SportNexus has saved me from lugging my gear across the country. Fantastic service!",
    author: {
      name: "Michael Chen",
      role: "Basketball Player",
      avatarUrl: "https://i.pravatar.cc/150?img=2",
    },
  },
  {
    content: "The tutorial videos are top-notch! I've improved my swimming technique significantly after following the professional guidance available here.",
    author: {
      name: "Aisha Patel",
      role: "Swimming Learner",
      avatarUrl: "https://i.pravatar.cc/150?img=5",
    },
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, logout } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="w-full py-5 px-4 md:px-8 flex items-center justify-between bg-background/80 backdrop-blur-md z-10 border-b sticky top-0 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-primary">SportNexus</span>
          <span className="text-2xl font-bold">Hub</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link to="/" className="text-base font-medium hover:text-primary transition-colors relative group">
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/venues" className="text-base font-medium hover:text-primary transition-colors relative group">
            Venues
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/equipment" className="text-base font-medium hover:text-primary transition-colors relative group">
            Equipment
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
          <Link to="/tutorials" className="text-base font-medium hover:text-primary transition-colors relative group">
            Tutorials
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
          </Link>
        </nav>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Dark Mode</span>
            <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
          </div>
          {isAuthenticated && (
            <Button variant="outline" onClick={logout} className="font-medium">Sign Out</Button>
          )}
          {!isAuthenticated && (
            <>
              <Button asChild variant="outline" size="default" className="font-medium">
                <Link to="/login">Login</Link>
              </Button>
              <Button asChild size="default" className="font-medium">
                <Link to="/register">Sign Up</Link>
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative">
          <HeroCarousel 
            items={heroItems} 
            className="h-[500px] md:h-[600px]"
          />
          <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-10">
            <Button asChild size="lg" className="text-base px-8">
              <Link to="/register">Get Started</Link>
            </Button>
          </div>
        </section>

        {/* Features Section */}
        <FeatureSection
          title="Everything You Need for Sports"
          description="SportNexus Hub brings together venue booking, equipment rental, and skill development in one seamless platform."
          features={features}
        />

        {/* How It Works Section */}
        <HowItWorksSection
          title="How SportNexus Hub Works"
          description="Our platform makes it easy to find, book, and enjoy sports activities in just a few simple steps."
          steps={howItWorks}
          className="bg-secondary/30"
        />

        {/* Testimonials Section */}
        <TestimonialSection
          title="What Our Users Say"
          testimonials={testimonials}
        />

        {/* CTA Section */}
        <CTASection
          title="Ready to Elevate Your Sports Experience?"
          description="Join thousands of sports enthusiasts who've simplified their active lifestyle with SportNexus Hub."
          buttonText="Sign Up Now"
          buttonLink="/register"
        />
      </main>

      {/* Footer */}
      <footer className="bg-secondary py-12 px-4 md:px-6">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl font-bold text-primary">SportNexus</span>
                <span className="text-xl font-bold">Hub</span>
              </div>
              <p className="text-muted-foreground">
                Your one-stop platform for sports venues, equipment, and tutorials.
              </p>
            </div>
            <div>
              <h3 className="font-bold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/" className="text-muted-foreground hover:text-primary">Home</Link></li>
                <li><Link to="/venues" className="text-muted-foreground hover:text-primary">Venues</Link></li>
                <li><Link to="/equipment" className="text-muted-foreground hover:text-primary">Equipment</Link></li>
                <li><Link to="/tutorials" className="text-muted-foreground hover:text-primary">Tutorials</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/terms" className="text-muted-foreground hover:text-primary">Terms of Service</Link></li>
                <li><Link to="/privacy" className="text-muted-foreground hover:text-primary">Privacy Policy</Link></li>
                <li><Link to="/refund" className="text-muted-foreground hover:text-primary">Refund Policy</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-4">Contact</h3>
              <ul className="space-y-2">
                <li className="text-muted-foreground">support@sportnexushub.com</li>
                <li className="text-muted-foreground">+1 (555) 123-4567</li>
              </ul>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t text-center text-muted-foreground text-sm">
            © {new Date().getFullYear()} SportNexus Hub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
