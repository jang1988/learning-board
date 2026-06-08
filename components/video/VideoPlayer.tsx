'use client'

import { useState } from 'react'
import styles from './VideoPlayer.module.css'

interface VideoPlayerProps {
	url: string
	title?: string
	onComplete?: () => void
}

function getEmbedUrl(url: string): string | null {
	// YouTube
	const ytMatch = url.match(
		/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
	)
	if (ytMatch) {
		return `https://www.youtube.com/embed/${ytMatch[1]}?rel=0&modestbranding=1&enablejsapi=1`
	}

	// Vimeo
	const vmMatch = url.match(/vimeo\.com\/(\d+)/)
	if (vmMatch) {
		return `https://player.vimeo.com/video/${vmMatch[1]}?title=0&byline=0&portrait=0`
	}

	// Already an embed URL
	if (url.includes('embed')) return url

	return null
}

export default function VideoPlayer({ url, title, onComplete }: VideoPlayerProps) {
	const [watched, setWatched] = useState(false)
	const embedUrl = getEmbedUrl(url)

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
					allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
				/>
			</div>
			{!watched && onComplete && (
				<div className={styles.completeBar}>
					<span className={styles.completeHint}>
						Перегляньте відео, потім позначте урок як завершений
					</span>
					<button
						className={styles.completeBtn}
						onClick={() => {
							setWatched(true)
							onComplete()
						}}
					>
						✓ Урок переглянуто
					</button>
				</div>
			)}
			{watched && (
				<div className={styles.doneBar}>
					<span>✓</span> Урок відзначений як завершений
				</div>
			)}
		</div>
	)
}
