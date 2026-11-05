import { hasRole, requirePageRole } from '@/lib/authz';
import { addProperty } from '../actions';
import PropertyFormClient from '../PropertyFormClient';

export default async function AddProperty() {
    const user = await requirePageRole('agent');
    return <PropertyFormClient mode="add" action={addProperty} canVerify={hasRole(user.role, 'admin')} />;
}
