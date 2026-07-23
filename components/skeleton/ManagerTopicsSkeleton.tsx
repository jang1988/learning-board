import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import pageStyles from '@/app/manager/topics/topics.module.css'
import styles from './ManagerTopicsSkeleton.module.css'

export default function ManagerTopicsSkeleton() {
	return (
		<div className={pageStyles.page}>
			{/* Header */}
			<div className={styles.header}>
				<Skeleton
					width={320}
					height={40}
					borderRadius={10}
				/>

				<Skeleton
					width={460}
					height={18}
				/>
			</div>

			{/* Cards */}
			<div className={pageStyles.grid}>
				{Array.from({ length: 8 }).map((_, index) => (
					<div
						key={index}
						className={styles.card}
					>
						<Skeleton
							height={170}
							borderRadius={18}
						/>

						<div className={styles.content}>
							<Skeleton
								width="75%"
								height={22}
							/>

							<Skeleton
								width="100%"
								height={14}
							/>

							<Skeleton
								width="90%"
								height={14}
							/>

							<div className={styles.footer}>
								<Skeleton
									width={90}
									height={28}
									borderRadius={999}
								/>

								<Skeleton
									width={70}
									height={28}
									borderRadius={999}
								/>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}