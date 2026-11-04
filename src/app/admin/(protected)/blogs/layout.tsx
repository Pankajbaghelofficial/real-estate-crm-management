import { requirePageRole } from '@/lib/authz';

// Server-side access control for this section (hiding the sidebar link is not enough).
export default async function SectionLayout({ children }: { children: React.ReactNode }) {
    await requirePageRole('admin');
    return <>{children}</>;
}
