import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIClient from '~/app/libros/libro-i/LibroIClient';

export default async function LibroIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-i');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-i" />;
  }

  return <LibroIClient token={token} />;
}
