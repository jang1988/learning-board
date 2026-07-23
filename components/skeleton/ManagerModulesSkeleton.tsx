import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

import pageStyles from '@/app/manager/modules/modules.module.css'
import styles from './ManagerModulesSkeleton.module.css'

export default function ManagerModulesSkeleton() {
	return (
		<div className={pageStyles.page}>
			<div>
				<Skeleton
					width={340}
					height={42}
					borderRadius={10}
				/>

				<div style={{ marginTop: 10 }}>
					<Skeleton
						width={420}
						height={18}
					/>
				</div>
			</div>

			<div className={pageStyles.wrapper}>
				{Array.from({ length: 6 }).map((_, index) => (
					<div
						key={index}
						className={pageStyles.card}
					>
						<div className={pageStyles.header}>
							<div className={styles.top}>
								<Skeleton
									width={90}
									height={28}
									borderRadius={999}
								/>
							</div>

							<div className={styles.center}>
								<Skeleton
									width="70%"
									height={26}
								/>

								<Skeleton
									width="90%"
									height={16}
								/>

								<Skeleton
									width="75%"
									height={16}
								/>
							</div>

							<div className={styles.bottom}>
								<Skeleton
									width="100%"
									height={10}
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