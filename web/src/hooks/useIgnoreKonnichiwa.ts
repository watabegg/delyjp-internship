import { useMemo } from "react";

/**
 * 「こんにちは/こんにちわ」に近い挨拶表現をテキストから除去します。
 * - かな/カナのゆらぎ（こ/コ、ん/ン、に/ニ、ち/チ、は/ハ、わ/ワ、ゃ/ャ、や/ヤ）を吸収
 * - 省略形（こんちは、こんちわ、こんちゃ）をサポート
 * - 末尾の長音（ー, ｰ, 〜, ~）や簡単な終端記号（!！?？。、,.・ など）も併せて削除
 */
export function ignoreKonnichiwa(input: string): string {
	if (!input) return input;

	// 「こんにちは」近辺のコア表現
	const core = String.raw`[こコ][んン][にニ]?[ちチ](?:[はハ]|[わワ]|[ゃャ]|[やヤ])?`;
	// 長音や簡単な終端記号
	const longMark = String.raw`[ーｰ〜~]*`;
	const tailPunct = String.raw`[!！?？。、,.・…]*`;

	const greetingRegex = new RegExp(`${core}${longMark}${tailPunct}`, "g");

	// 該当の挨拶表現を除去
	let out = input.replace(greetingRegex, "");

	// 連続スペースの圧縮（全角スペースも対象）
	out = out.replace(/[\s\u3000]+/g, " ").trim();
	return out;
}

export type IgnoreGreetingFn = (text: string) => string;

/**
 * React用のフック。メモ化された除去関数を返します。
 */
export function useIgnoreKonnichiwa(): IgnoreGreetingFn {
	return useMemo(() => (text: string) => ignoreKonnichiwa(text), []);
}

export default useIgnoreKonnichiwa;
