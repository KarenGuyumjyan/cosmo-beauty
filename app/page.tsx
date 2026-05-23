import { permanentRedirect } from 'next/navigation';

// The middleware handles locale routing, but this catch-all
// ensures direct visits to "/" get permanently redirected (308) to the
// default locale — preserves PageRank for search engines.
export default function RootPage() {
  permanentRedirect('/ru');
}
