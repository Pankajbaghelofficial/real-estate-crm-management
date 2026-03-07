'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function EditBlogForm({ blog, action }: { blog: any, action: (formData: FormData) => Promise<void> }) {
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
                    <h1 className="text-2xl font-bold text-[var(--color-dark-blue)]">Edit Blog Post</h1>
                    <p className="text-[var(--color-slate)]">Update article details and content</p>
                </div>
                <Link href="/admin/blogs" className="btn bg-gray-200 text-gray-800 hover:bg-gray-300 transition-colors px-4 py-2 rounded">
                    Back to Blogs
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border p-6 max-w-4xl">
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Title</label>
                            <input type="text" name="title" defaultValue={blog.title} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">URL Slug</label>
                            <input type="text" name="slug" defaultValue={blog.slug} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Category</label>
                            <input type="text" name="category_name" defaultValue={blog.category?.category_name} required className="form-input" />
                        </div>

                        <div>
                            <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Status</label>
                            <select name="status" defaultValue={blog.status} required className="form-input">
                                <option value="Draft">Draft</option>
                                <option value="Published">Published</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block mb-1 text-sm font-medium text-[var(--color-text-dark)]">Content</label>
                        <textarea name="content" defaultValue={blog.content} required rows={10} className="form-input"></textarea>
                    </div>

                    <div className="pt-4 border-t">
                        <button type="submit" disabled={loading} className="btn btn-primary w-full md:w-auto">
                            {loading ? 'Saving...' : 'Update Blog Post'}
                        </button>
                    </div>
                </form>
            </div>
        </>
    );
}
