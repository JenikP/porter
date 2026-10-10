// Build first. Verify actual authenticated standalone production bundles.
process.env.PORTER_TEST_BUILD='true';
await import('./launch-check.mjs');