"use client";

import { useEffect, useState } from "react";
import FloatingPravixChat from "@/components/FloatingPravixChat";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function GlobalFloatingPravixChat() {
  const [signedIn, setSignedIn] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let mounted = true;

    const supabase = (() => {
      try {
        return getSupabaseBrowserClient();
      } catch {
        return null;
      }
    })();

    if (!supabase) {
      return;
    }

    const supabaseClient = supabase;

    async function syncCurrentUser() {
      const {
        data: { user },
      } = await supabaseClient.auth.getUser();

      if (mounted) {
        setSignedIn(Boolean(user));
      }
    }

    void syncCurrentUser();

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      if (!mounted) {
        return;
      }

      setSignedIn(Boolean(session?.user));
      setRefreshKey((current) => current + 1);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return <FloatingPravixChat signedIn={signedIn} refreshKey={refreshKey} />;
}
