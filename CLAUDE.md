# メモ（ユーザーの指示）

- X（旧Twitter）の投稿が直接見られない（ログインが必要・HTTP 402 など）ときは fxtwitter を使う。
  - 本文・投稿者・日時・添付（動画/画像）の情報（JSON）：`https://api.fxtwitter.com/<ユーザー名>/status/<投稿ID>`
  - ページとして見る：URL の `x.com`（`twitter.com`）を `fxtwitter.com`（または `fixupx.com`）に置きかえる
