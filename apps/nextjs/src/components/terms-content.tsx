import * as React from "react";
import {
  Tabs as TabsRoot,
  TabsContent as TabsContentRoot,
  TabsList as TabsListRoot,
  TabsTrigger as TabsTriggerRoot,
} from "@radix-ui/react-tabs";
import type { Dictionary, Section } from "~/types";

export function TermsContent({ dict }: { dict: Dictionary }) {
  const renderSectionItems = (items: string[]) => (
    <ul className="list-disc pl-6 space-y-2">
      {items.map((item: string, i: number) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );

  const renderSection = (
    section: Section,
    index: number,
    prefix: string = "",
  ) => {
    if (!section) return null;
    return (
      <section key={`${prefix}-section-${index}`} className="mt-8">
        <h2 className="text-xl font-semibold mb-4 text-foreground">
          {index + 1}. {section.title}
        </h2>
        {section.content && (
          <p className="mb-4 text-muted-foreground">{section.content}</p>
        )}
        {section.items &&
          section.items.length > 0 &&
          renderSectionItems(section.items)}
        {section.email && <p className="mt-2">📩 {section.email}</p>}
      </section>
    );
  };

  const TERMS_SECTIONS = [
    "nature",
    "roles",
    "no_investment",
    "blockchain",
    "services",
    "payments",
    "liability",
    "ip",
    "termination",
    "law",
    "acceptance",
  ];

  const PRIVACY_SECTIONS = [
    "scope",
    "collection",
    "purpose",
    "legal_basis",
    "sharing",
    "international",
    "retention",
    "rights",
    "security",
    "other_agreements",
    "updates",
    "contact",
  ];

  return (
    <>
      <h1 className="mb-8 text-center text-4xl font-bold">
        {dict.terms.title}
      </h1>

      <div className="rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <TabsRoot defaultValue="terms" className="w-full">
          <TabsListRoot className="grid w-full grid-cols-2 mb-8 bg-muted rounded-lg p-1">
            <TabsTriggerRoot
              value="terms"
              className="py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
            >
              {dict.terms.tabTerms}
            </TabsTriggerRoot>
            <TabsTriggerRoot
              value="privacy"
              className="py-2.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-md"
            >
              {dict.terms.tabPrivacy}
            </TabsTriggerRoot>
          </TabsListRoot>

          <TabsContentRoot value="terms" className="space-y-6 outline-none">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground mb-8">
                {dict.terms.lastUpdate}
              </p>

              {TERMS_SECTIONS.map((key, index) => {
                const section = dict.terms.sections[key];
                return section ? renderSection(section, index, "terms") : null;
              })}
            </div>
          </TabsContentRoot>

          <TabsContentRoot value="privacy" className="space-y-6 outline-none">
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-sm text-muted-foreground mb-8">
                {dict.privacy.lastUpdate}
              </p>

              <p className="mb-8 text-muted-foreground">
                {dict.privacy.introduction}
              </p>

              {PRIVACY_SECTIONS.map((key, index) => {
                const section = dict.privacy.sections[key];
                return section
                  ? renderSection(section, index, "privacy")
                  : null;
              })}
            </div>
          </TabsContentRoot>
        </TabsRoot>
      </div>
    </>
  );
}
