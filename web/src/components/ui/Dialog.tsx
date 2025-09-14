"use client";

import clsx from "clsx";
import { type ReactNode, useEffect } from "react";

type DialogProps = {
	id: string;
	title: string;
	children?: ReactNode;
	maxWidth?: string; // e.g. '640px' or '40rem'; prefer className for Tailwind sizing
	open: boolean;
	onClose: () => void;
	className?: string;
	isCloseButton?: boolean;
};

/**
 * Dialog Component Usage Example
 *
 * @example
 * 'use client'
 *
 * import { useState } from "react";
 * import Dialog from "./ui/Dialog";
 *
 * // Inside your component
 * const [isDialogOpen, setIsDialogOpen] = useState(false);
 *
 * return (
 *   <>
 *     {attributes.video_url && (
 *       <button
 *         type="button"
 *         onClick={() => setIsDialogOpen(true)}
 *         className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
 *       >
 *         動画を大きく見る
 *       </button>
 *     )}
 *     <Dialog
 *       id="video-dialog"
 *       title="動画ビューア"
 *       open={isDialogOpen}
 *       onClose={() => setIsDialogOpen(false)}
 *     >
 *       {attributes.video_url ? (
 *         <video
 *           controls
 *           className="w-full h-full max-h-[80vh]"
 *           src={attributes.video_url}
 *         >
 *           <track
 *             kind="captions"
 *             src="/captions/placeholder.vtt"
 *             srcLang="ja"
 *             label="Japanese captions"
 *             default
 *           />
 *         </video>
 *       ) : (
 *         <p className="p-4">動画が利用できません。</p>
 *       )}
 *     </Dialog>
 *   </>
 * );
 */

const Dialog = ({
	id,
	title,
	children,
	maxWidth,
	open,
	onClose,
	className,
	isCloseButton = true,
}: DialogProps) => {
	useEffect(() => {
		if (!open) return;
		const { body } = document;
		const prev = body.style.overflow;
		body.style.overflow = "hidden";
		return () => {
			body.style.overflow = prev;
		};
	}, [open]);

	// Close on ESC
	useEffect(() => {
		if (!open) return;
		const onKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [open, onClose]);

	if (!open) return null;

	return (
		<div
			id={id}
			role="dialog"
			aria-modal="true"
			aria-label={title}
			className="fixed inset-0 z-50 flex items-center justify-center"
		>
			<button
				type="button"
				className="absolute inset-0 bg-black/50 cursor-pointer"
				aria-label="Close dialog"
				onClick={onClose}
			/>

			<div
				className={clsx("relative z-10", className)}
				style={maxWidth ? { maxWidth } : undefined}
			>
				{isCloseButton && (
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="absolute right-2 top-2 text-white/80 hover:text-white z-20 text-3xl"
					>
						×
					</button>
				)}
				{children}
			</div>
		</div>
	);
};

export default Dialog;
