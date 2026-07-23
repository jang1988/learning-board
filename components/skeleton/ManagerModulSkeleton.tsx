import Skeleton from 'react-loading-skeleton'
import styles from '@/app/manager/modules/[id]/module.module.css'

export default function ManagerModulSkeleton() {
	return (
		<div className={styles.page}>
			{/* Header */}
			<Skeleton
				width="100%"
				height={200}
				className={styles.header}
			></Skeleton>

			<div className={styles.topics}>
				{Array.from({ length: 9 }).map((_, index) => (
					<div
						key={index}
						className={styles.topic}
					>
						<div className={styles.topicHeader}>
							<Skeleton
								circle
								width={42}
								height={42}
							/>

							<div style={{ flex: 1 }}>
								<Skeleton
									width="75%"
									height={18}
								/>
							</div>
						</div>

						<div style={{ marginTop: 14 }}>
							<Skeleton
								height={12}
								width="100%"
							/>

							<div style={{ marginTop: 8 }}>
								<Skeleton
									height={12}
									width="82%"
								/>
							</div>

							<div style={{ marginTop: 8 }}>
								<Skeleton
									height={12}
									width="60%"
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
