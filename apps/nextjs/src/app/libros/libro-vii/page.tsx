import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroVIIClient from './LibroVIIClient';

export default async function LibroVIIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-vii');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-vii" />;
  }

  return <LibroVIIClient token={token} />;
}
