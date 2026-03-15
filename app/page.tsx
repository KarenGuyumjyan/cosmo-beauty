import { redirect } from 'next/navigation';

// The middleware handles locale routing, but this catch-all
// ensures direct visits to "/" get redirected to the default locale.
export default function RootPage() {
  redirect('/en');
}
