'use client';

import { useSession } from 'next-auth/react';
import ViewConflictReports from './ViewConflictReports';

export default function ConflictReportsPage() {
  const { data: session } = useSession();

  return <ViewConflictReports session={session} />;
}