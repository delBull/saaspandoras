import { verifyBookToken } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIVClient from '~/app/libros/libro-iv/LibroIVClient';

export default async function LibroIVPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = verifyBookToken(token);
  const authorized = !!payload && payload.bookSlug === 'libro-iv';

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-iv" />;
  }

  return <LibroIVClient token={token} />;
}
