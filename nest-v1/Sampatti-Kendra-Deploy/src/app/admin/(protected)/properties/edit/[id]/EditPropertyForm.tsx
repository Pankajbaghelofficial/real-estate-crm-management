'use client';

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

// Since this is a Client Component, we cannot directly import full Prisma models for types safely without causing large bundles,
// but we receive the property as generic serializable data from a server component wrapper.
// So we use a separate Server Component to fetch the data and pass it here.

export default function EditPropertyForm({ property, action }: { property: any, action: (formData: FormData) => Promise<void> }) {
    const [loading, setLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.currentTarget);
        await action(formData);
    }

    return (
        <>
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[var(--color-dark-blue)]">Edit Property</h1>
                    <p className="text-[var(--color-slate)]">Update details for this listing</p>
                </div>
                <Link href="/admin/properties" className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors px-4 py-2 rounded">
                    Back to Properties
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Title</label>
                            <input type="text" name="title" defaultValue={property.title} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Price</label>
                            <input type="text" name="price" defaultValue={property.price} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Location</label>
                            <input type="text" name="location" defaultValue={property.location} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Area Size</label>
                            <input type="text" name="area_size" defaultValue={property.area_size} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Property Type</label>
                            <select name="property_type" defaultValue={property.property_type} required className="form-input">
                                <option value="Residential">Residential</option>
                                <option value="Commercial">Commercial</option>
                                <option value="Villa">Villa</option>
                                <option value="Shop">Shop</option>
                            </select>
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Status</label>
                            <select name="status" defaultValue={property.status} required className="form-input">
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Description</label>
                        <textarea name="description" defaultValue={property.description} required rows={5} className="form-input"></textarea>
                    </div>

                    <div className="flex items-center gap-2">
                        <input type="checkbox" name="is_featured" id="is_featured" defaultChecked={property.is_featured} className="w-4 h-4 text-[var(--color-dark-blue)]" />
                        <label htmlFor="is_featured" className="text-sm font-medium text-[var(--color-text-dark)]">Mark as Featured Property</label>
                    </div>

                    <div className="pt-4 border-t">
                        <button type="submit" disabled={loading} className="btn btn-primary w-full md:w-auto">
                            {loading ? 'Saving...' : 'Update Property'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
