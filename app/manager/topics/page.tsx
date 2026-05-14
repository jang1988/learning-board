import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import styles from './topics.module.css'

export default async function ManagerTopics() {
  const supabase = await createClient()

  const {
    data: { user }
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: topics } = await supabase
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

  const enrichedTopics =
    topics?.map(topic => {
      const lessons = topic.lessons ?? []

      const lessonsTotal = lessons.length

      const lessonsDone = lessons.filter((l: any) =>
        l.lesson_progress?.some(
          (p: any) =>
            p.user_id === user.id &&
            p.status === 'completed'
        )
      ).length

      const status =
        lessonsDone === 0
          ? 'not_started'
          : lessonsDone === lessonsTotal
            ? 'completed'
            : 'in_progress'

      const pct =
        lessonsTotal > 0
          ? Math.round((lessonsDone / lessonsTotal) * 100)
          : 0

      const hasQuiz = (topic.quizzes?.length ?? 0) > 0

      return {
        ...topic,
        lessonsTotal,
        lessonsDone,
        status,
        pct,
        hasQuiz
      }
    }) ?? []

    

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Теми навчання</h1>
        <p className={styles.sub}>
          Вивчайте теми послідовно та проходьте тести
        </p>
      </div>

      <div className={styles.grid}>
        {enrichedTopics.map((topic, idx) => (
          <Link
            href={`/manager/topics/${topic.id}`}
            key={topic.id}
            className={styles.card}
          >
            <div className={styles.cardTop}>
              <div className={styles.num}>#{idx + 1}</div>

              <span
                className={`badge ${
                  topic.status === 'completed'
                    ? 'badge--green'
                    : topic.status === 'in_progress'
                      ? 'badge--blue'
                      : 'badge--gray'
                }`}
              >
                {topic.status === 'completed'
                  ? '✓ Завершено'
                  : topic.status === 'in_progress'
                    ? 'У процесі'
                    : 'Не розпочато'}
              </span>
            </div>

            <h2 className={styles.cardTitle}>{topic.title}</h2>

            {topic.description && (
              <p className={styles.cardDesc}>{topic.description}</p>
            )}

            <div className={styles.cardMeta}>
              <span>📹 {topic.lessonsTotal} уроків</span>
              {topic.hasQuiz && <span>📝 Тест</span>}
              {topic.is_required && (
                <span className={styles.required}>Обов'язкова</span>
              )}
            </div>

            {topic.status !== 'not_started' && (
              <div className={styles.progressWrap}>
                <div className={styles.progressTop}>
                  <span>
                    {topic.lessonsDone} / {topic.lessonsTotal} уроків
                  </span>
                  <span>{topic.pct}%</span>
                </div>

                <div className="progress-bar">
                  <div
                    className={`progress-bar__fill ${
                      topic.status === 'completed'
                        ? 'progress-bar__fill--success'
                        : ''
                    }`}
                    style={{ width: `${topic.pct}%` }}
                  />
                </div>
              </div>
            )}
          </Link>
        ))}

        {enrichedTopics.length === 0 && (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>▤</div>
            <div className={styles.emptyTitle}>Тем поки немає</div>
            <p className={styles.emptySub}>
              Адміністратор ще не додав теми навчання
            </p>
          </div>
        )}
      </div>
    </div>
  )
}