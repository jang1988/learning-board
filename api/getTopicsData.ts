import { createClient } from '@/lib/supabase/server'

export async function getTopics() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('topics')
    .select(`
      id,
      title,
      description,
      is_required,
      order_index,
      lessons(
        id,
        lesson_progress(status, user_id)
      ),
      quizzes(id)
    `)
    .order('order_index')

  if (error) {
    console.error(error)
    return []
  }

  return data ?? []
}