import { router } from 'expo-router';

// Static route takes precedence over [id].tsx in Expo Router.
// We navigate here but want the [id].tsx logic with id='new'.
// Solution: push with explicit params so [id].tsx receives id='new'.
// This file must NOT exist as a page — we rely on the dynamic route instead.
// Since this file exists, we make it immediately redirect with a stack replace
// to the dynamic route using a query param trick that satisfies Expo Router.
// Simplest fix: this file should not exist. But since it does, we navigate away instantly.

import { useEffect } from 'react';

export default function FacilityNewGate() {
  useEffect(() => {
    // Replace self so back button doesn't loop
    router.replace({ pathname: '/facility/[id]', params: { id: 'new' } });
  }, []);
  return null;
}
