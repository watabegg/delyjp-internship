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
		// 非モーダル化: 背景操作を許可するためスクロール固定は行わない
		if (!open) return;
		return () => {};
	}, [open]);

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
			aria-modal={false}
			aria-label={title}
			className="fixed inset-0 z-50 flex items-start justify-center p-3 pointer-events-none"
		>
			<div
				className={clsx("relative z-10 pointer-events-auto", className)}
				style={maxWidth ? { maxWidth } : undefined}
			>
				{isCloseButton && (
					<button
						type="button"
						aria-label="Close"
						onClick={onClose}
						className="absolute right-2 top-2 z-20 text-3xl text-slate-700 hover:text-slate-900"
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
