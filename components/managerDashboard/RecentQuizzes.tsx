import styles from './RecentQuizzes.module.css'

export function RecentQuizzes({ recentResults }: any) {
	return (
		<section className={styles.section}>
			<div className={styles.sectionHeader}>
				<h2 className={styles.sectionTitle}>Останні тести</h2>
			</div>

			{recentResults && recentResults.length > 0 ? (
				<div className={styles.resultList}>
					{recentResults.map((r: any) => {
						const isPending = r.status === 'pending'
						return (
							<div
								key={r.id}
								className={styles.resultCard}
							>
								<div className={styles.resultInfo}>
									<div className={styles.resultTopic}>{(r.quizzes as any)?.topics?.title}</div>

									{isPending ? (
										<div className={styles.pendingLine}>
											<span className={styles.pendingDot}></span>
											<span className={styles.resultPending}>Очікує перевірки</span>
										</div>
									) : (
										<div className={styles.resultMeta}>
											<span className={`badge ${r.passed ? 'badge--green' : 'badge--red'}`}>
												{r.passed ? 'Складено' : 'Не складено'}
											</span>
										</div>
									)}
								</div>

								<div className={styles.resultRight}>
									{isPending ? (
										<div className={styles.resultScorePending}>
											<div className={styles.pendingSpinner}></div>
										</div>
									) : (
										<div
											className={`${styles.resultScore} ${
												r.passed ? styles.passed : styles.failed
											}`}
										>
											{r.percent}%
										</div>
									)}
								</div>
							</div>
						)
					})}
				</div>
			) : (
				<div className={styles.empty}>
					Ви ще не проходили тести.
					<br />
					Завершіть урок, щоб розблокувати тест.
				</div>
			)}
		</section>
	)
}
