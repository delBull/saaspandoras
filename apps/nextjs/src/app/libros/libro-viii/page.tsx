import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroVIIIClient from './LibroVIIIClient';

export default async function LibroVIIIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-viii');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-viii" />;
  }

  return <LibroVIIIClient token={token} />;
}
