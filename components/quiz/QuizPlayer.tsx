'use client'

import { useRef, useState } from 'react'
import styles from './VideoPlayer.module.css'

interface VideoPlayerProps {
	url: string
	title?: string
	onComplete?: () => void
}

function getEmbedUrl(url: string): string | null {
	const ytMatch = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
	)
	if (ytMatch) {
		return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1`
	}

	const vmMatch = url.match(/vimeo\.com\/(\d+)/)
	if (vmMatch) {
		return `https://player.vimeo.com/video/${vmMatch[1]}?title=0&byline=0&portrait=0`
	}

	if (url.includes('embed')) return url

	return null
}

export default function VideoPlayer({ url, title, onComplete }: VideoPlayerProps) {
	const [watched, setWatched] = useState(false)
	const isCompletedRef = useRef(false)

	const embedUrl = getEmbedUrl(url)

	const handleComplete = () => {
		if (isCompletedRef.current) return
		isCompletedRef.current = true

		setWatched(true)
		onComplete?.()
	}

	if (!embedUrl) {
		return (
			<div className={styles.error}>
				<span>⚠</span> Неверный URL видео
			</div>
		)
	}

	return (
		<div className={styles.wrapper}>
			<div className={styles.aspectBox}>
				<iframe
					src={embedUrl}
					className={styles.iframe}
					title={title ?? 'Видеоурок'}
					allowFullScreen
					loading="lazy"
					referrerPolicy="strict-origin-when-cross-origin"
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				/>
			</div>

			{!watched && onComplete && (
				<div className={styles.completeBar}>
					<span className={styles.completeHint}>
						Просмотрите видео, затем отметьте урок как завершённый
					</span>

					<button
						className={styles.completeBtn}
						onClick={handleComplete}
					>
						✓ Урок просмотрен
					</button>
				</div>
			)}

			{watched && (
				<div className={styles.doneBar}>
					✓ Урок відзначений як завершений
				</div>
			)}
		</div>
	)
}