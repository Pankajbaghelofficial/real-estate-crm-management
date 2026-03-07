import BlogFormClient from '../BlogFormClient';
import { addBlog } from '../actions';

export default function AddBlogPage() {
    return <BlogFormClient mode="add" action={addBlog} />;
}
