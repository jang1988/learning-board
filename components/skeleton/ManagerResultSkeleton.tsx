import Skeleton from 'react-loading-skeleton'
import styles from '@/app/manager/results/results.module.css'

export default function ManagerResultSkeleton() {
	return (
		<div className={styles.page}>
			{/* Header */}
			<div className={styles.header}>
				<Skeleton
					width={280}
					height={34}
				/>

				<div style={{ marginTop: 10 }}>
					<Skeleton
						width={340}
						height={16}
					/>
				</div>
			</div>

			{/* Overall Card */}
			<div style={{ height: '188px' }} className={styles.overallCard}>
				<div className={styles.overallLeft}>
					<Skeleton
						circle
						width={92}
						height={92}
					/>
				</div>

				<div
					className={styles.overallRight}
					style={{ width: '100%' }}
				>
					<Skeleton
						width={260}
						height={22}
					/>

					<div style={{ marginTop: 10 }}>
						<Skeleton
							width={320}
							height={14}
						/>
					</div>

					<div style={{ marginTop: 18 }}>
						<Skeleton
							height={10}
							borderRadius={999}
						/>
					</div>

					<div
						style={{
							display: 'grid',
							gridTemplateColumns: 'repeat(4,1fr)',
							gap: 18,
							marginTop: 24
						}}
					>
						{Array.from({ length: 4 }).map((_, i) => (
							<div key={i}>
								<Skeleton
									width={40}
									height={28}
								/>

								<div style={{ marginTop: 6 }}>
									<Skeleton
										width={70}
										height={12}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>

			<div className={styles.grid}>
				{/* Topics */}
				<section className={styles.section}>
					<Skeleton
						width={170}
						height={22}
					/>

					<div
						style={{
							display: 'flex',
							flexDirection: 'column',
							gap: 12,
							marginTop: 18
						}}
					>
						{Array.from({ length: 7 }).map((_, i) => (
							<div
								key={i}
								className={styles.topicRow}
							>
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: 12
									}}
								>
									<Skeleton
										circle
										width={32}
										height={32}
									/>

									<div>
										<Skeleton
											width={180}
											height={14}
										/>

										<div style={{ marginTop: 8 }}>
											<Skeleton
												width={110}
												height={12}
											/>
										</div>
									</div>
								</div>

								<Skeleton
									width={90}
									height={10}
								/>
							</div>
						))}
					</div>
				</section>

				<div className={styles.rightCol}>
					{/* Quiz */}
					<section className={styles.section}>
						<Skeleton
							width={90}
							height={22}
						/>

						<div
							style={{
								display: 'grid',
								gridTemplateColumns: 'repeat(4,1fr)',
								gap: 12,
								marginTop: 18
							}}
						>
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									style={{ textAlign: 'center' }}
								>
									<Skeleton
										width={34}
										height={28}
									/>

									<div style={{ marginTop: 6 }}>
										<Skeleton
											width={45}
											height={12}
										/>
									</div>
								</div>
							))}
						</div>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 12,
								marginTop: 20
							}}
						>
							{Array.from({ length: 5 }).map((_, i) => (
								<div
									key={i}
									className={styles.quizRow}
								>
									<div>
										<Skeleton
											width={120}
											height={12}
										/>

										<div style={{ marginTop: 6 }}>
											<Skeleton
												width={150}
												height={14}
											/>
										</div>
									</div>

									<Skeleton
										width={70}
										height={28}
									/>
								</div>
							))}
						</div>
					</section>

					{/* History */}
					<section className={styles.section}>
						<Skeleton
							width={150}
							height={22}
						/>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								gap: 12,
								marginTop: 18
							}}
						>
							{Array.from({ length: 6 }).map((_, i) => (
								<div
									key={i}
									className={styles.historyRow}
								>
									<div>
										<Skeleton
											width={170}
											height={14}
										/>

										<div style={{ marginTop: 6 }}>
											<Skeleton
												width={120}
												height={12}
											/>
										</div>
									</div>

									<Skeleton
										width={40}
										height={22}
									/>
								</div>
							))}
						</div>
					</section>
				</div>
			</div>

			{/* Lessons */}
			<section
				className={styles.section}
				style={{ marginTop: 20 }}
			>
				<Skeleton
					width={220}
					height={22}
				/>

				<div
					className={styles.lessonGrid}
					style={{ marginTop: 18 }}
				>
					{Array.from({ length: 6 }).map((_, i) => (
						<div
							key={i}
							className={styles.lessonChip}
						>
							<Skeleton
								circle
								width={18}
								height={18}
							/>

							<div style={{ flex: 1 }}>
								<Skeleton
									width="90%"
									height={14}
								/>

								<div style={{ marginTop: 6 }}>
									<Skeleton
										width="60%"
										height={12}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</section>
		</div>
	)
}