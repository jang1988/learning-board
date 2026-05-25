import Link from 'next/link'
import styles from './TopicsSection.module.css'

export function TopicsSection({ enrichedTopics }: any) {
	
	return (
		<section className={styles.section}>
					<div className={styles.sectionHeader}>
						<h2 className={styles.sectionTitle}>Мої теми</h2>
						<Link
							href="/manager/topics"
							className={styles.seeAll}
						>
							Усі теми →
						</Link>
					</div>

					<div className={styles.topicList}>
						{enrichedTopics.slice(0, 4).map((topic: any) => (
							<Link
								href={`/manager/topics/${topic.id}`}
								key={topic.id}
								className={styles.topicCard}
							>
								<div className={styles.topicCardTop}>
									<span className={styles.topicTitle}>{topic.title}</span>

									<span
										className={`badge ${
											topic.status === 'completed'
												? 'badge--green'
												: topic.status === 'in_progress'
													? 'badge--blue'
													: 'badge--gray'
										}`}
										style={{ whiteSpace: 'nowrap' }}
									>
										{topic.status === 'completed'
											? '✓ Готово'
											: topic.status === 'in_progress'
												? 'У процесі'
												: 'Не розпочато'}
									</span>
								</div>

								{topic.status !== 'not_started' && (
									<div style={{ marginTop: 10 }}>
										<div
											style={{
												display: 'flex',
												justifyContent: 'space-between',
												fontSize: 12,
												color: 'var(--color-text-3)',
												marginBottom: 4
											}}
										>
											<span>
												{topic.lessonsDone} / {topic.lessonsTotal} уроків
											</span>
											<span>{topic.pct}%</span>
										</div>

										<div className="progress-bar">
											<div
												className={`progress-bar__fill ${
													topic.status === 'completed' ? 'progress-bar__fill--success' : ''
												}`}
												style={{ width: `${topic.pct}%` }}
											/>
										</div>
									</div>
								)}
							</Link>
						))}
					</div>
				</section>
	)
}