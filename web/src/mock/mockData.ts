import { RecipeDetail } from "@/types/recipe";

// NOTE: 現時点では利用しない
export const mockRecipeInstructions: RecipeDetail[] = [
  {
    id: "1",
    type: "videos",
    attributes: {
      title: "桃の切り方　レシピ・作り方",
      description:
        "桃の切り方のご紹介です。今回は包丁を使って、桃をひと切れずつ切り分ける方法をご紹介します。果汁たっぷりな桃も、この切り方をマスターすれば、余すところなく食べることができますよ。ぜひ試してみてください。",
      cooking_time: 10,
      estimated_cost: 200,
      ingredients: "【材料】 1個分\n桃　　　　　　　　　　　　1個\n\n",
      instructions: [
        "桃は水でやさしく洗い、産毛を取っておきます。",
        "1. 桃は皮付きのまま種に沿って一周切りこみを入れます。",
        "2. 桃を両手で持ち、右手と左手で反対方向にひねります。",
        "3. 種が付いていない方は、そのまま4等分に切ります。",
        "4. 種が付いている方は、一切れずつ包丁で切りこみを入れて切り分けます。最後の一切れは種を包丁で取り除きます。",
        "5. 桃の果肉と皮の境目に包丁を入れて、皮を剥がすようにむきます。",
      ],
      tips: [
        "桃の切り方はいくつかありますが、今回は柔らかい身の部分を傷つけにくい方法をご紹介しています。",
      ],
      review_score: 4.3,
      video_url:
        "https://video.kurashiru.com/production/videos/71056e2e-7da2-4ae2-b1d7-62b6258f3906/webm/master.webm",
      thumbnail_url:
        "https://video.kurashiru.com/production/videos/71056e2e-7da2-4ae2-b1d7-62b6258f3906/compressed_thumbnail_square_normal.jpg?1756918045",
      category: ["スイーツ"],
      comment: ["日持ちはどれくらいですか？"],
      taberepos: [
        "わかりやすくて簡単に切れました。",
        "タネがそんなに簡単に取れませんでした。半分にした際に種無しの方はレシピ通りきれいに切れましたが、種付きの方がうまく切れませんでした。",
      ],
    },
  },
  {
    id: "2",
    type: "videos",
    attributes: {
      title: "きゅうりの板ずり　レシピ・作り方",
      description:
        "きゅうりの板ずりのご紹介です。ちょっとしたひと手間で食感や見た目の仕上がりが変わります。水分が抜けるので、より素材の味を濃く感じられ、調味料も馴染みやすくなります。下処理の方法をマスターして、いろいろな料理に応用してみてください。",
      cooking_time: 10,
      estimated_cost: 100,
      ingredients:
        "【材料】 2人前\nきゅうり　　　　　　　　　　　　1本\n塩　　　　　　　　　　　　適量\n\n",
      instructions: [
        "きゅうりは洗った後、水気をふき取っておきます。",
        "1. きゅうりはヘタを切り落とします。",
        "2. 全体に塩を振りかけます。",
        "3. 両手の手のひらできゅうりをゴロゴロと前後に転がします。",
        "4. 流水で塩を洗い流します。",
      ],
      tips: [
        "板ずりとは、まな板の上に素材を置き、塩を振りかけ手のひらで転がす下準備の事です。板ずりすることで、表面が滑らかになります。又、野菜の色を鮮やかにし、味がなじみやすくなります。急ぐときはまな板を使わず直接きゅうりに塩をまぶしてこすっても構いません。",
      ],
      review_score: 1.2,
      video_url:
        "https://video.kurashiru.com/production/videos/8344b7fa-6ae5-4425-9e0c-d3f2b7dd12bb/webm/master.webm",
      thumbnail_url:
        "https://video.kurashiru.com/production/videos/8344b7fa-6ae5-4425-9e0c-d3f2b7dd12bb/compressed_thumbnail_square_normal.jpg?1753395477",
      category: ["野菜", "夏野菜", "きゅうり"],
      comment: null,
      taberepos: null,
    },
  },
  {
    id: "3",
    type: "videos",
    attributes: {
      title: "じゃがいものいちょう切り　レシピ・作り方",
      description:
        "じゃがいものいちょう切りの切り方のご紹介です。いちょう切りは炒め物、汁物に用いる切り方です。大根、カブ、にんじんなどにもよく用いる切り方です。基本の切り方をマスターして色々な料理に挑戦してみてください。",
      cooking_time: 10,
      estimated_cost: 100,
      ingredients: "【材料】 2人前\nじゃがいも　　　　　　　　　　　　1個\n\n",
      instructions: [
        "1. じゃがいもは包丁で皮を剥き芽を取り除きます。",
        "2. 半分に切り、切り口を下にして置き、更に2等分にします。",
        "3. 向きを変えて端から一定の幅で切ります。",
      ],
      tips: [
        "料理方法によって異なりますが、いちょう切りの幅は5mmから8mm程度です。4等分にした素材を2本揃えて切ると早く切ることができます。",
      ],
      review_score: 2.1,
      video_url:
        "https://video.kurashiru.com/production/videos/7c8d124a-3fb9-4062-b469-7369847ea48d/webm/master.webm",
      thumbnail_url:
        "https://video.kurashiru.com/production/videos/7c8d124a-3fb9-4062-b469-7369847ea48d/compressed_thumbnail_square_normal.jpg?1753395477",
      category: ["野菜", "じゃがいも"],
      comment: null,
      taberepos: null,
    },
  },
  {
    id: "4",
    type: "videos",
    attributes: {
      title: "キャベツの千切り　レシピ・作り方",
      description:
        "基本の切り方、キャベツの千切りのご紹介です。千という漢字が入っているように、細く切って仕上げます。サラダや和え物など、さまざまな料理で活躍しますので、ぜひマスターしてみてくださいね。",
      cooking_time: 5,
      estimated_cost: 100,
      ingredients: "【材料】 3枚分\nキャベツ　　　　　　　　　　　　3枚\n\n",
      instructions: [
        "1. キャベツは重ねて手前から巻きます。",
        "2. 端から1～3mm幅に切ります。",
      ],
      tips: [
        "料理方法によって異なりますが、いちょう切りの幅は5mmから8mm程度です。4等分にした素材を2本揃えて切ると早く切ることができます。",
      ],
      review_score: 2.1,
      video_url:
        "https://video.kurashiru.com/production/videos/7c8d124a-3fb9-4062-b469-7369847ea48d/webm/master.webm",
      thumbnail_url:
        "https://video.kurashiru.com/production/videos/7c8d124a-3fb9-4062-b469-7369847ea48d/compressed_thumbnail_square_normal.jpg?1753395477",
      category: ["野菜", "じゃがいも"],
      comment: null,
      taberepos: null,
    },
  },
];
