"use client";

import { useEffect, useState } from "react";
import type { ShortlinkEvent } from "@/db/schema";

export function useShortlinkEvents(slug = "w", refreshInterval = 300000) { // 5 mins
  const [events, setEvents] = useState<ShortlinkEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/admin/analytics/shortlinks?slug=${slug}`);

        if (!res.ok) {
          throw new Error(`Error ${res.status}: ${res.statusText}`);
        }

        const data = await res.json();
        setEvents(data.events || []);
        setError(null);
      } catch (err: any) {
        setError(err.message);
        setEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchEvents, refreshInterval);

    return () => clearInterval(interval);
  }, [slug, refreshInterval]);

  return { events, loading, error };
}
