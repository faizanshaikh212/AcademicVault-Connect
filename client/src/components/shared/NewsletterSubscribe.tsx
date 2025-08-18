import React from "react";
import { Input } from "../ui/Input";
import { Button } from "../ui/Button";

const NewsletterSubscribe: React.FC = () => {
  return (
    <section className="bg-gray-100 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold">Subscribe to Our Newsletter</h2>
        <p className="mt-2 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          Stay up to date with the latest platform news, feature updates, and
          community highlights.
        </p>
        <form className="mt-8 flex flex-col md:flex-row gap-2 max-w-lg mx-auto">
          <Input
            type="email"
            placeholder="Enter your email"
            className="flex-1"
            required
          />
          <Button type="submit">Subscribe</Button>
        </form>
      </div>
    </section>
  );
};

export default NewsletterSubscribe;
