import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

type Props = {
	userId: string
	lessonId: string
	topicId: string

	lessonsDone: number
	lessonsTotal: number
}

export async function completeLesson({
	userId,
	lessonId,
	topicId,
	lessonsDone,
	lessonsTotal
}: Props) {
	const { error } = await supabase.from('lesson_progress').upsert(
		{
			user_id: userId,
			lesson_id: lessonId,

			status: 'completed',

			completed_at: new Date().toISOString()
		},
		{
			onConflict: 'user_id,lesson_id'
		}
	)

	if (error) {
		throw error
	}

	const topicStatus = lessonsDone === lessonsTotal ? 'completed' : 'in_progress'

	const { data: existing } = await supabase
		.from('topic_progress')
		.select('started_at')
		.eq('user_id', userId)
		.eq('topic_id', topicId)
		.maybeSingle()
const { error: topicError } = await supabase.from('topic_progress').upsert(
  {
    user_id: userId,
    topic_id: topicId,
    status: topicStatus,
    lessons_done: lessonsDone,
    lessons_total: lessonsTotal,
    started_at: existing?.started_at ?? new Date().toISOString(),
    ...(topicStatus === 'completed'
      ? { completed_at: new Date().toISOString() }
      : {})
  },
  {
    onConflict: 'user_id,topic_id'
  }
)

if (topicError) {
  console.error('topic_progress upsert failed:', topicError)
  throw topicError
}
	await supabase.from('topic_progress').upsert(
		{
			user_id: userId,
			topic_id: topicId,

			status: topicStatus,

			lessons_done: lessonsDone,

			lessons_total: lessonsTotal,

			started_at: existing?.started_at ?? new Date().toISOString(),

			...(topicStatus === 'completed'
				? {
						completed_at: new Date().toISOString()
					}
				: {})
		},
		{
			onConflict: 'user_id,topic_id'
		}
	)
}
