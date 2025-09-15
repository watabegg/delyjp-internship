"use client";

import {
	forwardRef,
	useCallback,
	useEffect,
	useId,
	useImperativeHandle,
	useRef,
	useState,
} from "react";
import Dialog from "./ui/Dialog";

type TimerDialogProps = {
	open: boolean;
	onClose: () => void;
	seconds: number;
};

export type TimerDialogHandle = {
	stop: () => void; // カウント停止（保持）
	reset: () => void; // 最初に戻して再開
	restart: () => void; // 一時停止状態から再開
};

const TimerDialog = forwardRef<TimerDialogHandle, TimerDialogProps>(
	({ open, onClose, seconds }, ref) => {
		const [time, setTime] = useState(seconds);
		const totalRef = useRef(Math.max(1, seconds));
		const dialogId = useId();
		const [digitH, setDigitH] = useState<number>(96);
		const intervalRef = useRef<number | null>(null);

		// Keep latest seconds in a ref (and avoid division by zero)
		useEffect(() => {
			totalRef.current = Math.max(1, seconds);
		}, [seconds]);

		useEffect(() => {
			if (open) setTime(seconds);
		}, [open, seconds]);

		// Ticking interval helpers
		const clearTick = useCallback(() => {
			if (intervalRef.current != null) {
				clearInterval(intervalRef.current);
				intervalRef.current = null;
			}
		}, []);

		const startTick = useCallback(() => {
			if (intervalRef.current != null) return; // already ticking
			if (!open) return;
			const id = window.setInterval(() => {
				setTime((t) => {
					if (t <= 1) {
						clearTick();
						return 0;
					}
					return t - 1;
				});
			}, 1000);
			intervalRef.current = id;
		}, [clearTick, open]);

		useEffect(() => {
			if (!open) return;
			clearTick();
			startTick();
			return clearTick;
		}, [open, clearTick, startTick]);

		useEffect(() => {
			if (time !== 0) return;
			let ctx: AudioContext | null = null;
			try {
				ctx = new window.AudioContext();
				const o = ctx.createOscillator();
				const g = ctx.createGain();
				o.type = "sine";
				o.frequency.value = 1200;
				o.connect(g);
				g.connect(ctx.destination);
				// Quick fade-in/out
				const now = ctx.currentTime;
				g.gain.setValueAtTime(0.0001, now);
				g.gain.exponentialRampToValueAtTime(0.3, now + 0.02);
				g.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
				o.start(now);
				o.stop(now + 0.4);
				const t = setTimeout(() => ctx?.close().catch(() => {}), 600);
				return () => clearTimeout(t);
			} catch {
				// ignore (autoplay restrictions or missing API)
			}
		}, [time]);

		useImperativeHandle(ref, () => ({
			stop: () => {
				clearTick();
			},
			reset: () => {
				clearTick();
				setTime(totalRef.current);
				startTick();
			},
			restart: () => {
				startTick();
			},
		}));

		const total = totalRef.current;
		const safeTotal = total || 1;
		const progress = Math.max(0, Math.min(1, time / safeTotal));
		const mm = Math.floor(time / 60)
			.toString()
			.padStart(2, "0");
		const ss = (time % 60).toString().padStart(2, "0");

		// Responsive digit height (avoid overflow on small screens)
		useEffect(() => {
			const update = () => {
				const vw = typeof window !== "undefined" ? window.innerWidth : 390;
				// roughly 28vw, clamped between 72px and 120px for better legibility
				const h = Math.round(Math.max(72, Math.min(120, vw * 0.28)));
				setDigitH(h);
			};
			update();
			if (!open) return; // listen while open only
			window.addEventListener("resize", update);
			return () => window.removeEventListener("resize", update);
		}, [open]);

		return (
			<Dialog
				id={dialogId}
				title="タイマー"
				open={open}
				onClose={onClose}
				className="w-full max-w-[min(92vw,24rem)] sm:max-w-md"
				isCloseButton={time === 0}
			>
				<div>
					{/* Device body */}
					<div className="relative mx-auto w-full rounded-[1.5rem] border border-slate-200 bg-white py-4 px-1 shadow-[0_10px_25px_rgba(0,0,0,0.08),inset_0_2px_0_rgba(255,255,255,0.8)]">
						{/* Brand */}
						<div className="pb-2 text-center text-[0.8rem] font-black tracking-[0.2em] text-sky-700">
							TIMER
						</div>

						{/* Display (Tanita-like) */}
						<div className="relative mx-auto overflow-hidden rounded-2xl border border-slate-300 bg-slate-200/90 p-3 shadow-inner">
							{/* Subtle progress bar (elapsed) */}
							<div className="absolute inset-x-3 bottom-3 h-1.5 rounded-full bg-slate-300/70">
								<div
									className="h-full rounded-full bg-sky-400/70 transition-[width] duration-300"
									style={{
										width: `${Math.min(100, Math.max(0, (1 - progress) * 100))}%`,
									}}
									aria-hidden
								/>
							</div>

							{/* 7-seg digits */}
							<div className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center px-1 pt-1 sm:gap-3 sm:px-2 sm:pt-2">
								<div className="mx-auto flex gap-1 sm:gap-2">
									<SevenSegDigit value={mm[0]} heightPx={digitH} />
									<SevenSegDigit value={mm[1]} heightPx={digitH} />
								</div>
								<Colon heightPx={digitH} />
								<div className="mx-auto flex gap-1 sm:gap-2">
									<SevenSegDigit value={ss[0]} heightPx={digitH} />
									<SevenSegDigit value={ss[1]} heightPx={digitH} />
								</div>
							</div>

							{/* 分・秒 labels */}
							<div className="relative z-10 mt-1 grid grid-cols-[1fr_auto_1fr] items-center text-[0.7rem] sm:text-[0.75rem]">
								<div className="text-center text-slate-600">分</div>
								<div />
								<div className="text-center text-slate-600">秒</div>
							</div>
						</div>
					</div>
				</div>
			</Dialog>
		);
	},
);

