export interface Post {
  id: string
  type: 'article' | 'quote' | 'poster'
  title: string | null
  content: string | null
  image_url: string | null
  aspect_ratio: string | null
  division: string
  author_id: string
  author_name: string
  likes_count: number
  created_at: string
}