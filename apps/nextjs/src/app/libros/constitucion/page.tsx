import { verifyBookToken, isTokenAuthorizedForBook } from '~/lib/books-auth';
import BooksAccessGate from '../BooksAccessGate';
import ConstitucionClient from '~/app/libros/constitucion/ConstitucionClient';

export default async function ConstitucionPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token ?? '';
  const payload = await verifyBookToken(token);
  const authorized = isTokenAuthorizedForBook(payload, 'constitucion');

  if (!authorized) {
    return <BooksAccessGate bookSlug="constitucion" />;
  }

  return <ConstitucionClient token={token} />;
}
