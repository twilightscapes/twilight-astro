import { siteConfig } from "@/site-config";
import { type CollectionEntry, getCollection } from "astro:content";

/** filter out draft posts based on the environment */
interface PostData {
  draft: boolean;
  // Add other properties as needed
}

export async function getAllPosts() {
	return await getCollection("post", ({ data }: { data: PostData }) => {
		return import.meta.env.PROD ? !data.draft : true;
	});
}

/** returns the date of the post based on option in siteConfig.sortPostsByUpdatedDate */
export function getPostSortDate(post: CollectionEntry<"post">) {
	return siteConfig.sortPostsByUpdatedDate && post.data.updatedDate !== undefined
		? new Date(post.data.updatedDate)
		: new Date(post.data.publishDate);
}

/** sort post by date (by siteConfig.sortPostsByUpdatedDate), desc.*/
export function sortMDByDate(posts: CollectionEntry<"post">[], prioritizeOrder = false) {
	return posts.sort((a, b) => {
		if (prioritizeOrder) {
			// Sticky posts come first
			const aIsSticky = a.data.sticky === true;
			const bIsSticky = b.data.sticky === true;
			
			if (aIsSticky && !bIsSticky) return -1;
			if (!aIsSticky && bIsSticky) return 1;
			// Both sticky or both not sticky: fall through to date sorting
		}
		const aDate = getPostSortDate(a).valueOf();
		const bDate = getPostSortDate(b).valueOf();
		return bDate - aDate;
	});
}

/** groups posts by year (based on option siteConfig.sortPostsByUpdatedDate), using the year as the key
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYear(posts: CollectionEntry<"post">[]) {
	return posts.reduce<Record<string, CollectionEntry<"post">[]>>((acc, post) => {
		const year = getPostSortDate(post).getFullYear();
		if (!acc[year]) {
			acc[year] = [];
		}
		acc[year]?.push(post);
		return acc;
	}, {});
}

/** groups posts by year and month (based on option siteConfig.sortPostsByUpdatedDate)
 *  Returns nested structure: { year: { month: [posts] } }
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 */
export function groupPostsByYearMonth(posts: CollectionEntry<"post">[]) {
	return posts.reduce<Record<string, Record<string, CollectionEntry<"post">[]>>>((acc, post) => {
		const date = getPostSortDate(post);
		const year = date.getFullYear().toString();
		const month = date.toLocaleString('en-US', { month: 'long' });
		
		if (!acc[year]) {
			acc[year] = {};
		}
		if (!acc[year][month]) {
			acc[year][month] = [];
		}
		acc[year][month]?.push(post);
		return acc;
	}, {});
}

/** returns all tags created from posts (inc duplicate tags)
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getAllTags(posts: CollectionEntry<"post">[]) {
	return posts.flatMap((post) => [...post.data.tags]);
}

/** returns all unique tags created from posts
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTags(posts: CollectionEntry<"post">[]) {
	return [...new Set(getAllTags(posts))];
}

/** returns a count of each unique tag - [[tagName, count], ...]
 *  Note: This function doesn't filter draft posts, pass it the result of getAllPosts above to do so.
 *  */
export function getUniqueTagsWithCount(posts: CollectionEntry<"post">[]): [string, number][] {
	return [
		...getAllTags(posts).reduce(
			(acc, t) => acc.set(t, (acc.get(t) ?? 0) + 1),
			new Map<string, number>(),
		),
	].sort((a, b) => b[1] - a[1]);
}
