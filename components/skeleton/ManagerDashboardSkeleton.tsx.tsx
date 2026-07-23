import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import styles from '@/app/manager/dashboard/dashboard.module.css'
import skeletonStyles from './ManagerDashboardSkeleton.module.css'

export default function ManagerDashboardSkeleton() {
	return (
		<div className={styles.page}>
			{/* Welcome */}
			<div className={styles.welcome}>
				<Skeleton  width={320} height={40} borderRadius={10} />
				<div style={{ marginTop: 12 }}>
					<Skeleton width={420} height={18} borderRadius={8} />
				</div>
			</div>

			{/* Stats */}
			<div className={skeletonStyles.statsGrid}>
				{Array.from({ length: 4 }).map((_, index) => (
					<div
						key={index}
						className={skeletonStyles.statCard}
					>
						<Skeleton
							circle
							width={54}
							height={54}
						/>

						<div className={skeletonStyles.statContent}>
							<Skeleton
								width={60}
								height={28}
							/>
							<Skeleton
								width={90}
								height={14}
							/>
						</div>
					</div>
				))}
			</div>

			{/* Progress */}
			<div className={styles.progressSection}>
				<Skeleton
					height={10}
					borderRadius={999}
				/>
			</div>

			{/* Grid */}
			<div className={styles.grid}>
				{/* Topics */}
				<div className={skeletonStyles.section}>
					<Skeleton
						width={180}
						height={24}
					/>

					<div className={skeletonStyles.list}>
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className={skeletonStyles.topicCard}
							>
								<Skeleton
									width="70%"
									height={20}
								/>

								<Skeleton
									width="95%"
									height={14}
								/>

								<Skeleton
									height={8}
									borderRadius={999}
								/>
							</div>
						))}
					</div>
				</div>

				{/* Recent quizzes */}
				<div className={skeletonStyles.section}>
					<Skeleton
						width={160}
						height={24}
					/>

					<div className={skeletonStyles.list}>
						{Array.from({ length: 5 }).map((_, index) => (
							<div
								key={index}
								className={skeletonStyles.resultCard}
							>
								<div>
									<Skeleton
										width={140}
										height={18}
									/>

									<Skeleton
										width={90}
										height={12}
									/>
								</div>

								<Skeleton
									width={50}
									height={26}
									borderRadius={999}
								/>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	)
}