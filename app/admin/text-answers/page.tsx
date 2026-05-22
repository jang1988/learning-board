import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import TextAnswerReviewer from './TextAnswerReviewer'
import styles from './text-answers.module.css'

export default async function TextAnswersPage() {
	const supabase = await createClient()
	const {
		data: { user }
	} = await supabase.auth.getUser()
	if (!user) redirect('/auth/login')

	const { data: profile } = await supabase
		.from('profiles')
		.select('role')
		.eq('id', user.id)
		.single()
	if (profile?.role !== 'admin') redirect('/manager/dashboard')

	// Ответы ожидающие проверки
	const { data: pending } = await supabase
		.from('text_answers')
		.select(
			`
      id,
      answer_text,
      created_at,
      quiz_result_id,
      profiles!text_answers_user_id_fkey(full_name, email, department),
      questions(text, points, quizzes(title, topics(title)))
    `
		)
		.is('is_correct', null)
		.order('created_at', { ascending: true })

	// Уже проверенные (последние 30)
	const { data: reviewed } = await supabase
		.from('text_answers')
		.select(
			`
      id,
      answer_text,
      is_correct,
      reviewed_at,
      profiles!text_answers_user_id_fkey(full_name, email),
      questions(text, quizzes(title, topics(title)))
    `
		)
		.not('is_correct', 'is', null)
		.order('reviewed_at', { ascending: false })
		.limit(30)

	return (
		<div className={styles.page}>
			<div className={styles.header}>
				<div>
					<h1 className={styles.title}>Перевірка відповідей</h1>
					<p className={styles.sub}>Текстові відповіді студентів на ручну перевірку</p>
				</div>
				{(pending?.length ?? 0) > 0 && (
					<div className={styles.pendingBadge}>
						<div className={styles.pendingSpinnerWrap}>
							<span className={styles.pendingSpinner}></span>
							очікує перевірки
						</div>
					</div>
				)}
			</div>

			{/* Ожидают проверки */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>
					Очікують перевірки
					{(pending?.length ?? 0) > 0 && <span className={styles.count}>{pending!.length}</span>}
				</h2>

				{pending && pending.length > 0 ? (
					<div className={styles.cardList}>
						{pending.map(answer => (
							<TextAnswerReviewer
								key={answer.id}
								answer={answer}
								adminId={user.id}
							/>
						))}
					</div>
				) : (
					<div className={styles.empty}>
						<span>✓</span>
						<p>Всі відповіді перевірено</p>
					</div>
				)}
			</section>

			{/* Уже проверенные */}
			{reviewed && reviewed.length > 0 && (
				<section className={styles.section}>
					<h2 className={styles.sectionTitle}>
						Перевірені
						<span className={styles.count}>{reviewed.length}</span>
					</h2>
					<div className={styles.reviewedList}>
						{reviewed.map(r => (
							<div
								key={r.id}
								className={`${styles.reviewedRow} ${r.is_correct ? styles.rowCorrect : styles.rowWrong}`}
							>
								<div className={styles.revLeft}>
									<div className={styles.revUser}>{(r.profiles as any)?.full_name}</div>
									<div className={styles.revQuestion}>{(r.questions as any)?.text}</div>
									<div className={styles.revAnswer}>"{r.answer_text}"</div>
								</div>
								<div className={styles.revRight}>
									<span className={`badge ${r.is_correct ? 'badge--green' : 'badge--red'}`}>
										{r.is_correct ? '✓ Правильно' : '✕ Неправильно'}
									</span>
									<div className={styles.revDate}>
										{r.reviewed_at
											? new Date(r.reviewed_at).toLocaleDateString('uk-UA', {
													day: '2-digit',
													month: 'short',
													year: 'numeric'
												})
											: ''}
									</div>
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	)
}
