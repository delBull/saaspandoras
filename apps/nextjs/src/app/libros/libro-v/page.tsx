import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroVClient from './LibroVClient';

export default async function LibroVPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-v');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-v" />;
  }

  return <LibroVClient token={token} />;
}
