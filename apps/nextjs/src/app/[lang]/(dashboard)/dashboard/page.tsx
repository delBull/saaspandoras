import React, { Suspense } from "react";
import { redirect } from "next/navigation";

import { authOptions, getCurrentUser } from "@saasfly/auth";
import {
  Table,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@saasfly/ui/table";

import { EmptyPlaceholder } from "~/components/empty-placeholder";
import { DashboardHeader } from "~/components/header";
import { K8sCreateButton } from "~/components/k8s/cluster-create-button";
import { ClusterItem } from "~/components/k8s/cluster-item";
import { DashboardShell } from "~/components/shell";
import type { Locale } from "~/config/i18n-config";
import { getDictionary } from "~/lib/get-dictionary";
import type { Dictionary } from "~/types";
import { trpc } from "~/trpc/server";
import type { ClustersArray } from "~/types/k8s";

export const metadata = {
  title: "Dashboard",
};

// Separate component for the clusters list
function ClustersList({ clusters, dict }: { clusters: ClustersArray; dict: Dictionary }) {
  if (!Array.isArray(clusters) || clusters.length === 0) {
    return (
      <EmptyPlaceholder>
        <EmptyPlaceholder.Title>
          {dict.business.k8s.no_cluster_title}
        </EmptyPlaceholder.Title>
        <EmptyPlaceholder.Description>
          {dict.business.k8s.no_cluster_content}
        </EmptyPlaceholder.Description>
        <K8sCreateButton variant="outline" dict={dict.business} />
      </EmptyPlaceholder>
    );
  }

  return (
    <div className="divide-y divide-border rounded-md border">
      <div className="flex items-center justify-between p-4">
        <Table className="divide-y divide-gray-200">
          <TableCaption>A list of your k8s cluster .</TableCaption>
          <TableHeader>
            <TableRow className="hover:bg-gray-50">
              <TableHead className="w-[100px]">Name</TableHead>
              <TableHead>Location</TableHead>
              <TableHead>UpdatedAt</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>ACTION</TableHead>
            </TableRow>
          </TableHeader>
          {clusters.map((cluster) => (
            <ClusterItem
              key={String(cluster.id)}
              cluster={cluster}
            ></ClusterItem>
          ))}
        </Table>
      </div>
    </div>
  );
}

// Main dashboard component
export default async function DashboardPage({
  params: { lang },
}: {
  params: {
    lang: Locale;
  };
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect(authOptions?.pages?.signIn ?? "/login");
  }

  const dict = await getDictionary(lang);

  // Wrap data fetching in try-catch
  try {
    const customer = await trpc.customer.queryCustomer.query({
      userId: user.id,
    });

    if (!customer) {
      await trpc.customer.insertCustomer.mutate({
        userId: user.id,
      });
    }

    const result = await trpc.k8s.getClusters.query();

    return (
      <DashboardShell>
        <DashboardHeader
          heading="kubernetes"
          text={dict.common.dashboard.title_text}
        >
          <K8sCreateButton dict={dict.business} />
        </DashboardHeader>
        <Suspense
          fallback={
            <div className="divide-border-200 divide-y rounded-md border p-4">
              <div className="h-24 animate-pulse rounded bg-muted" />
            </div>
          }
        >
          <ClustersList clusters={result ?? []} dict={dict} />
        </Suspense>
      </DashboardShell>
    );
  } catch (error) {
    console.error("Error loading dashboard:", error);
    return (
      <DashboardShell>
        <DashboardHeader
          heading="Error"
          text="There was a problem loading the dashboard."
        />
      </DashboardShell>
    );
  }
}