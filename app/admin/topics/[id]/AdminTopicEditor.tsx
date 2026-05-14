'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import styles from './editor.module.css'

interface Lesson {
	id: string
	title: string
	description?: string
	video_url: string
	order_index: number
	materials?: { id: string; title: string; url: string; type: string }[]
}

interface Props {
	topic: any
	lessons: Lesson[]
	quiz: any
}

export default function AdminTopicEditor({
	topic,
	lessons: initialLessons,
	quiz: initialQuiz
}: Props) {
	const router = useRouter()
	const supabase = createClient()

	const [lessons, setLessons] = useState<Lesson[]>(initialLessons)
	const [quiz, setQuiz] = useState(initialQuiz)
	const [saving, setSaving] = useState(false)
	const [msg, setMsg] = useState('')

	// --- Lesson ---
	const [newLesson, setNewLesson] = useState({ title: '', description: '', video_url: '' })

	const addLesson = async () => {
		if (!newLesson.title || !newLesson.video_url) return
		setSaving(true)
		const { data, error } = await supabase
			.from('lessons')
			.insert({
				topic_id: topic.id,
				title: newLesson.title,
				description: newLesson.description || null,
				video_url: newLesson.video_url,
				order_index: lessons.length
			})
			.select()
			.single()

		if (!error && data) {
			setLessons(prev => [...prev, data])
			setNewLesson({ title: '', description: '', video_url: '' })
			setMsg('Урок доданий!')
		}
		setSaving(false)
	}

	const deleteLesson = async (id: string) => {
		await supabase.from('lessons').delete().eq('id', id)
		setLessons(prev => prev.filter(l => l.id !== id))
		setMsg('Урок видалений!')
	}

	// --- Quiz ---
	const [newQ, setNewQ] = useState({ text: '', type: 'single', points: 1 })
	const [newAnswers, setNewAnswers] = useState([
		{ text: '', is_correct: false },
		{ text: '', is_correct: false },
		{ text: '', is_correct: false },
		{ text: '', is_correct: false }
	])

	const createQuiz = async () => {
		setSaving(true)
		const { data, error } = await supabase
			.from('quizzes')
			.insert({
				topic_id: topic.id,
				title: `Тест: ${topic.title}`,
				passing_score: 70,
				max_attempts: 3
			})
			.select()
			.single()

		if (!error) setQuiz({ ...data, questions: [] })
		setSaving(false)
		setMsg('Тест створено!')
	}

	const addQuestion = async () => {
		if (!quiz || !newQ.text) return
		setSaving(true)

		const { data: question } = await supabase
			.from('questions')
			.insert({
				quiz_id: quiz.id,
				text: newQ.text,
				type: newQ.type,
				points: newQ.points,
				order_index: quiz.questions?.length ?? 0
			})
			.select()
			.single()

		if (question) {
			const answersToInsert = newAnswers
				.filter(a => a.text.trim())
				.map((a, i) => ({
					question_id: question.id,
					text: a.text,
					is_correct: a.is_correct,
					order_index: i
				}))

			await supabase.from('answers').insert(answersToInsert)

			setQuiz((prev: any) => ({
				...prev,
				questions: [...(prev.questions ?? []), { ...question, answers: answersToInsert }]
			}))
			setNewQ({ text: '', type: 'single', points: 1 })
			setNewAnswers([
				{ text: '', is_correct: false },
				{ text: '', is_correct: false },
				{ text: '', is_correct: false },
				{ text: '', is_correct: false }
			])
			setMsg('Питання додано!')
		}
		setSaving(false)
	}

	const deleteQuestion = async (qId: string) => {
		await supabase.from('questions').delete().eq('id', qId)
		setQuiz((prev: any) => ({
			...prev,
			questions: prev.questions.filter((q: any) => q.id !== qId)
		}))
	}

	return (
		<div className={styles.page}>
			<div className={styles.topBar}>
				<button
					className={styles.back}
					onClick={() => router.push('/admin/topics')}
				>
					← Всі теми
				</button>
				<h1 className={styles.title}>{topic.title}</h1>
				{msg && <span className={styles.msg}>{msg}</span>}
			</div>

			{/* Lessons section */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Уроки ({lessons.length})</h2>

				<div className={styles.lessonList}>
					{lessons.map((l, idx) => (
						<div
							key={l.id}
							className={styles.lessonRow}
						>
							<div className={styles.lessonMeta}>
								<span className={styles.lessonIdx}>#{idx + 1}</span>
								<div>
									<div className={styles.lessonTitle}>{l.title}</div>
									<div className={styles.lessonUrl}>{l.video_url}</div>
								</div>
							</div>
							<button
								className={styles.deleteBtn}
								onClick={() => deleteLesson(l.id)}
							>
								✕
							</button>
						</div>
					))}
				</div>

				<div className={styles.addCard}>
					<h3 className={styles.addTitle}>Додати урок</h3>
					<div className={styles.addFields}>
						<input
							className={styles.input}
							placeholder="Назва уроку *"
							value={newLesson.title}
							onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))}
						/>
						<input
							className={styles.input}
							placeholder="YouTube посилання *"
							value={newLesson.video_url}
							onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
						/>
						<input
							className={styles.input}
							placeholder="Опис (опціонально)"
							value={newLesson.description}
							onChange={e => setNewLesson(p => ({ ...p, description: e.target.value }))}
						/>
					</div>
					<button
						className={styles.addBtn}
						onClick={addLesson}
						disabled={saving}
					>
						+ Додати урок
					</button>
				</div>
			</section>

			{/* Quiz section */}
			<section className={styles.section}>
				<h2 className={styles.sectionTitle}>Тест</h2>

				{!quiz ? (
					<div className={styles.noQuiz}>
						<p>Тест для цієї теми ще не створено</p>
						<button
							className={styles.addBtn}
							onClick={createQuiz}
							disabled={saving}
						>
							+ Створити тест
						</button>
					</div>
				) : (
					<>
						<div className={styles.quizInfo}>
							<span className="badge badge--blue">{quiz.passing_score}% — прохідний бал</span>
							<span className="badge badge--gray">{quiz.max_attempts} спроб</span>
							<span className="badge badge--green">{quiz.questions?.length ?? 0} питань</span>
						</div>

						{/* Existing questions */}
						<div className={styles.questionList}>
							{quiz.questions?.map((q: any, idx: number) => (
								<div
									key={q.id}
									className={styles.questionRow}
								>
									<div className={styles.questionMeta}>
										<span className={styles.qNum}>В{idx + 1}</span>
										<div>
											<div className={styles.qText}>{q.text}</div>
											<div className={styles.qType}>
												{q.type} · {q.points} бал
											</div>
										</div>
									</div>
									<button
										className={styles.deleteBtn}
										onClick={() => deleteQuestion(q.id)}
									>
										✕
									</button>
								</div>
							))}
						</div>

						{/* Add question */}
						<div className={styles.addCard}>
							<h3 className={styles.addTitle}>Додати питання</h3>
							<input
								className={styles.input}
								placeholder="Текст питання *"
								value={newQ.text}
								onChange={e => setNewQ(p => ({ ...p, text: e.target.value }))}
							/>
							<div className={styles.qOptions}>
								<select
									className={styles.select}
									value={newQ.type}
									onChange={e => setNewQ(p => ({ ...p, type: e.target.value }))}
								>
									<option value="single">Одина відповідь</option>
									<option value="multiple">Кілька відповідей</option>
									<option value="text">Текстова відповідь</option>
								</select>
								<input
									type="number"
									className={styles.input}
									style={{ width: 80 }}
									min={1}
									value={newQ.points}
									onChange={e => setNewQ(p => ({ ...p, points: Number(e.target.value) }))}
									placeholder="Бали"
								/>
							</div>

							{newQ.type !== 'text' && (
								<div className={styles.answersGrid}>
									{newAnswers.map((a, i) => (
										<div
											key={i}
											className={styles.answerRow}
										>
											<input
												type={newQ.type === 'single' ? 'radio' : 'checkbox'}
												checked={a.is_correct}
												onChange={() => {
													setNewAnswers(prev =>
														prev.map((ans, j) => ({
															...ans,
															is_correct:
																newQ.type === 'single'
																	? j === i
																	: j === i
																		? !ans.is_correct
																		: ans.is_correct
														}))
													)
												}}
												className={styles.answerCheck}
											/>
											<input
												className={styles.input}
												placeholder={`Варіант ${i + 1}`}
												value={a.text}
												onChange={e =>
													setNewAnswers(prev =>
														prev.map((ans, j) => (j === i ? { ...ans, text: e.target.value } : ans))
													)
												}
											/>
										</div>
									))}
									<p className={styles.hint}>☑ — відзнач правильну відповідь</p>
								</div>
							)}

							<button
								className={styles.addBtn}
								onClick={addQuestion}
								disabled={saving || !newQ.text}
							>
								+ Додати питання
							</button>
						</div>
					</>
				)}
			</section>
		</div>
	)
}
