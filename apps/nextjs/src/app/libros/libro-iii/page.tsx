import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIIIClient from '~/app/libros/libro-iii/LibroIIIClient';

export default async function LibroIIIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-iii');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-iii" />;
  }

  return <LibroIIIClient token={token} />;
}
