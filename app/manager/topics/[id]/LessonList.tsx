'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import VideoPlayer from '@/components/video/VideoPlayer'
import styles from './topic.module.css'

interface Lesson {
  id: string
  title: string
  description?: string
  video_url: string
  order_index: number
  materials?: { id: string; title: string; url: string; type: string }[]
  lesson_progress?: { status: string; completed_at?: string }[]
}

interface Props {
  lessons: Lesson[]
  userId: string
  topicId: string
  lessonsTotal: number
}

export default function LessonList({ lessons, userId, topicId, lessonsTotal }: Props) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<Set<string>>(
    new Set(lessons.filter(l => l.lesson_progress?.[0]?.status === 'completed').map(l => l.id))
  )

  const handleComplete = async (lessonId: string) => {
    const supabase = createClient()

    await supabase.from('lesson_progress').upsert({
      user_id: userId,
      lesson_id: lessonId,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })

    const newCompleted = new Set(completedIds)
    newCompleted.add(lessonId)
    setCompletedIds(newCompleted)

    // Обновить прогресс темы
    const lessonsDone = newCompleted.size
    const status = lessonsDone === lessonsTotal ? 'completed' : 'in_progress'

    await supabase.from('topic_progress').upsert({
      user_id: userId,
      topic_id: topicId,
      status,
      lessons_done: lessonsDone,
      lessons_total: lessonsTotal,
      started_at: new Date().toISOString(),
      ...(status === 'completed' ? { completed_at: new Date().toISOString() } : {}),
    })
  }

  return (
    <div className={styles.lessonList}>
      {lessons.map((lesson, idx) => {
        const isDone = completedIds.has(lesson.id)
        const isOpen = expanded === lesson.id

        return (
          <div key={lesson.id} className={`${styles.lessonCard} ${isDone ? styles.lessonDone : ''}`}>
            <button
              className={styles.lessonHeader}
              onClick={() => setExpanded(isOpen ? null : lesson.id)}
            >
              <div className={styles.lessonLeft}>
                <div className={`${styles.lessonNum} ${isDone ? styles.lessonNumDone : ''}`}>
                  {isDone ? '✓' : idx + 1}
                </div>
                <div>
                  <div className={styles.lessonTitle}>{lesson.title}</div>
                  {lesson.description && !isOpen && (
                    <div className={styles.lessonSub}>{lesson.description}</div>
                  )}
                </div>
              </div>
              <div className={styles.lessonRight}>
                {isDone && <span className="badge badge--green">Переглянуто</span>}
                <span className={styles.chevron}>{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className={styles.lessonBody}>
                {lesson.description && (
                  <p className={styles.lessonDesc}>{lesson.description}</p>
                )}

                <VideoPlayer
                  url={lesson.video_url}
                  title={lesson.title}
                  onComplete={isDone ? undefined : () => handleComplete(lesson.id)}
                />

                {lesson.materials && lesson.materials.length > 0 && (
                  <div className={styles.materials}>
                    <div className={styles.materialsTitle}>📎 Доп. матеріали</div>
                    <div className={styles.materialsList}>
                      {lesson.materials.map(m => (
                        <a
                          key={m.id}
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.material}
                        >
                          <span className={styles.materialIcon}>
                            {m.type === 'pdf' ? '📄' : m.type === 'image' ? '🖼' : '🔗'}
                          </span>
                          {m.title}
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
