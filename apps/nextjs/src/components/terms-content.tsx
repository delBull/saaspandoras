import * as React from "react";
import {
  Tabs as TabsRoot,
  TabsContent as TabsContentRoot,
  TabsList as TabsListRoot,
  TabsTrigger as TabsTriggerRoot,
} from "@radix-ui/react-tabs";
import type { Dictionary } from "~/types";

interface Section {
  title: string;
  content?: string;
  items?: string[];
  email?: string;
}

type PrivacySections = Record<string, Section>;
export function TermsContent({ dict }: { dict: Dictionary }) {
  const currentDate = "Marzo 2025";

  const renderSectionItems = (items: string[]) => (
    <ul className="list-disc pl-6">
      {items.map((item: string, i: number) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );

  const renderPrivacySection = (section: Section, index: number) => {
    if (!section) return null;

    return (
      <section key={`privacy-section-${index}`} className="mt-8">
        <h2>
          {index + 3}. {section.title}
        </h2>
        {section.items && renderSectionItems(section.items)}
        {section.content && <p>{section.content}</p>}
        {section.email && (
          <p className="mt-2">📩 {section.email}</p>
        )}
      </section>
    );
  };

  // Get filtered and sorted privacy sections
  const getPrivacySections = () => {
    const sections = dict.privacy.sections as PrivacySections;
    return Object.entries(sections)
      .filter(([key]) => !['collection', 'usage'].includes(key))
      .map(([_, section], index) => renderPrivacySection(section, index));
  };

  return (
    <>
      <h1 className="mb-8 text-center text-4xl font-bold">{dict.terms.title}</h1>
      
      <div className="rounded-lg border bg-card p-8 text-card-foreground shadow">
        <TabsRoot defaultValue="terms" className="w-full">
          <TabsListRoot className="grid w-full grid-cols-2">
            <TabsTriggerRoot value="terms">{dict.terms.tabTerms}</TabsTriggerRoot>
            <TabsTriggerRoot value="privacy">{dict.terms.tabPrivacy}</TabsTriggerRoot>
          </TabsListRoot>
          
          <TabsContentRoot value="terms" className="space-y-6">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">
                {dict.terms.lastUpdate} {currentDate}
              </p>
              
              {/* Welcome section */}
              <section>
                <p>{dict.terms.sections.welcome.content}</p>
              </section>

              {/* Definitions section */}
              <section className="mt-8">
                <h2>1. {dict.terms.sections.definitions.title}</h2>
                {dict.terms.sections.definitions.items && 
                  renderSectionItems(dict.terms.sections.definitions.items)}
              </section>

              {/* Platform Usage section */}
              <section className="mt-8">
                <h2>2. {dict.terms.sections.usage.title}</h2>
                {dict.terms.sections.usage.items && 
                  renderSectionItems(dict.terms.sections.usage.items)}
              </section>

              {/* Responsibility section */}
              <section className="mt-8">
                <h2>3. {dict.terms.sections.responsibility.title}</h2>
                {dict.terms.sections.responsibility.items && 
                  renderSectionItems(dict.terms.sections.responsibility.items)}
              </section>

              {/* User Requirements section */}
              <section className="mt-8">
                <h2>4. {dict.terms.sections.requirements.title}</h2>
                {dict.terms.sections.requirements.items && 
                  renderSectionItems(dict.terms.sections.requirements.items)}
              </section>

              {/* Payments section */}
              <section className="mt-8">
                <h2>5. {dict.terms.sections.payments.title}</h2>
                {dict.terms.sections.payments.items && 
                  renderSectionItems(dict.terms.sections.payments.items)}
              </section>

              {/* Data Protection section */}
              <section className="mt-8">
                <h2>6. {dict.terms.sections.dataProtection.title}</h2>
                {dict.terms.sections.dataProtection.items && 
                  renderSectionItems(dict.terms.sections.dataProtection.items)}
              </section>

              {/* Applicable Law section */}
              <section className="mt-8">
                <h2>7. {dict.terms.sections.law.title}</h2>
                {dict.terms.sections.law.items && 
                  renderSectionItems(dict.terms.sections.law.items)}
              </section>
            </div>
          </TabsContentRoot>
          
          <TabsContentRoot value="privacy" className="space-y-6">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground">
                {dict.privacy.lastUpdate} {currentDate}
              </p>

              <p>{dict.privacy.introduction}</p>

              {/* Information Collection section */}
              <section className="mt-8">
                <h2>1. {dict.privacy.sections.collection.title}</h2>
                {dict.privacy.sections.collection.items && 
                  renderSectionItems(dict.privacy.sections.collection.items)}
              </section>

              {/* Information Usage section */}
              <section className="mt-8">
                <h2>2. {dict.privacy.sections.usage.title}</h2>
                {dict.privacy.sections.usage.items && 
                  renderSectionItems(dict.privacy.sections.usage.items)}
              </section>

              {/* Other privacy sections */}
              {getPrivacySections()}

              {/* Contact section */}
              <section className="mt-8">
                <h2>8. {dict.privacy.sections.contact.title}</h2>
                <p>{dict.privacy.sections.contact.content}</p>
                <p className="mt-2">📩 {dict.privacy.sections.contact.email}</p>
              </section>

              {/* Acceptance section */}
              <section className="mt-8 border-t pt-8">
                <h3>{dict.terms.acceptance.title}</h3>
                <p>{dict.terms.acceptance.content}</p>
              </section>
            </div>
          </TabsContentRoot>
        </TabsRoot>
      </div>
    </>
  );
}