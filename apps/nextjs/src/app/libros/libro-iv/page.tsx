import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIVClient from '~/app/libros/libro-iv/LibroIVClient';

export default async function LibroIVPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-iv');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-iv" />;
  }

  return <LibroIVClient token={token} />;
}
