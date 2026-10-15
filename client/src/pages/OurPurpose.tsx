import React from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  LibraryBig,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import NewsletterSubscribe from "@/components/shared/NewsletterSubscribe";

const priorities = [
  {
    icon: LibraryBig,
    title: "Make resources easier to find",
    description:
      "Organize notes, question papers, syllabi, and timetables by course and subject so students can spend less time searching.",
  },
  {
    icon: Users,
    title: "Make sharing useful",
    description:
      "Give students and teachers a shared place to contribute study materials, publish projects, and exchange practical knowledge.",
  },
  {
    icon: ShieldCheck,
    title: "Keep content accountable",
    description:
      "Use clear contributor roles and review workflows to help keep the academic library relevant and responsibly managed.",
  },
];

const OurPurpose: React.FC = () => (
  <div className="bg-white dark:bg-gray-950">
    <section className="bg-gray-50 px-5 pb-16 pt-32 dark:bg-gray-900 md:px-8 md:pb-20">
      <div className="relative mx-auto grid w-full max-w-[120rem] items-center gap-10 lg:grid-cols-[1fr_1fr] lg:gap-16 xl:gap-24">
        <div className="max-w-3xl">
          <span className="text-sm font-semibold text-blue-700 dark:text-blue-300">
            The purpose behind Academic Vault
          </span>
          <h1 className="mt-6 text-4xl font-extrabold tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Academic resources should be easy to find and worth sharing.
          </h1>
          <p className="mt-6 max-w-3xl text-lg leading-8 text-slate-600 dark:text-gray-300">
            Academic Vault helps students and teachers find and share course
            materials, news, notices, and projects in one searchable place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/academic/notes">
                Browse study resources
                <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/academic/question-papers">Find past papers</Link>
            </Button>
          </div>
        </div>
        <figure className="mx-auto w-full max-w-3xl overflow-hidden rounded-lg">
          <img
            src="/assets/academic-books.jpg"
            alt="Books and study materials arranged on a desk"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
          <figcaption className="pt-3 text-sm text-gray-600 dark:text-gray-400">
            A clearer place to find and share useful learning materials.
          </figcaption>
        </figure>
      </div>
    </section>

    <section className="container mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          What we focus on
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Practical tools for learning
        </h2>
      </div>
      <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-3">
        {priorities.map(({ icon: Icon, title, description }) => (
          <article
            key={title}
            className="py-2"
          >
            <Icon className="h-6 w-6 text-blue-700 dark:text-blue-300" aria-hidden="true" />
            <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">
              {title}
            </h3>
            <p className="mt-2 leading-7 text-slate-600 dark:text-gray-400">
              {description}
            </p>
          </article>
        ))}
      </div>
    </section>

    <section className="border-y border-gray-200 bg-gray-50 py-16 dark:border-gray-800 dark:bg-gray-900 md:py-20">
      <div className="container mx-auto grid max-w-7xl gap-10 px-5 md:grid-cols-2 md:items-center md:px-8">
        <figure className="overflow-hidden rounded-lg">
          <img
            src="/assets/study-community.jpg"
            alt="Students learning together around a table"
            loading="lazy"
            className="aspect-[4/3] w-full object-cover"
          />
        </figure>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
            How it works
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
            One useful home for academic resources
          </h2>
          <p className="mt-4 leading-7 text-slate-600 dark:text-gray-400">
            Browse materials by category, search for a subject, and check
            published news and notices. Students can contribute resources and
            showcase projects; teachers can help keep academic materials
            organized and up to date.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/academic/notes">Explore the library</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/network">Meet the community</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>

    <section className="container mx-auto max-w-7xl px-5 py-16 md:px-8 md:py-20">
      <div className="mb-8 max-w-2xl">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
          Made for everyday study
        </p>
        <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 dark:text-white sm:text-4xl">
          Useful whether you are looking or contributing
        </h2>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <article className="overflow-hidden">
          <img
            src="/assets/shared-learning.jpg"
            alt="A student using a laptop to work on coursework"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="pt-5">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              Find what you need
            </h3>
            <p className="mt-2 leading-7 text-slate-600 dark:text-gray-400">
              Search notes, past papers, syllabi, and timetables in one library,
              with information organized to make useful material easier to find.
            </p>
          </div>
        </article>
        <article className="overflow-hidden">
          <img
            src="/assets/academic-books.jpg"
            alt="Reference books and notebooks ready for study"
            loading="lazy"
            className="aspect-[16/9] w-full object-cover"
          />
          <div className="pt-5">
            <h3 className="text-xl font-semibold text-slate-950 dark:text-white">
              Share what has helped
            </h3>
            <p className="mt-2 leading-7 text-slate-600 dark:text-gray-400">
              Contribute study material, publish projects or articles, and help
              other students and teachers learn from practical experience.
            </p>
          </div>
        </article>
      </div>
    </section>

    <NewsletterSubscribe />
  </div>
);

export default OurPurpose;