export default TimerDialog;

// 7-segment like digit (CSS rectangles). Intentionally simple and responsive.
function SevenSegDigit({
	value,
	heightPx = 96,
}: {
	value: string;
	heightPx?: number;
}) {
	const h = Math.max(48, Math.min(128, heightPx)); // clamp just in case
	const w = Math.round(h * 0.64); // slightly wider
	const t = Math.max(10, Math.round(h * 0.18)); // thicker for better legibility
	const v = (h - 2.2 * t) / 2; // longer verticals
	const on = "#0b1220"; // near-black for contrast
	const off = "#d7dde6"; // lighter off to emphasize ON
	const active: Record<string, string[]> = {
		"0": ["a", "b", "c", "d", "e", "f"],
		"1": ["b", "c"],
		"2": ["a", "b", "g", "e", "d"],
		"3": ["a", "b", "c", "d", "g"],
		"4": ["f", "g", "b", "c"],
		"5": ["a", "f", "g", "c", "d"],
		"6": ["a", "f", "e", "d", "c", "g"],
		"7": ["a", "b", "c"],
		"8": ["a", "b", "c", "d", "e", "f", "g"],
		"9": ["a", "b", "c", "d", "f", "g"],
	};
	const onSet = new Set(active[value] ?? []);
	return (
		<div className="relative shrink-0" style={{ width: w, height: h }}>
			{/* a */}
			<div
				style={{
					position: "absolute",
					top: 0,
					left: t,
					width: w - 2 * t,
					height: t,
					backgroundColor: onSet.has("a") ? on : off,
					boxShadow: onSet.has("a") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* b */}
			<div
				style={{
					position: "absolute",
					top: t,
					right: 0,
					width: t,
					height: v,
					backgroundColor: onSet.has("b") ? on : off,
					boxShadow: onSet.has("b") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* c */}
			<div
				style={{
					position: "absolute",
					bottom: t,
					right: 0,
					width: t,
					height: v,
					backgroundColor: onSet.has("c") ? on : off,
					boxShadow: onSet.has("c") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* d */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: t,
					width: w - 2 * t,
					height: t,
					backgroundColor: onSet.has("d") ? on : off,
					boxShadow: onSet.has("d") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* e */}
			<div
				style={{
					position: "absolute",
					bottom: t,
					left: 0,
					width: t,
					height: v,
					backgroundColor: onSet.has("e") ? on : off,
					boxShadow: onSet.has("e") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* f */}
			<div
				style={{
					position: "absolute",
					top: t,
					left: 0,
					width: t,
					height: v,
					backgroundColor: onSet.has("f") ? on : off,
					boxShadow: onSet.has("f") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
			{/* g */}
			<div
				style={{
					position: "absolute",
					top: (h - t) / 2,
					left: t,
					width: w - 2 * t,
					height: t,
					backgroundColor: onSet.has("g") ? on : off,
					boxShadow: onSet.has("g") ? "0 1px 1px rgba(0,0,0,0.25)" : undefined,
					borderRadius: t,
				}}
			/>
		</div>
	);
}

function Colon({ heightPx = 96 }: { heightPx?: number }) {
	const on = "#0b1220";
	const h = Math.max(48, Math.min(128, heightPx));
	const size = Math.round(h * 0.11);
	const gap = Math.round(h * 0.19);
	const containerW = Math.max(20, Math.round(h * 0.18));
	return (
		<div
			className="relative mx-1 flex items-center justify-center"
			style={{ height: h, width: containerW }}
		>
			<div
				style={{
					width: size,
					height: size,
					backgroundColor: on,
					borderRadius: 9999,
					position: "absolute",
					top: `calc(50% - ${gap}px)`,
				}}
			/>
			<div
				style={{
					width: size,
					height: size,
					backgroundColor: on,
					borderRadius: 9999,
					position: "absolute",
					top: `calc(50% + ${gap - size}px)`,
				}}
			/>
		</div>
	);
}
