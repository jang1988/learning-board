import { createClient } from '@/lib/supabase/server'
import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import LessonList from './LessonList'
import styles from './topic.module.css'

export default async function TopicPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: topic } = await supabase
    .from('topics')
    .select('*')
    .eq('id', id)
    .single()

  if (!topic) notFound()

  const { data: lessons } = await supabase
    .from('lessons')
    .select(`
      *,
      materials(*),
      lesson_progress!left(status, completed_at)
    `)
    .eq('topic_id', id)
    .eq('lesson_progress.user_id', user.id)
    .order('order_index')

  const { data: quiz } = await supabase
    .from('quizzes')
    .select(`*, questions(count)`)
    .eq('topic_id', id)
    .maybeSingle()

  // Последний результат теста
  const { data: quizResult } = await supabase
    .from('quiz_results')
    .select('*')
    .eq('user_id', user.id)
    .eq('quiz_id', quiz?.id ?? '')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const lessonsTotal   = lessons?.length ?? 0
  const lessonsDone    = lessons?.filter(l => l.lesson_progress?.[0]?.status === 'completed').length ?? 0
  const allLessonsDone = lessonsTotal > 0 && lessonsDone === lessonsTotal

  const attemptsDone = quizResult?.attempt_num ?? 0
  const attemptsLeft = quiz ? (quiz.max_attempts - attemptsDone) : 0

  // Флаги статуса теста
  const isPending  = quizResult?.status === 'pending'   // ждёт проверки
  const isReviewed = quizResult?.status === 'reviewed'  // проверен
  const hasPassed  = quizResult?.passed === true

  return (
    <div className={styles.page}>
      <div className={styles.breadcrumb}>
        <Link href="/manager/topics" className={styles.back}>← Всі теми</Link>
      </div>

      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>{topic.title}</h1>
          {topic.description && <p className={styles.desc}>{topic.description}</p>}
        </div>
        <div className={styles.headerStats}>
          <div className={styles.stat}>
            <span className={styles.statNum}>{lessonsDone}/{lessonsTotal}</span>
            <span className={styles.statLabel}>уроків</span>
          </div>
          {quiz && (
            <div className={styles.stat}>
              <span className={styles.statNum}>
                {isPending ? '⏳' : hasPassed ? '✓' : quizResult ? quizResult.percent + '%' : '—'}
              </span>
              <span className={styles.statLabel}>тест</span>
            </div>
          )}
        </div>
      </div>

      {lessonsTotal > 0 && (
        <div className={styles.progressWrap}>
          <div className={styles.progressInfo}>
            <span>Прогрес з уроків</span>
            <span>{Math.round((lessonsDone / lessonsTotal) * 100)}%</span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-bar__fill ${allLessonsDone ? 'progress-bar__fill--success' : ''}`}
              style={{ width: `${(lessonsDone / lessonsTotal) * 100}%` }}
            />
          </div>
        </div>
      )}

      <div className={styles.grid}>
        <div className={styles.lessons}>
          <h2 className={styles.sectionTitle}>Уроки</h2>
          <LessonList
            lessons={lessons ?? []}
            userId={user.id}
            topicId={id}
            lessonsTotal={lessonsTotal}
          />
        </div>

        {quiz && (
          <div className={styles.quizCard}>
            <div className={styles.quizIcon}>📝</div>
            <h3 className={styles.quizTitle}>{quiz.title}</h3>
            <div className={styles.quizMeta}>
              <span>{(quiz.questions as any)?.[0]?.count ?? 0} питань</span>
              <span>Прохідний бал: {quiz.passing_score}%</span>
              {quiz.time_limit_sec && (
                <span>⏱ {Math.round(quiz.time_limit_sec / 60)} хв</span>
              )}
            </div>

            {/* Ожидает проверки */}
            {isPending && (
              <div className={styles.quizPending}>
                <div className={styles.quizPendingIcon}>⏳</div>
                <div className={styles.quizPendingText}>Очікує перевірки</div>
                <div className={styles.quizPendingSub}>
                  Адміністратор перевіряє текстові відповіді.
                  Результат з'явиться після перевірки.
                </div>
              </div>
            )}

            {/* Результат после проверки */}
            {isReviewed && quizResult && (
              <div className={`${styles.quizResult} ${hasPassed ? styles.passed : styles.failed}`}>
                <span className={styles.quizScore}>{quizResult.percent}%</span>
                <span>{hasPassed ? '✓ Тест пройдено' : '✕ Не пройдено'}</span>
                <span className={styles.quizAttempt}>Спроба #{quizResult.attempt_num}</span>
              </div>
            )}

            {/* Нет попыток — заблокировано */}
            {!allLessonsDone && !quizResult && (
              <div className={styles.quizLocked}>
                🔒 Завершіть всі уроки, щоб розблокувати тест
              </div>
            )}

            {/* Кнопка пройти/повторить — только если не pending и не passed */}
            {!isPending && !hasPassed && (allLessonsDone || quizResult) && attemptsLeft > 0 && (
              <Link href={`/manager/topics/${id}/quiz`} className={styles.quizBtn}>
                {quizResult
                  ? `Спробувати знову (залишилося ${attemptsLeft})`
                  : 'Пройти тест'}
              </Link>
            )}

            {/* Попытки кончились */}
            {!isPending && !hasPassed && attemptsLeft <= 0 && quizResult && (
              <div className={styles.quizNoAttempts}>Спроби закінчились</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
