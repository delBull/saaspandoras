import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIIClient from '~/app/libros/libro-ii/LibroIIClient';

export default async function LibroIIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-ii');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-ii" />;
  }

  return <LibroIIClient token={token} />;
}
