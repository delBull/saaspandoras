import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroIXClient from './LibroIXClient';

export default async function LibroIXPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-ix');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-ix" />;
  }

  return <LibroIXClient token={token} />;
}
