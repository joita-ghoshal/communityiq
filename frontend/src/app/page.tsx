import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

export default function RootPage() {
  const cookieStore = cookies();
  const token = cookieStore.get('access_token')?.value;
  if (token) {
    redirect('/dashboard');
  } else {
    redirect('/login');
  }
}
