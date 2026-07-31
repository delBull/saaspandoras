import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import LibroVIClient from './LibroVIClient';

export default async function LibroVIPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'libro-vi');

  if (!authorized) {
    return <BooksAccessGate bookSlug="libro-vi" />;
  }

  return <LibroVIClient token={token} />;
}
