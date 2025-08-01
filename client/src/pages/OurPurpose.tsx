import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";
import { Target, Lightbulb, Users } from "lucide-react";

const OurPurpose: React.FC = () => {
  return (
    <div className="bg-white dark:bg-gray-950">
      {/* Hero Section */}
      <div className="text-center py-20 md:py-28 bg-gray-50 dark:bg-gray-900">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
          Our Purpose
        </h1>
        <p className="mt-4 max-w-3xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Fostering a global community where knowledge is shared, skills are
          honed, and innovation thrives.
        </p>
      </div>

      <div className="container mx-auto px-4 py-16 md:py-24 space-y-24">
        {/* Section 1: Text Left, Image Right */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-4">Breaking Down Barriers</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              We believe that education and collaboration should have no
              boundaries. Academic Vault was created to provide a centralized
              platform for students and teachers to connect, regardless of their
              geographical location. Our goal is to make high-quality
              collaboration tools accessible to everyone, fostering a diverse
              and inclusive learning environment.
            </p>
          </div>
          <img
            src="https://placehold.co/600x400/E2E8F0/4A5568?text=Collaboration"
            alt="Collaboration"
            className="rounded-lg shadow-xl"
          />
        </div>

        {/* Section 2: Image Left, Text Right */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <img
            src="https://placehold.co/600x400/bee3f8/2a4365?text=Innovation"
            alt="Innovation"
            className="rounded-lg shadow-xl"
          />
          <div>
            <h2 className="text-3xl font-bold mb-4">Empowering Creators</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
              Our platform is more than just a workspace; it's a launchpad for
              innovation. By providing robust tools for project management,
              real-time knowledge sharing, we empower users to turn their ideas
              into reality. Showcase your work, get valuable feedback, and build
              a portfolio that stands out.
            </p>
          </div>
        </div>

        {/* Vision and Approach Section */}
        <div className="text-center py-16">
          <h2 className="text-3xl font-bold">Our Vision & Approach</h2>
          <div className="mt-12 grid md:grid-cols-3 gap-8">
            <div className="p-6">
              <Target className="h-12 w-12 mx-auto text-blue-600" />
              <h3 className="text-xl font-semibold mt-4">Our Vision</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                To be the leading global platform for academic and creative
                collaboration.
              </p>
            </div>
            <div className="p-6">
              <Lightbulb className="h-12 w-12 mx-auto text-blue-600" />
              <h3 className="text-xl font-semibold mt-4">Our Approach</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Provide intuitive, powerful, and accessible tools for everyone.
              </p>
            </div>
            <div className="p-6">
              <Users className="h-12 w-12 mx-auto text-blue-600" />
              <h3 className="text-xl font-semibold mt-4">Our Community</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Foster a supportive and inclusive network of learners and
                creators.
              </p>
            </div>
          </div>
          <Button asChild size="lg" className="mt-12">
            <Link to="/network">Explore Our Network</Link>
          </Button>
        </div>
      </div>

      {/* Newsletter Section */}
      <NewsletterSubscribe />
    </div>
  );
};

export default OurPurpose;
