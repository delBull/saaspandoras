import { verifyBookToken } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIClient from '~/app/libros/libro-i/LibroIClient';

export default async function LibroIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = verifyBookToken(token);
  const authorized = !!payload && payload.bookSlug === 'libro-i';

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-i" />;
  }

  return <LibroIClient token={token} />;
}
