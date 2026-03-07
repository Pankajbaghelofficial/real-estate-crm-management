'use client';

import { addProperty } from '../actions';
import PropertyFormClient from '../PropertyFormClient';

export default function AddProperty() {
    return <PropertyFormClient mode="add" action={addProperty} />;
}
